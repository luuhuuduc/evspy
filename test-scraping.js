// Simple test script for enhanced scraping

async function testEnhancedScraping() {
  try {
    console.log('🔄 Testing Enhanced Scraping API...');
    
    const response = await fetch('http://localhost:3000/api/enhanced-scraping', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        networks: ['chargefox']
      })
    });
    
    const result = await response.json();
    console.log('✅ Enhanced Scraping Response:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing enhanced scraping:', error.message);
  }
}

async function testImportStations() {
  try {
    console.log('🔄 Testing Import Stations API...');
    
    const response = await fetch('http://localhost:3000/api/import-stations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        limit: 10
      })
    });
    
    const result = await response.json();
    console.log('✅ Import Stations Response:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing import stations:', error.message);
  }
}

async function testBasicAPI() {
  try {
    console.log('🔄 Testing Basic Stations API...');
    
    const response = await fetch('http://localhost:3000/api/stations');
    const result = await response.json();
    console.log(`✅ Basic API Response: Found ${result.stations?.length || 0} stations`);
    
  } catch (error) {
    console.error('❌ Error testing basic API:', error.message);
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting EVSpy API Tests...\n');
  
  await testBasicAPI();
  console.log();
  
  await testImportStations();
  console.log();
  
  await testEnhancedScraping();
  console.log();
  
  console.log('✨ Tests completed!');
}

runTests();