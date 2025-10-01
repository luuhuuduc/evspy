// Test Chargefox GraphQL API directly
const puppeteer = require('puppeteer');

async function interceptChargefoxGraphQL() {
  console.log('🦊 Intercepting Chargefox GraphQL API...');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  let graphqlData = null;
  
  // Intercept the GraphQL request
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('app.chargefox.com/graphql')) {
      try {
        const data = await response.text();
        const jsonData = JSON.parse(data);
        
        console.log('🎯 Found GraphQL response!');
        console.log('📊 Response size:', data.length, 'bytes');
        
        if (jsonData.data && jsonData.data.locationsByBounds) {
          const locations = jsonData.data.locationsByBounds;
          console.log('📍 Found', locations.length, 'locations');
          
          // Show first few locations as examples
          console.log('\n🔍 Sample locations:');
          locations.slice(0, 3).forEach((location, i) => {
            console.log(`${i + 1}. ID: ${location.id}`);
            console.log(`   Lat/Lng: ${location.lat}, ${location.lng}`);
            console.log(`   Speed: ${location.chargingSpeed}`);
            console.log(`   Planned: ${location.planned}`);
            console.log(`   Stations: ${location.chargeStations?.length || 0}`);
            
            if (location.chargeStations && location.chargeStations[0]) {
              const firstStation = location.chargeStations[0];
              console.log(`   First station connectors: ${firstStation.connectors?.length || 0}`);
              if (firstStation.connectors && firstStation.connectors[0]) {
                console.log(`   First connector status: ${firstStation.connectors[0].status}`);
              }
            }
            console.log('');
          });
          
          graphqlData = jsonData;
        }
        
      } catch (e) {
        console.log('❌ Error parsing GraphQL response:', e.message);
      }
    }
  });
  
  try {
    await page.goto('https://www.chargefox.com/drivers/ev-owner', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for the GraphQL call to happen
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    if (graphqlData) {
      console.log('\n✅ GraphQL data successfully captured!');
      
      // Save the data to a file for analysis
      const fs = require('fs');
      fs.writeFileSync('chargefox-graphql-response.json', JSON.stringify(graphqlData, null, 2));
      console.log('💾 Data saved to chargefox-graphql-response.json');
      
      // Analyze the structure
      const locations = graphqlData.data.locationsByBounds;
      const totalStations = locations.reduce((sum, loc) => sum + (loc.chargeStations?.length || 0), 0);
      const totalConnectors = locations.reduce((sum, loc) => {
        return sum + (loc.chargeStations?.reduce((stationSum, station) => {
          return stationSum + (station.connectors?.length || 0);
        }, 0) || 0);
      }, 0);
      
      console.log('\n📈 Summary:');
      console.log(`   Total locations: ${locations.length}`);
      console.log(`   Total stations: ${totalStations}`);
      console.log(`   Total connectors: ${totalConnectors}`);
      
      // Check available vs occupied connectors
      let availableCount = 0;
      let occupiedCount = 0;
      let faultedCount = 0;
      
      locations.forEach(loc => {
        loc.chargeStations?.forEach(station => {
          station.connectors?.forEach(connector => {
            switch(connector.status) {
              case 'available': availableCount++; break;
              case 'occupied': occupiedCount++; break;
              case 'faulted': faultedCount++; break;
            }
          });
        });
      });
      
      console.log(`   Available connectors: ${availableCount}`);
      console.log(`   Occupied connectors: ${occupiedCount}`);
      console.log(`   Faulted connectors: ${faultedCount}`);
      
    } else {
      console.log('❌ No GraphQL data found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the GraphQL interception
interceptChargefoxGraphQL().catch(console.error);