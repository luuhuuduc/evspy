// PlugShare API Analysis Tool
import puppeteer, { Browser } from 'puppeteer'

interface PlugShareAPICall {
  url: string
  method: string
  headers: Record<string, string>
  requestData?: unknown
  responseData?: unknown
  timestamp: Date
}

export class PlugShareAnalyzer {
  private browser: Browser | null = null
  private apiCalls: PlugShareAPICall[] = []

  async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: false, // Keep visible for debugging
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--window-size=1920,1080'
        ]
      })
    }
    return this.browser
  }

  async analyzePlugShareAPIs(): Promise<PlugShareAPICall[]> {
    console.log('🔍 Analyzing PlugShare API calls...')
    
    try {
      const browser = await this.initBrowser()
      const page = await browser.newPage()
      
      // Set user agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
      
      // Intercept all network requests
      await page.setRequestInterception(true)
      
      page.on('request', async (request) => {
        const url = request.url()
        
        // Log API calls
        if (url.includes('api') || url.includes('graphql') || url.includes('plugshare')) {
          console.log(`📡 REQUEST: ${request.method()} ${url}`)
          
          const apiCall: PlugShareAPICall = {
            url: url,
            method: request.method(),
            headers: request.headers(),
            requestData: request.postData() ? JSON.parse(request.postData() || '{}') : undefined,
            timestamp: new Date()
          }
          
          this.apiCalls.push(apiCall)
        }
        
        request.continue()
      })
      
      page.on('response', async (response) => {
        const url = response.url()
        
        // Log API responses
        if (url.includes('api') || url.includes('graphql') || url.includes('plugshare')) {
          try {
            const responseText = await response.text()
            let responseData
            
            try {
              responseData = JSON.parse(responseText)
            } catch {
              responseData = responseText
            }
            
            console.log(`📥 RESPONSE: ${response.status()} ${url}`)
            if (responseData && typeof responseData === 'object') {
              console.log(`📊 Data keys:`, Object.keys(responseData))
              
              // Look for station data
              if (responseData.data || responseData.results || Array.isArray(responseData)) {
                console.log(`🎯 Found station data! Type:`, typeof responseData)
                if (Array.isArray(responseData)) {
                  console.log(`📍 Array length:`, responseData.length)
                } else if (responseData.data && Array.isArray(responseData.data)) {
                  console.log(`📍 Data array length:`, responseData.data.length)
                }
              }
            }
            
            // Update the corresponding API call with response data
            const matchingCall = this.apiCalls.find(call => 
              call.url === url && !call.responseData
            )
            if (matchingCall) {
              matchingCall.responseData = responseData
            }
            
          } catch (error) {
            console.log(`❌ Error parsing response from ${url}:`, error)
          }
        }
      })
      
      // Navigate to PlugShare Australia
      console.log('🌏 Loading PlugShare Australia...')
      await page.goto('https://www.plugshare.com/?country=AU', {
        waitUntil: 'networkidle2',
        timeout: 60000
      })
      
      // Wait for initial load
      console.log('⏳ Waiting for map to load...')
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      // Try to zoom to a specific area to trigger more API calls
      console.log('🔍 Zooming to Sydney area...')
      await page.evaluate(() => {
        // Try to find and interact with the map
        const mapElement = document.querySelector('#map, .map, [id*="map"]') as HTMLElement
        if (mapElement && mapElement.click) {
          mapElement.click()
        }
      })
      
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Try clicking on some stations if visible
      console.log('🎯 Looking for station markers...')
      await page.evaluate(() => {
        const markers = document.querySelectorAll('.marker, .station-marker, [class*="marker"], [class*="station"]')
        console.log('Found markers:', markers.length)
        
        // Click first few markers to trigger detail API calls
        for (let i = 0; i < Math.min(3, markers.length); i++) {
          const marker = markers[i] as HTMLElement
          if (marker && marker.click) {
            marker.click()
          }
        }
      })
      
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      console.log(`✅ Analysis complete. Found ${this.apiCalls.length} API calls`)
      
      await page.close()
      return this.apiCalls
      
    } catch (error) {
      console.error('❌ PlugShare analysis error:', error)
      return []
    }
  }
  
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
  
  // Print analysis results
  printAnalysis(): void {
    console.log('\n🔍 PlugShare API Analysis Results')
    console.log('=' .repeat(50))
    
    const uniqueEndpoints = new Set(this.apiCalls.map(call => new URL(call.url).pathname))
    
    console.log(`📊 Total API calls: ${this.apiCalls.length}`)
    console.log(`🎯 Unique endpoints: ${uniqueEndpoints.size}`)
    
    console.log('\n📡 API Endpoints:')
    uniqueEndpoints.forEach(endpoint => {
      const calls = this.apiCalls.filter(call => new URL(call.url).pathname === endpoint)
      console.log(`  ${endpoint} (${calls.length} calls)`)
      
      // Show method and response info for first call
      if (calls.length > 0) {
        const firstCall = calls[0]
        console.log(`    Method: ${firstCall.method}`)
        if (firstCall.responseData && typeof firstCall.responseData === 'object') {
          const keys = Object.keys(firstCall.responseData)
          console.log(`    Response keys: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`)
        }
      }
    })
    
    // Look for station data
    console.log('\n🎯 Station Data Analysis:')
    this.apiCalls.forEach((call, index) => {
      if (call.responseData && typeof call.responseData === 'object') {
        const data = call.responseData as Record<string, unknown>
        
        // Check if this looks like station data
        const hasStationFields = ['id', 'latitude', 'longitude', 'name'].some(field => 
          field in data || 
          (Array.isArray(data.data) && data.data[0] && field in data.data[0]) ||
          (Array.isArray(data.results) && data.results[0] && field in data.results[0])
        )
        
        if (hasStationFields || Array.isArray(data)) {
          console.log(`  Call ${index + 1}: ${call.url}`)
          console.log(`    Looks like station data: ${hasStationFields}`)
          
          if (Array.isArray(data)) {
            console.log(`    Array length: ${data.length}`)
            if (data[0]) {
              console.log(`    First item keys: ${Object.keys(data[0]).slice(0, 5).join(', ')}`)
            }
          } else if (data.data && Array.isArray(data.data)) {
            console.log(`    Data array length: ${data.data.length}`)
            if (data.data[0]) {
              console.log(`    First station keys: ${Object.keys(data.data[0]).slice(0, 5).join(', ')}`)
            }
          }
        }
      }
    })
  }
}

// Export for use in other files
export const plugshareAnalyzer = new PlugShareAnalyzer()