// Focused Chargefox analysis for the EV owner page
const puppeteer = require('puppeteer');

async function analyzeChargefoxEVOwner() {
  console.log('🦊 Analyzing Chargefox EV Owner page...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser so we can see what's happening
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    slowMo: 100 // Slow down for debugging
  });
  
  const page = await browser.newPage();
  
  // Track all network requests to find API calls
  const apiCalls = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('api') || url.includes('.json') || url.includes('station') || url.includes('location') || url.includes('chargefox')) {
      apiCalls.push({
        method: request.method(),
        url: url,
        headers: request.headers()
      });
    }
  });
  
  // Track responses with JSON data
  const jsonResponses = [];
  page.on('response', async (response) => {
    const url = response.url();
    const contentType = response.headers()['content-type'] || '';
    
    if (contentType.includes('application/json')) {
      try {
        const data = await response.text();
        if (data && data.length > 10) {
          jsonResponses.push({
            url: url,
            status: response.status(),
            size: data.length,
            preview: data.substring(0, 500)
          });
        }
      } catch (e) {
        // Ignore errors
      }
    }
  });
  
  try {
    console.log('🌐 Navigating to Chargefox EV Owner page...');
    await page.goto('https://www.chargefox.com/drivers/ev-owner', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log('⏳ Waiting for page to load...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // Take a screenshot to see what loaded
    await page.screenshot({ path: 'chargefox-map.png', fullPage: true });
    console.log('📸 Screenshot saved as chargefox-map.png');
    
    // Look for map-related elements
    const mapElements = await page.evaluate(() => {
      const results = [];
      
      // Common map selectors
      const mapSelectors = [
        'iframe',
        '[class*="map"]',
        '[id*="map"]',
        '.leaflet-container',
        '.mapbox',
        '.google-map',
        'canvas',
        'svg'
      ];
      
      mapSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          results.push({
            selector: selector,
            count: elements.length,
            firstElement: {
              tagName: elements[0].tagName,
              className: elements[0].className,
              id: elements[0].id,
              src: elements[0].src || 'N/A'
            }
          });
        }
      });
      
      return results;
    });
    
    console.log('\n🗺️ Map elements found:');
    mapElements.forEach((elem, i) => {
      console.log(`${i + 1}. ${elem.selector}: ${elem.count} elements`);
      console.log(`   First element: ${elem.firstElement.tagName}.${elem.firstElement.className}#${elem.firstElement.id}`);
      if (elem.firstElement.src !== 'N/A') {
        console.log(`   Source: ${elem.firstElement.src}`);
      }
    });
    
    // Try to find any station markers or data
    const stationElements = await page.evaluate(() => {
      const results = [];
      
      // Look for potential station markers
      const stationSelectors = [
        '[data-station]',
        '[data-location]',
        '.station',
        '.marker',
        '.location',
        '.charger',
        '[class*="station"]',
        '[class*="marker"]',
        '[class*="charger"]',
        '[title*="station"]',
        '[title*="charger"]'
      ];
      
      stationSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          results.push({
            selector: selector,
            count: elements.length,
            sample: elements[0].outerHTML.substring(0, 300)
          });
        }
      });
      
      return results;
    });
    
    console.log('\n⚡ Station elements found:');
    stationElements.forEach((elem, i) => {
      console.log(`${i + 1}. ${elem.selector}: ${elem.count} elements`);
      console.log(`   Sample HTML: ${elem.sample}...`);
    });
    
    // Check for JavaScript variables with station data
    const jsVariables = await page.evaluate(() => {
      const results = [];
      const varNames = ['stations', 'locations', 'markers', 'chargers', 'data', '__NEXT_DATA__', 'window.stations'];
      
      varNames.forEach(varName => {
        try {
          let value;
          if (varName === '__NEXT_DATA__') {
            value = window.__NEXT_DATA__;
          } else if (varName.startsWith('window.')) {
            const prop = varName.replace('window.', '');
            value = window[prop];
          } else {
            value = window[varName];
          }
          
          if (value && typeof value === 'object') {
            results.push({
              variable: varName,
              type: Array.isArray(value) ? 'array' : 'object',
              length: Array.isArray(value) ? value.length : Object.keys(value).length,
              preview: JSON.stringify(value).substring(0, 500)
            });
          }
        } catch (e) {
          // Variable doesn't exist
        }
      });
      
      return results;
    });
    
    console.log('\n🔍 JavaScript variables with data:');
    jsVariables.forEach((jsVar, i) => {
      console.log(`${i + 1}. ${jsVar.variable}: ${jsVar.type} (${jsVar.length} items)`);
      console.log(`   Preview: ${jsVar.preview}...`);
    });
    
    console.log('\n📡 API calls made:');
    apiCalls.forEach((call, i) => {
      console.log(`${i + 1}. ${call.method} ${call.url}`);
    });
    
    console.log('\n📨 JSON responses received:');
    jsonResponses.forEach((resp, i) => {
      console.log(`${i + 1}. ${resp.status} ${resp.url} (${resp.size} bytes)`);
      console.log(`   Preview: ${resp.preview}...`);
    });
    
    // Wait a bit more to let user see the browser
    console.log('\n⏳ Keeping browser open for 10 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the analysis
analyzeChargefoxEVOwner().catch(console.error);