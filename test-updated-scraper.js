// Test the updated Chargefox scraper

async function testUpdatedChargefoxScraper() {
  console.log('🦊 Testing updated Chargefox scraper in EVSpy...\n');
  
  try {
    console.log('🔄 Triggering enhanced scraping with Chargefox only...');
    
    const response = await fetch('http://localhost:3000/api/enhanced-scraping', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        networks: ['chargefox'] // Test just Chargefox
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    console.log('✅ Enhanced scraping response received!');
    console.log('📊 Results:', JSON.stringify(result, null, 2));
    
    if (result.chargefox && result.chargefox > 0) {
      console.log(`\n🎉 SUCCESS! Found ${result.chargefox} Chargefox stations!`);
      console.log(`📈 Total stations: ${result.totalStations}`);
      console.log(`💾 Database results:`, result.dbResults);
    } else {
      console.log('\n❌ Still getting 0 results from Chargefox');
    }
    
  } catch (error) {
    console.error('❌ Error testing scraper:', error.message);
  }
}

// Run the test
testUpdatedChargefoxScraper().catch(console.error);