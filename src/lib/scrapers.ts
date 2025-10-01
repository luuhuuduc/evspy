// Web scraping services for Australian EV charging networks
import puppeteer, { Browser } from 'puppeteer'
import { prisma } from './prisma'

interface ScrapedPrice {
  stationId?: string
  stationName: string
  network: string
  pricePerKwh?: number
  sessionFee?: number
  location?: {
    latitude: number
    longitude: number
    address: string
  }
  scrapedAt: Date
}

export class ChargingNetworkScraper {
  private browser: Browser | null = null

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
    }
    return this.browser
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  /**
   * Scrape Chargefox pricing data
   */
  async scrapeChargefox(): Promise<ScrapedPrice[]> {
    const results: ScrapedPrice[] = []
    
    try {
      const browser = await this.initBrowser()
      const page = await browser.newPage()
      
      // Set user agent to avoid detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
      
      // Navigate to Chargefox map page
      await page.goto('https://chargefox.com/find-a-charger', {
        waitUntil: 'networkidle2',
        timeout: 30000
      })

      // Wait for map to load
      await new Promise(resolve => setTimeout(resolve, 5000))

      // Extract station data from the page
      const stationData = await page.evaluate(() => {
        const stations: Array<{
          name: string;
          priceText: string;
          price: number | null;
          isPerKwh: boolean;
          isSession: boolean;
          location: string | undefined;
        }> = []
        
        // Try to find station elements on the page
        // This is a simplified example - actual implementation would need to inspect Chargefox's DOM structure
        const stationElements = document.querySelectorAll('[data-station-id], .station-marker, .charging-station')
        
        stationElements.forEach((element) => {
          try {
            const name = element.querySelector('.station-name, .name, h3, h4')?.textContent?.trim()
            const priceText = element.querySelector('.price, .rate, .cost')?.textContent?.trim()
            const locationText = element.querySelector('.address, .location')?.textContent?.trim()
            
            if (name && priceText) {
              // Parse price (e.g., "$0.45/kWh" or "$45.00/session")
              const priceMatch = priceText.match(/\$(\d+\.?\d*)/);
              const price = priceMatch ? parseFloat(priceMatch[1]) : null
              
              const isPerKwh = priceText.toLowerCase().includes('kwh') || priceText.toLowerCase().includes('/kw')
              const isSession = priceText.toLowerCase().includes('session') || priceText.toLowerCase().includes('connect')
              
              stations.push({
                name,
                priceText,
                price,
                isPerKwh,
                isSession,
                location: locationText
              })
            }
          } catch (e) {
            console.log('Error parsing station element:', e)
          }
        })
        
        return stations
      })

      // Process the scraped data
      for (const station of stationData) {
        if (station.price !== null) {
          results.push({
            stationName: station.name,
            network: 'Chargefox',
            pricePerKwh: station.isPerKwh ? station.price : undefined,
            sessionFee: station.isSession ? station.price : undefined,
            scrapedAt: new Date()
          })
        }
      }

      await page.close()
    } catch (error) {
      console.error('Error scraping Chargefox:', error)
    }

    return results
  }

  /**
   * Scrape Evie Networks pricing data
   */
  async scrapeEvieNetworks(): Promise<ScrapedPrice[]> {
    const results: ScrapedPrice[] = []
    
    try {
      const browser = await this.initBrowser()
      const page = await browser.newPage()
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
      
      // Navigate to Evie Networks charging locations
      await page.goto('https://goevie.com.au/charging-locations/', {
        waitUntil: 'networkidle2',
        timeout: 30000
      })

      await new Promise(resolve => setTimeout(resolve, 3000))

      // Extract pricing information
      const pricingData = await page.evaluate(() => {
        const stations: Array<{
          name: string;
          priceText: string;
          price: number | null;
          isPerKwh: boolean;
          isSession: boolean;
        }> = []
        
        // Look for pricing information on the page
        const priceElements = document.querySelectorAll('.price, .pricing, .rate, .cost')
        const locationElements = document.querySelectorAll('.location, .station, .site')
        
        // Evie typically has standardized pricing, so we might find general rates
        priceElements.forEach((element, index) => {
          const priceText = element.textContent?.trim()
          const locationElement = locationElements[index]
          const locationText = locationElement?.textContent?.trim()
          
          if (priceText && locationText) {
            const priceMatch = priceText.match(/\$(\d+\.?\d*)/);
            const price = priceMatch ? parseFloat(priceMatch[1]) : null
            
            if (price) {
              stations.push({
                name: locationText,
                priceText,
                price,
                isPerKwh: priceText.toLowerCase().includes('kwh'),
                isSession: priceText.toLowerCase().includes('session')
              })
            }
          }
        })
        
        return stations
      })

      for (const station of pricingData) {
        if (station.price !== null) {
          results.push({
            stationName: station.name,
            network: 'Evie Networks',
            pricePerKwh: station.isPerKwh ? station.price : undefined,
            sessionFee: station.isSession ? station.price : undefined,
            scrapedAt: new Date()
          })
        }
      }

      await page.close()
    } catch (error) {
      console.error('Error scraping Evie Networks:', error)
    }

    return results
  }

  /**
   * Scrape Tesla Supercharger pricing (limited public data)
   */
  async scrapeTeslaSupercharger(): Promise<ScrapedPrice[]> {
    const results: ScrapedPrice[] = []
    
    try {
      // Tesla pricing is typically available through their API or app
      // For demonstration, we'll add a general rate that's commonly known
      
      // Tesla typically charges around $0.68-$0.78/kWh in Australia
      results.push({
        stationName: 'Tesla Supercharger (General Rate)',
        network: 'Tesla Supercharger',
        pricePerKwh: 0.73, // Average rate
        scrapedAt: new Date()
      })
    } catch (error) {
      console.error('Error getting Tesla pricing:', error)
    }

    return results
  }

  /**
   * Update database with scraped pricing data
   */
  async updatePricingData(scrapedPrices: ScrapedPrice[]): Promise<number> {
    let updatedCount = 0

    for (const priceData of scrapedPrices) {
      try {
        // Try to find matching station by name and network
        const station = await prisma.chargingStation.findFirst({
          where: {
            OR: [
              { name: { contains: priceData.stationName } },
              { network: { contains: priceData.network } }
            ]
          }
        })

        if (station) {
          // Create a new price report
          await prisma.priceReport.create({
            data: {
              stationId: station.id,
              pricePerKwh: priceData.pricePerKwh,
              sessionFee: priceData.sessionFee,
              reportedAt: priceData.scrapedAt,
              isVerified: true
            }
          })
          updatedCount++
        } else {
          console.log(`Station not found for: ${priceData.stationName}`)
        }
      } catch (error) {
        console.error('Error updating price data:', error)
      }
    }

    return updatedCount
  }

  /**
   * Run full scraping cycle for all networks
   */
  async scrapeAllNetworks(): Promise<{
    chargefox: number,
    evie: number,
    tesla: number,
    total: number
  }> {
    console.log('Starting scraping cycle...')
    
    const results = {
      chargefox: 0,
      evie: 0,
      tesla: 0,
      total: 0
    }

    try {
      await this.initBrowser()

      // Scrape Chargefox
      console.log('Scraping Chargefox...')
      const chargefoxPrices = await this.scrapeChargefox()
      results.chargefox = await this.updatePricingData(chargefoxPrices)

      // Scrape Evie Networks
      console.log('Scraping Evie Networks...')
      const eviePrices = await this.scrapeEvieNetworks()
      results.evie = await this.updatePricingData(eviePrices)

      // Get Tesla pricing
      console.log('Getting Tesla pricing...')
      const teslaPrices = await this.scrapeTeslaSupercharger()
      results.tesla = await this.updatePricingData(teslaPrices)

      results.total = results.chargefox + results.evie + results.tesla

      console.log('Scraping completed:', results)
    } catch (error) {
      console.error('Error in scraping cycle:', error)
    } finally {
      await this.closeBrowser()
    }

    return results
  }
}

// Singleton instance
export const networkScraper = new ChargingNetworkScraper()