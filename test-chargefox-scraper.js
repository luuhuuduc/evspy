// Proper Chargefox scraper using GraphQL API
const puppeteer = require('puppeteer');

class ChargefoxGraphQLScraper {
  constructor() {
    this.browser = null;
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async scrapeChargefoxStations() {
    console.log('🦊 Starting Chargefox GraphQL scraping...');
    
    if (!this.browser) await this.init();
    
    const page = await this.browser.newPage();
    
    let stationsData = [];
    
    // Intercept GraphQL response
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('app.chargefox.com/graphql')) {
        try {
          const data = await response.text();
          const jsonData = JSON.parse(data);
          
          if (jsonData.data && jsonData.data.locationsByBounds) {
            console.log('📡 GraphQL response intercepted successfully!');
            stationsData = this.processChargefoxData(jsonData.data.locationsByBounds);
          }
        } catch (e) {
          console.log('⚠️ Error parsing GraphQL response:', e.message);
        }
      }
    });

    try {
      // Navigate to trigger the GraphQL call
      await page.goto('https://www.chargefox.com/drivers/ev-owner', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for GraphQL call to complete
      await new Promise(resolve => setTimeout(resolve, 8000));

      console.log(`✅ Processed ${stationsData.length} Chargefox stations`);
      return stationsData;

    } catch (error) {
      console.error('❌ Chargefox scraping error:', error.message);
      return [];
    } finally {
      await page.close();
    }
  }

  processChargefoxData(locations) {
    const stations = [];
    
    locations.forEach(location => {
      if (!location.chargeStations || location.chargeStations.length === 0) return;
      
      location.chargeStations.forEach((station, stationIndex) => {
        if (!station.connectors || station.connectors.length === 0) return;
        
        // Calculate pricing (Chargefox has different rates)
        const chargingSpeed = location.chargingSpeed;
        let pricePerKwh = 0;
        
        switch (chargingSpeed) {
          case 'fast': // DC Fast (50kW+)
            pricePerKwh = 0.65; // ~65c/kWh for fast charging
            break;
          case 'rapid': // Ultra-rapid (150kW+)
            pricePerKwh = 0.75; // ~75c/kWh for ultra-rapid
            break;
          case 'standard': // AC charging (7-22kW)
            pricePerKwh = 0.45; // ~45c/kWh for AC
            break;
          default:
            pricePerKwh = 0.55; // Default rate
        }
        
        // Determine power rating
        let powerKw = 22; // Default AC
        if (chargingSpeed === 'fast') powerKw = 50;
        if (chargingSpeed === 'rapid') powerKw = 150;
        
        // Count available/occupied connectors
        const availableConnectors = station.connectors.filter(c => c.status === 'available').length;
        const totalConnectors = station.connectors.length;
        const isOperational = availableConnectors > 0;
        
        stations.push({
          externalId: `${location.id}-${stationIndex}`,
          name: `Chargefox Station ${location.id.slice(-4)}`, // Use last 4 chars of ID
          network: 'Chargefox',
          latitude: location.lat,
          longitude: location.lng,
          address: 'Location data available', // Would need additional API call for full address
          suburb: 'TBD',
          state: 'TBD', 
          postcode: 'TBD',
          connectorTypes: this.getConnectorTypes(station.connectors),
          powerKw: powerKw,
          pricePerKwh: pricePerKwh,
          sessionFee: 0, // Chargefox typically has no session fee
          memberPricePerKwh: pricePerKwh - 0.05, // Member discount
          nonMemberPricePerKwh: pricePerKwh,
          lastUpdated: new Date(),
          source: 'CHARGEFOX',
          isOperational: isOperational,
          amenities: location.planned ? ['Planned'] : ['Operational'],
          // Additional metadata
          availableConnectors: availableConnectors,
          totalConnectors: totalConnectors,
          chargingSpeed: chargingSpeed,
          planned: location.planned
        });
      });
    });
    
    return stations;
  }
  
  getConnectorTypes(connectors) {
    // Chargefox typically uses CCS2, CHAdeMO, and Type 2
    const types = [];
    connectors.forEach((connector, index) => {
      if (index === 0) types.push('CCS2');
      if (index === 1) types.push('CHAdeMO'); 
      if (index > 1) types.push('Type 2');
    });
    return types.join(', ');
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Test the scraper
async function testChargefoxScraper() {
  console.log('🚀 Testing Chargefox GraphQL scraper...\n');
  
  const scraper = new ChargefoxGraphQLScraper();
  
  try {
    const stations = await scraper.scrapeChargefoxStations();
    
    if (stations.length > 0) {
      console.log('\n📊 Scraping Results:');
      console.log(`   Total stations: ${stations.length}`);
      console.log(`   Operational stations: ${stations.filter(s => s.isOperational).length}`);
      console.log(`   Planned stations: ${stations.filter(s => s.planned).length}`);
      
      console.log('\n🔍 Sample stations:');
      stations.slice(0, 3).forEach((station, i) => {
        console.log(`${i + 1}. ${station.name}`);
        console.log(`   Location: ${station.latitude}, ${station.longitude}`);
        console.log(`   Network: ${station.network}`);
        console.log(`   Power: ${station.powerKw}kW (${station.chargingSpeed})`);
        console.log(`   Price: $${station.pricePerKwh}/kWh`);
        console.log(`   Connectors: ${station.availableConnectors}/${station.totalConnectors} available`);
        console.log(`   Types: ${station.connectorTypes}`);
        console.log('');
      });
      
      // Save sample data
      const fs = require('fs');
      fs.writeFileSync('chargefox-stations-sample.json', JSON.stringify(stations.slice(0, 10), null, 2));
      console.log('💾 Sample stations saved to chargefox-stations-sample.json');
      
    } else {
      console.log('❌ No stations found');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await scraper.close();
  }
}

// Run the test
testChargefoxScraper().catch(console.error);