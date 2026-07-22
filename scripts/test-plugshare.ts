// Simple PlugShare test script
import { enhancedScraper, StationData } from '../src/lib/enhanced-scrapers'

async function testPlugShare() {
  console.log('🔌 Testing PlugShare scraper...')
  
  try {
    const stations = await enhancedScraper.scrapePlugShare()
    
    console.log('\n✅ PlugShare Results:')
    console.log(`📊 Total stations found: ${stations.length}`)
    
    if (stations.length > 0) {
      console.log('\n📍 Sample stations:')
      stations.slice(0, 5).forEach((station: StationData, index: number) => {
        console.log(`${index + 1}. ${station.name}`)
        console.log(`   Network: ${station.network}`)
        console.log(`   Location: ${station.latitude}, ${station.longitude}`)
        console.log(`   Address: ${station.address}`)
        console.log(`   Price: ${station.pricePerKwh ? `$${station.pricePerKwh}/kWh` : 'Not available'}`)
        console.log('')
      })
      
      // Save to database
      console.log('💾 Saving to database...')
      const saveResults = await enhancedScraper.saveStationData(stations)
      console.log(`✅ Database results:`)
      console.log(`   Created: ${saveResults.created}`)
      console.log(`   Updated: ${saveResults.updated}`)
      console.log(`   Errors: ${saveResults.errors}`)
    }
    
  } catch (error) {
    console.error('❌ PlugShare test error:', error)
  } finally {
    await enhancedScraper.closeBrowser()
  }
}

// Run the test
testPlugShare()