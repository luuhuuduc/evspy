// Background task runner for scheduled price scraping
import cron from 'node-cron'
import { networkScraper } from './scrapers'
import { enhancedScraper } from './enhanced-scrapers'

class TaskScheduler {
  private isScrapingRunning = false
  private isEnhancedScrapingRunning = false
  
  startScheduler() {
    console.log('🚀 Starting EVSpy enhanced task scheduler...')
    
    // Run enhanced multi-platform scraping every hour
    cron.schedule('0 * * * *', async () => {
      if (this.isEnhancedScrapingRunning) {
        console.log('Enhanced scraping already in progress, skipping...')
        return
      }
      
      try {
        this.isEnhancedScrapingRunning = true
        console.log('⚡ Starting hourly enhanced multi-platform scraping...')
        
        const results = await enhancedScraper.scrapeAllPlatforms()
        
        console.log('✅ Hourly enhanced scraping completed:', results)
      } catch (error) {
        console.error('❌ Error in hourly enhanced scraping:', error)
      } finally {
        this.isEnhancedScrapingRunning = false
      }
    }, {
      timezone: "Australia/Sydney"
    })
    
    // Run legacy scraping every 4 hours as backup
    cron.schedule('0 */4 * * *', async () => {
      if (this.isScrapingRunning) {
        console.log('Legacy scraping already in progress, skipping...')
        return
      }
      
      try {
        this.isScrapingRunning = true
        console.log('🔄 Starting backup legacy scraping...')
        
        const results = await networkScraper.scrapeAllNetworks()
        
        console.log('✅ Legacy scraping completed:', results)
      } catch (error) {
        console.error('❌ Error in legacy scraping:', error)
      } finally {
        this.isScrapingRunning = false
      }
    }, {
      timezone: "Australia/Sydney"
    })
    
    // Run import of new stations daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      try {
        console.log('📥 Starting daily station import from OpenChargeMap...')
        
        // Import new stations from OpenChargeMap
        const response = await fetch('http://localhost:3000/api/import-stations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit: 500 })
        })
        
        const result = await response.json()
        console.log('✅ Daily station import completed:', result)
      } catch (error) {
        console.error('❌ Error in daily station import:', error)
      }
    }, {
      timezone: "Australia/Sydney"
    })
    
    console.log('✅ Enhanced task scheduler started successfully')
    console.log('- 🌐 Enhanced multi-platform scraping: Every hour')
    console.log('- 🔄 Legacy price scraping: Every 4 hours (backup)')
    console.log('- 📥 Station import: Daily at 2 AM AEDT')
    console.log('- 🎯 Sources: Chargefox, PlugShare, Chargeprice, Exploren')
  }
  
  async runImmediateEnhancedScraping() {
    if (this.isEnhancedScrapingRunning) {
      throw new Error('Enhanced scraping is already running')
    }
    
    try {
      this.isEnhancedScrapingRunning = true
      return await enhancedScraper.scrapeAllPlatforms()
    } finally {
      this.isEnhancedScrapingRunning = false
    }
  }
  
  async runImmediateScraping() {
    if (this.isScrapingRunning) {
      throw new Error('Scraping is already running')
    }
    
    try {
      this.isScrapingRunning = true
      return await networkScraper.scrapeAllNetworks()
    } finally {
      this.isScrapingRunning = false
    }
  }
  
  isScrapingInProgress() {
    return this.isScrapingRunning || this.isEnhancedScrapingRunning
  }
  
  getStatus() {
    return {
      legacyScraping: this.isScrapingRunning,
      enhancedScraping: this.isEnhancedScrapingRunning,
      anyScrapingActive: this.isScrapingInProgress()
    }
  }
}

export const taskScheduler = new TaskScheduler()

// Auto-start scheduler in production or when explicitly enabled
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_SCHEDULER === 'true') {
  taskScheduler.startScheduler()
}