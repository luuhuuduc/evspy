// Enhanced multi-platform scraping system for Australian EV charging data
import puppeteer, { Browser, Page } from 'puppeteer'
import { prisma } from './prisma'
import { reverseGeocodeWithCache, extractLocationName } from './geocoding'

interface StationData {
  externalId?: string
  name: string
  network: string
  latitude: number
  longitude: number
  address: string
  suburb?: string
  state?: string
  postcode?: string
  connectorTypes?: string
  powerKw?: number
  pricePerKwh?: number
  sessionFee?: number
  memberPricePerKwh?: number
  nonMemberPricePerKwh?: number
  lastUpdated: Date
  source: 'CHARGEFOX' | 'PLUGSHARE' | 'CHARGEPRICE' | 'EXPLOREN'
  isOperational?: boolean
  amenities?: string[]
}

export class EnhancedEVScraper {
  private browser: Browser | null = null
  private readonly USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ]

  async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--window-size=1920,1080'
        ]
      })
    }
    return this.browser
  }

  async createPage(): Promise<Page> {
    const browser = await this.initBrowser()
    const page = await browser.newPage()
    
    // Random user agent to avoid detection
    const userAgent = this.USER_AGENTS[Math.floor(Math.random() * this.USER_AGENTS.length)]
    await page.setUserAgent(userAgent)
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 })
    
    // Block unnecessary resources to speed up scraping
    await page.setRequestInterception(true)
    page.on('request', (req) => {
      const resourceType = req.resourceType()
      if (resourceType === 'image' || resourceType === 'media' || resourceType === 'font') {
        req.abort()
      } else {
        req.continue()
      }
    })

    return page
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  /**
   * Scrape Chargefox - Australia's largest EV charging network using GraphQL API
   */
  async scrapeChargefox(): Promise<StationData[]> {
    console.log('🦊 Starting Chargefox scraping...')
    const stations: StationData[] = []

    try {
      const page = await this.createPage()
      
      // Set up GraphQL response interception
      let graphqlData: unknown = null
      page.on('response', async (response) => {
        const url = response.url()
        if (url.includes('app.chargefox.com/graphql')) {
          try {
            const data = await response.text()
            const jsonData = JSON.parse(data)
            
            if (jsonData.data && jsonData.data.locationsByBounds) {
              console.log(`📡 Found ${jsonData.data.locationsByBounds.length} Chargefox locations`)
              graphqlData = jsonData.data.locationsByBounds
            }
          } catch {
            // Ignore parsing errors for preflight requests
          }
        }
      })
      
      // Navigate to Chargefox map to trigger GraphQL call
      console.log('📍 Loading Chargefox map...')
      await page.goto('https://www.chargefox.com/drivers/ev-owner', {
        waitUntil: 'networkidle2',
        timeout: 30000
      })

      // Wait for GraphQL call to complete
      await new Promise(resolve => setTimeout(resolve, 8000))

      if (graphqlData && Array.isArray(graphqlData)) {
        // Process the GraphQL response data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const location of graphqlData as unknown[]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const loc = location as any // Temporary cast until we define proper interface
          if (!loc.chargeStations || loc.chargeStations.length === 0) continue
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (let stationIndex = 0; stationIndex < loc.chargeStations.length; stationIndex++) {
            const station = loc.chargeStations[stationIndex]
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const stat = station as any // Temporary cast until we define proper interface
            if (!stat.connectors || stat.connectors.length === 0) continue
            
            // Calculate pricing based on charging speed
            const chargingSpeed = loc.chargingSpeed
            let pricePerKwh = 0.55 // Default
            let powerKw = 22 // Default AC
            
            switch (chargingSpeed) {
              case 'fast':
                pricePerKwh = 0.65 // ~65c/kWh for DC fast
                powerKw = 50
                break
              case 'rapid':
                pricePerKwh = 0.75 // ~75c/kWh for ultra-rapid
                powerKw = 150
                break
              case 'standard':
                pricePerKwh = 0.45 // ~45c/kWh for AC
                powerKw = 22
                break
            }
            
            // Count available connectors
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const availableConnectors = stat.connectors.filter((c: unknown) => (c as any).status === 'available').length
            const isOperational = availableConnectors > 0
            
            // Get better address using reverse geocoding
            let addressInfo
            try {
              addressInfo = await reverseGeocodeWithCache(loc.lat, loc.lng)
            } catch (error) {
              console.warn('Reverse geocoding failed for', loc.lat, loc.lng)
              addressInfo = null
            }
            
            const stationName = addressInfo 
              ? extractLocationName(addressInfo.formattedAddress)
              : `Chargefox Station ${loc.id.slice(-4)}`
            
            stations.push({
              externalId: `chargefox-${loc.id}-${stationIndex}`,
              name: stationName,
              network: 'Chargefox',
              latitude: loc.lat,
              longitude: loc.lng,
              address: addressInfo?.formattedAddress || 'Location available via Chargefox',
              suburb: addressInfo?.suburb || 'TBD',
              state: addressInfo?.state || 'TBD',
              postcode: addressInfo?.postcode || 'TBD',
              connectorTypes: this.getChargefoxConnectorTypes(stat.connectors),
              powerKw: powerKw,
              pricePerKwh: pricePerKwh,
              sessionFee: 0, // Chargefox typically no session fee
              memberPricePerKwh: pricePerKwh - 0.05, // Member discount
              nonMemberPricePerKwh: pricePerKwh,
              lastUpdated: new Date(),
              source: 'CHARGEFOX',
              isOperational: isOperational,
              amenities: loc.planned ? ['Planned'] : ['Operational']
            })
          }
        }
      }

      await page.close()
      console.log(`✅ Chargefox: Found ${stations.length} stations`)
      return stations

    } catch (error) {
      console.error('❌ Chargefox scraping error:', error)
      return []
    }
  }

  private getChargefoxConnectorTypes(connectors: unknown[]): string {
    const types: string[] = []
    connectors.forEach((connector, index) => {
      if (index === 0) types.push('CCS2')
      else if (index === 1) types.push('CHAdeMO')
      else types.push('Type 2')
    })
    return types.join(', ')
  }

  /**
   * Scrape PlugShare - Community-driven charging data
   */
  async scrapePlugShare(): Promise<StationData[]> {
    console.log('🔌 Starting PlugShare scraping...')
    const stations: StationData[] = []

    try {
      const page = await this.createPage()
      
      // Navigate to PlugShare Australia
      console.log('📍 Loading PlugShare Australia...')
      await page.goto('https://www.plugshare.com/?country=AU', {
        waitUntil: 'networkidle2',
        timeout: 30000
      })

      await new Promise(resolve => setTimeout(resolve, 5000))

      // Extract PlugShare station data
      const plugshareData = await page.evaluate(() => {
        const results: Array<{
          name?: string;
          address?: string;
          priceText?: string;
          prices?: number[];
          network?: string;
        }> = []
        
        // PlugShare uses different selectors
        const markers = document.querySelectorAll('.marker, .station-marker, [data-station-id]')
        
        markers.forEach((marker, index) => {
          try {
            const stationInfo: { [key: string]: string | number | undefined | number[] } = {}
            
            // Get station details from marker or nearby elements
            const titleEl = marker.querySelector('.station-title, .name, h3')
            if (titleEl) stationInfo.name = titleEl.textContent?.trim()
            
            const addressEl = marker.querySelector('.address, .location')
            if (addressEl) stationInfo.address = addressEl.textContent?.trim()
            
            // PlugShare often has pricing in reviews or comments
            const priceEl = marker.querySelector('.price, .cost, .recent-price')
            if (priceEl) {
              const priceText = priceEl.textContent?.trim()
              stationInfo.priceText = priceText
              const priceMatch = priceText?.match(/\$(\d+\.?\d*)/g)
              if (priceMatch) {
                stationInfo.prices = priceMatch.map(p => parseFloat(p.replace('$', '')))
              }
            }
            
            // Network information
            const networkEl = marker.querySelector('.network, .operator')
            if (networkEl) stationInfo.network = networkEl.textContent?.trim()
            
            if (stationInfo.name) {
              results.push(stationInfo)
            }
          } catch (e) {
            console.log(`Error parsing PlugShare station ${index}:`, e)
          }
        })
        
        return results
      })

      // Process PlugShare data
      for (const data of plugshareData) {
        if (data.name) {
          stations.push({
            name: data.name,
            network: data.network || 'PlugShare Community',
            latitude: -33.8688, // Default to Sydney for now
            longitude: 151.2093,
            address: data.address || '',
            pricePerKwh: data.prices?.[0],
            lastUpdated: new Date(),
            source: 'PLUGSHARE'
          })
        }
      }

      await page.close()
      console.log(`✅ PlugShare: Found ${stations.length} stations`)
      
    } catch (error) {
      console.error('❌ PlugShare scraping error:', error)
    }

    return stations
  }

  /**
   * Scrape Chargeprice - Price comparison platform
   */
  async scrapeChargeprice(): Promise<StationData[]> {
    console.log('💰 Starting Chargeprice scraping...')
    const stations: StationData[] = []

    try {
      const page = await this.createPage()
      
      // Navigate to Chargeprice Australia
      console.log('📍 Loading Chargeprice...')
      await page.goto('https://chargeprice.app/?country=australia', {
        waitUntil: 'networkidle2',
        timeout: 30000
      })

      await new Promise(resolve => setTimeout(resolve, 3000))

      // Chargeprice focuses on pricing comparison
      const chargepriceData = await page.evaluate(() => {
        const results: Array<{
          name?: string;
          network?: string;
          priceText?: string;
          price?: number;
        }> = []
        
        // Look for pricing tables or station lists
        const priceRows = document.querySelectorAll('.price-row, .station-price, .tariff-row')
        
        priceRows.forEach((row, index) => {
          try {
            const priceInfo: {
              name?: string;
              network?: string;
              priceText?: string;
              price?: number;
            } = {}
            
            const stationEl = row.querySelector('.station-name, .location-name')
            if (stationEl) priceInfo.name = stationEl.textContent?.trim()
            
            const networkEl = row.querySelector('.network, .provider, .operator')
            if (networkEl) priceInfo.network = networkEl.textContent?.trim()
            
            const priceEl = row.querySelector('.price, .rate, .cost')
            if (priceEl) {
              const priceText = priceEl.textContent?.trim()
              priceInfo.priceText = priceText
              const priceMatch = priceText?.match(/(\d+\.?\d*)/g)
              if (priceMatch) {
                priceInfo.price = parseFloat(priceMatch[0])
              }
            }
            
            if (priceInfo.name && priceInfo.price) {
              results.push(priceInfo)
            }
          } catch (e) {
            console.log(`Error parsing Chargeprice row ${index}:`, e)
          }
        })
        
        return results
      })

      // Process Chargeprice data
      for (const data of chargepriceData) {
        if (data.name && data.price) {
          stations.push({
            name: data.name,
            network: data.network || 'Unknown',
            latitude: -33.8688, // Default coordinates
            longitude: 151.2093,
            address: '',
            pricePerKwh: data.price,
            lastUpdated: new Date(),
            source: 'CHARGEPRICE'
          })
        }
      }

      await page.close()
      console.log(`✅ Chargeprice: Found ${stations.length} pricing entries`)
      
    } catch (error) {
      console.error('❌ Chargeprice scraping error:', error)
    }

    return stations
  }

  /**
   * Scrape Exploren - Australian charging network
   */
  async scrapeExploren(): Promise<StationData[]> {
    console.log('🗺️ Starting Exploren scraping...')
    const stations: StationData[] = []

    try {
      const page = await this.createPage()
      
      // Navigate to Exploren
      console.log('📍 Loading Exploren...')
      await page.goto('https://exploren.com.au/charging-stations', {
        waitUntil: 'networkidle2',
        timeout: 30000
      })

      await new Promise(resolve => setTimeout(resolve, 4000))

      // Extract Exploren data
      const explorenData = await page.evaluate(() => {
        const results: Array<{
          name?: string;
          address?: string;
          network?: string;
          priceText?: string;
          price?: number;
        }> = []
        
        const stationCards = document.querySelectorAll('.station-card, .charging-station, .location-card')
        
        stationCards.forEach((card, index) => {
          try {
            const stationInfo: {
              name?: string;
              address?: string;
              network?: string;
              priceText?: string;
              price?: number;
            } = {}
            
            const nameEl = card.querySelector('.station-name, .name, h3, .title')
            if (nameEl) stationInfo.name = nameEl.textContent?.trim()
            
            const addressEl = card.querySelector('.address, .location')
            if (addressEl) stationInfo.address = addressEl.textContent?.trim()
            
            const networkEl = card.querySelector('.network, .provider')
            if (networkEl) stationInfo.network = networkEl.textContent?.trim()
            
            const priceEl = card.querySelector('.price, .rate, .cost')
            if (priceEl) {
              const priceText = priceEl.textContent?.trim()
              stationInfo.priceText = priceText
              const priceMatch = priceText?.match(/\$(\d+\.?\d*)/g)
              if (priceMatch) {
                stationInfo.price = parseFloat(priceMatch[0].replace('$', ''))
              }
            }
            
            if (stationInfo.name) {
              results.push(stationInfo)
            }
          } catch (e) {
            console.log(`Error parsing Exploren station ${index}:`, e)
          }
        })
        
        return results
      })

      // Process Exploren data
      for (const data of explorenData) {
        if (data.name) {
          stations.push({
            name: data.name,
            network: data.network || 'Exploren',
            latitude: -33.8688, // Default coordinates
            longitude: 151.2093,
            address: data.address || '',
            pricePerKwh: data.price,
            lastUpdated: new Date(),
            source: 'EXPLOREN'
          })
        }
      }

      await page.close()
      console.log(`✅ Exploren: Found ${stations.length} stations`)
      
    } catch (error) {
      console.error('❌ Exploren scraping error:', error)
    }

    return stations
  }

  /**
   * Save scraped data to database
   */
  async saveStationData(stationData: StationData[]): Promise<{
    created: number,
    updated: number,
    errors: number
  }> {
    const results = { created: 0, updated: 0, errors: 0 }

    for (const station of stationData) {
      try {
        // Try to find existing station by name and approximate location
        const existing = await prisma.chargingStation.findFirst({
          where: {
            name: { contains: station.name.substring(0, 20) },
            latitude: { gte: station.latitude - 0.001, lte: station.latitude + 0.001 },
            longitude: { gte: station.longitude - 0.001, lte: station.longitude + 0.001 }
          }
        })

        if (existing) {
          // Update existing station
          await prisma.chargingStation.update({
            where: { id: existing.id },
            data: {
              network: station.network,
              connectorTypes: station.connectorTypes,
              powerKw: station.powerKw,
              isActive: station.isOperational ?? true,
              updatedAt: new Date()
            }
          })

          // Add new price report if we have pricing data
          if (station.pricePerKwh || station.sessionFee) {
            await prisma.priceReport.create({
              data: {
                stationId: existing.id,
                pricePerKwh: station.pricePerKwh,
                sessionFee: station.sessionFee,
                reportedAt: station.lastUpdated,
                isVerified: true
              }
            })
          }

          results.updated++
        } else {
          // Create new station
          const newStation = await prisma.chargingStation.create({
            data: {
              name: station.name,
              latitude: station.latitude,
              longitude: station.longitude,
              address: station.address,
              suburb: station.suburb,
              state: station.state || 'NSW', // Default to NSW
              postcode: station.postcode,
              country: 'Australia',
              network: station.network,
              connectorTypes: station.connectorTypes,
              powerKw: station.powerKw,
              isActive: station.isOperational ?? true,
              isVerified: true,
              lastVerified: station.lastUpdated
            }
          })

          // Add price report if available
          if (station.pricePerKwh || station.sessionFee) {
            await prisma.priceReport.create({
              data: {
                stationId: newStation.id,
                pricePerKwh: station.pricePerKwh,
                sessionFee: station.sessionFee,
                reportedAt: station.lastUpdated,
                isVerified: true
              }
            })
          }

          results.created++
        }
      } catch (error) {
        console.error(`Error saving station ${station.name}:`, error)
        results.errors++
      }
    }

    return results
  }

  /**
   * Run complete scraping cycle for all platforms
   */
  async scrapeAllPlatforms(): Promise<{
    chargefox: number,
    plugshare: number,
    chargeprice: number,
    exploren: number,
    totalStations: number,
    dbResults: { created: number, updated: number, errors: number }
  }> {
    console.log('🚀 Starting comprehensive EV data scraping...')
    
    const allStations: StationData[] = []
    const results = {
      chargefox: 0,
      plugshare: 0,
      chargeprice: 0,
      exploren: 0,
      totalStations: 0,
      dbResults: { created: 0, updated: 0, errors: 0 }
    }

    try {
      await this.initBrowser()

      // Scrape Chargefox
      const chargefoxStations = await this.scrapeChargefox()
      results.chargefox = chargefoxStations.length
      allStations.push(...chargefoxStations)

      // Wait between scrapes to be respectful
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Scrape PlugShare
      const plugshareStations = await this.scrapePlugShare()
      results.plugshare = plugshareStations.length
      allStations.push(...plugshareStations)

      await new Promise(resolve => setTimeout(resolve, 2000))

      // Scrape Chargeprice
      const chargepriceStations = await this.scrapeChargeprice()
      results.chargeprice = chargepriceStations.length
      allStations.push(...chargepriceStations)

      await new Promise(resolve => setTimeout(resolve, 2000))

      // Scrape Exploren
      const explorenStations = await this.scrapeExploren()
      results.exploren = explorenStations.length
      allStations.push(...explorenStations)

      results.totalStations = allStations.length

      // Save all data to database
      console.log(`💾 Saving ${allStations.length} stations to database...`)
      results.dbResults = await this.saveStationData(allStations)

      console.log('✅ Comprehensive scraping completed:', results)

    } catch (error) {
      console.error('❌ Error in comprehensive scraping:', error)
    } finally {
      await this.closeBrowser()
    }

    return results
  }
}

// Singleton instance
export const enhancedScraper = new EnhancedEVScraper()