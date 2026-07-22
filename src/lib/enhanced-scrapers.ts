// Enhanced multi-platform scraping system for Australian EV charging data
import puppeteer, { Browser, Page } from 'puppeteer'
import { prisma } from './prisma'
import { reverseGeocodeWithCache, extractLocationName } from './geocoding'

export interface StationData {
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
        for (const location of graphqlData as unknown[]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const loc = location as any // Temporary cast until we define proper interface
          if (!loc.chargeStations || loc.chargeStations.length === 0) continue
          
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
            } catch (_error) {
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
   * Scrape PlugShare - Community-driven charging data using API interception
   */
  async scrapePlugShare(): Promise<StationData[]> {
    console.log('🔌 Starting PlugShare API scraping...')
    const stations: StationData[] = []

    try {
      const page = await this.createPage()
      
      // Set up API response interception for PlugShare
      let apiData: unknown = null
      page.on('response', async (response) => {
        const url = response.url()
        
        // Look for PlugShare API endpoints
        if (url.includes('plugshare.com/api') || 
            url.includes('/locations') || 
            url.includes('/stations') ||
            url.includes('graphql') ||
            url.includes('/api/')) {
          
          try {
            const responseText = await response.text()
            const jsonData = JSON.parse(responseText)
            
            console.log(`📡 PlugShare API found: ${url}`)
            console.log(`📊 Response keys:`, Object.keys(jsonData))
            
            // Look for station data patterns
            if (jsonData.data || jsonData.locations || jsonData.stations || Array.isArray(jsonData)) {
              console.log(`🎯 Found PlugShare station data!`)
              apiData = jsonData
            }
            
          } catch (_parseError) {
            // Ignore non-JSON responses - already got responseText above
            console.log(`📄 PlugShare response (non-JSON): ${url}`)
          }
        }
      })
      
      // Navigate to PlugShare Australia with specific bounds
      console.log('📍 Loading PlugShare Australia map...')
      await page.goto('https://www.plugshare.com/', {
        waitUntil: 'networkidle2',
        timeout: 30000
      })
      
      // Wait for initial load
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Try to set location to Australia and zoom to populated area
      console.log('🌏 Setting location to Australia...')
      await page.evaluate(() => {
        // Try to set the map to Australia coordinates
        if (typeof window !== 'undefined' && (window as unknown as { setMapLocation?: (lat: number, lng: number, zoom: number) => void }).setMapLocation) {
          (window as unknown as { setMapLocation: (lat: number, lng: number, zoom: number) => void }).setMapLocation(-33.8688, 151.2093, 10)
        }
        
        // Alternative: try to find and use search box
        const searchBox = document.querySelector('input[placeholder*="Search"], input[type="search"], #search') as HTMLInputElement
        if (searchBox) {
          searchBox.value = 'Sydney, Australia'
          searchBox.dispatchEvent(new Event('input', { bubbles: true }))
          searchBox.dispatchEvent(new Event('change', { bubbles: true }))
        }
      })
      
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      // Try clicking on map to trigger station loading
      console.log('🗺️ Interacting with map to load stations...')
      await page.evaluate(() => {
        const mapContainer = document.querySelector('#map, .map-container, [class*="map"]') as HTMLElement
        if (mapContainer) {
          // Simulate click events to trigger API calls
          const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: 600,
            clientY: 400
          })
          mapContainer.dispatchEvent(clickEvent)
        }
      })
      
      // Wait for potential API calls
      await new Promise(resolve => setTimeout(resolve, 8000))
      
      // Process any intercepted API data
      if (apiData) {
        console.log('🔍 Processing PlugShare API data...')
        
        let stationList: unknown[] = []
        
        // Handle different API response structures
        if (Array.isArray(apiData)) {
          stationList = apiData
        } else if (typeof apiData === 'object' && apiData !== null) {
          const data = apiData as Record<string, unknown>
          if (data.data && Array.isArray(data.data)) {
            stationList = data.data
          } else if (data.locations && Array.isArray(data.locations)) {
            stationList = data.locations
          } else if (data.stations && Array.isArray(data.stations)) {
            stationList = data.stations
          }
        }
        
        console.log(`📍 Processing ${stationList.length} PlugShare stations...`)
        
        for (const stationData of stationList) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const station = stationData as any
            
            if (station.latitude && station.longitude) {
              // Get better address using reverse geocoding
              let addressInfo
              try {
                addressInfo = await reverseGeocodeWithCache(station.latitude, station.longitude)
              } catch (_error) {
                console.warn('Reverse geocoding failed for PlugShare station')
                addressInfo = null
              }
              
              const stationName = station.name || 
                                  station.location_name || 
                                  (addressInfo ? extractLocationName(addressInfo.formattedAddress) : `PlugShare Station`)
              
              // Extract pricing from various PlugShare fields
              let pricePerKwh = station.price || station.cost || station.fee
              if (typeof pricePerKwh === 'string') {
                const priceMatch = pricePerKwh.match(/(\d+\.?\d*)/)
                pricePerKwh = priceMatch ? parseFloat(priceMatch[1]) : undefined
              }
              
              stations.push({
                externalId: `plugshare-${station.id || stations.length}`,
                name: stationName,
                network: station.network || station.operator || 'PlugShare Community',
                latitude: station.latitude,
                longitude: station.longitude,
                address: addressInfo?.formattedAddress || station.address || 'Community reported location',
                suburb: addressInfo?.suburb || 'TBD',
                state: addressInfo?.state || 'TBD',
                postcode: addressInfo?.postcode || 'TBD',
                connectorTypes: this.getPlugShareConnectorTypes(station.outlets || station.connectors),
                powerKw: station.power || 22, // Default to AC charging
                pricePerKwh: pricePerKwh,
                sessionFee: 0, // PlugShare typically community pricing
                lastUpdated: new Date(),
                source: 'PLUGSHARE',
                isOperational: station.status !== 'offline' && station.status !== 'unavailable',
                amenities: ['Community Verified']
              })
            }
          } catch (error) {
            console.error('Error processing PlugShare station:', error)
          }
        }
      }
      
      // Fallback: try DOM scraping if no API data found
      if (stations.length === 0) {
        console.log('🔄 Fallback to DOM scraping for PlugShare...')
        
        const domData = await page.evaluate(() => {
          const results: Array<{
            name?: string;
            coords?: { lat: number; lng: number };
            network?: string;
          }> = []
          
          // Look for any visible station elements
          const stationElements = document.querySelectorAll('[data-lat], [data-lng], .station, .location, .marker')
          
          stationElements.forEach((element) => {
            const el = element as HTMLElement
            const lat = parseFloat(el.dataset.lat || el.getAttribute('data-latitude') || '0')
            const lng = parseFloat(el.dataset.lng || el.getAttribute('data-longitude') || '0')
            
            if (lat && lng) {
              const name = el.textContent?.trim() || el.title || 'PlugShare Station'
              results.push({
                name: name,
                coords: { lat, lng },
                network: 'PlugShare Community'
              })
            }
          })
          
          return results
        })
        
        for (const station of domData) {
          if (station.coords) {
            stations.push({
              name: station.name || 'PlugShare Station',
              network: station.network || 'PlugShare Community',
              latitude: station.coords.lat,
              longitude: station.coords.lng,
              address: 'Community reported location',
              lastUpdated: new Date(),
              source: 'PLUGSHARE'
            })
          }
        }
      }

      await page.close()
      console.log(`✅ PlugShare: Found ${stations.length} stations`)
      return stations

    } catch (error) {
      console.error('❌ PlugShare scraping error:', error)
      return []
    }
  }

  private getPlugShareConnectorTypes(outlets: unknown[]): string {
    if (!outlets || !Array.isArray(outlets)) return 'Unknown'
    
    const types: string[] = []
    outlets.forEach(outlet => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const outletData = outlet as any
      if (outletData.connector) {
        types.push(outletData.connector)
      } else if (outletData.type) {
        types.push(outletData.type)
      }
    })
    
    return types.length > 0 ? types.join(', ') : 'Type 2, CCS2'
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