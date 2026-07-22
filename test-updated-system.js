// Test the updated scraping system with improved addresses
async function testUpdatedScrapingSystem() {
  console.log('🚀 Testing updated EVSpy scraping system...\n')
  
  try {
    console.log('🔄 Triggering enhanced scraping with just Chargefox for testing...')
    
    const response = await fetch('http://localhost:3000/api/enhanced-scraping', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        networks: ['chargefox'] // Test just Chargefox with new features
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    
    console.log('✅ Enhanced scraping completed!')
    console.log('📊 Results:')
    console.log(`   Chargefox stations: ${result.chargefox || 0}`)
    console.log(`   Total stations: ${result.totalStations || 0}`)
    console.log(`   Database results:`, result.dbResults)
    
    if (result.chargefox > 0) {
      console.log('\n🎉 SUCCESS! Chargefox scraper is working!')
      
      // Now let's check a few stations to see if they have better addresses
      console.log('\n🔍 Checking station data quality...')
      
      const stationsResponse = await fetch('http://localhost:3000/api/stations?limit=5')
      const stationsData = await stationsResponse.json()
      
      if (stationsData.stations && stationsData.stations.length > 0) {
        console.log('\n📍 Sample stations with addresses:')
        stationsData.stations.slice(0, 3).forEach((station, i) => {
          console.log(`${i + 1}. ${station.name}`)
          console.log(`   Address: ${station.address}`)
          console.log(`   Location: ${station.latitude}, ${station.longitude}`)
          console.log(`   Network: ${station.network}`)
          console.log(`   Google Maps: https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(station.address)}`)
          console.log('')
        })
      }
    } else {
      console.log('\n❌ Still getting 0 results from Chargefox')
    }
    
  } catch (error) {
    console.error('❌ Error testing updated scraper:', error.message)
  }
}

// Run the test
testUpdatedScrapingSystem().catch(console.error)