// Enhanced Chargefox analysis to find address data
const puppeteer = require('puppeteer');

async function analyzeChargefoxForAddresses() {
  console.log('🦊 Analyzing Chargefox for address data...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser for debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    slowMo: 100
  });
  
  const page = await browser.newPage();
  
  let allRequests = [];
  let allResponses = [];
  
  // Track ALL network requests
  page.on('request', (request) => {
    const url = request.url();
    allRequests.push({
      method: request.method(),
      url: url,
      resourceType: request.resourceType()
    });
  });
  
  // Track ALL responses with JSON data
  page.on('response', async (response) => {
    const url = response.url();
    const contentType = response.headers()['content-type'] || '';
    
    if (contentType.includes('application/json')) {
      try {
        const data = await response.text();
        if (data && data.length > 10) {
          allResponses.push({
            url: url,
            status: response.status(),
            size: data.length,
            containsAddress: data.includes('address') || data.includes('suburb') || data.includes('street'),
            containsName: data.includes('name') || data.includes('title'),
            preview: data.substring(0, 300)
          });
        }
      } catch (e) {
        // Ignore errors
      }
    }
  });
  
  try {
    console.log('🌐 Navigating to Chargefox map...');
    await page.goto('https://www.chargefox.com/drivers/ev-owner', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log('⏳ Waiting for page to load and interacting with map...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Try to click on a station marker to see if it loads more detailed data
    try {
      console.log('🖱️ Trying to click on a station marker...');
      await page.click('.marker', { delay: 1000 });
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (e) {
      console.log('Could not click marker, continuing...');
    }
    
    // Try to zoom into a specific area to trigger more detailed API calls
    try {
      console.log('🔍 Trying to zoom into Sydney area...');
      await page.evaluate(() => {
        // Try to find the map instance and zoom to Sydney
        if (window.map) {
          window.map.setView([-33.8688, 151.2093], 12);
        }
      });
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (e) {
      console.log('Could not programmatically zoom');
    }
    
    console.log('\n📡 All API requests made:');
    const apiRequests = allRequests.filter(req => 
      req.url.includes('api') || 
      req.url.includes('graphql') || 
      req.url.includes('chargefox.com') ||
      req.resourceType === 'xhr' ||
      req.resourceType === 'fetch'
    );
    
    apiRequests.slice(0, 15).forEach((req, i) => {
      console.log(`${i + 1}. ${req.method} ${req.url.substring(0, 100)}...`);
    });
    
    console.log(`\nTotal API requests: ${apiRequests.length}`);
    
    console.log('\n📨 JSON responses with potential address data:');
    const addressResponses = allResponses.filter(resp => resp.containsAddress || resp.containsName);
    
    addressResponses.forEach((resp, i) => {
      console.log(`${i + 1}. ${resp.url}`);
      console.log(`   Size: ${resp.size} bytes, Status: ${resp.status}`);
      console.log(`   Has address: ${resp.containsAddress}, Has name: ${resp.containsName}`);
      console.log(`   Preview: ${resp.preview}...`);
      console.log('');
    });
    
    if (addressResponses.length === 0) {
      console.log('❌ No responses found with address data');
      
      console.log('\n🔍 All JSON responses:');
      allResponses.slice(0, 5).forEach((resp, i) => {
        console.log(`${i + 1}. ${resp.url.substring(0, 80)}...`);
        console.log(`   Preview: ${resp.preview}...`);
        console.log('');
      });
    }
    
    // Wait for manual inspection
    console.log('\n⏳ Keeping browser open for 15 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the analysis
analyzeChargefoxForAddresses().catch(console.error);