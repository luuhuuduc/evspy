// Advanced website analysis to find API endpoints and data sources
const puppeteer = require('puppeteer');

async function analyzeChargefoxAPI() {
  console.log('🦊 Analyzing Chargefox API endpoints...');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Track network requests
  const requests = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('api') || url.includes('station') || url.includes('charging') || url.includes('location')) {
      requests.push({
        method: request.method(),
        url: url,
        headers: request.headers()
      });
    }
  });
  
  const responses = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('api') || url.includes('station') || url.includes('charging') || url.includes('location')) {
      try {
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('application/json')) {
          const data = await response.text();
          responses.push({
            url: url,
            status: response.status(),
            data: data.substring(0, 1000) // First 1000 chars
          });
        }
      } catch (e) {
        // Ignore errors for now
      }
    }
  });
  
  try {
    await page.goto('https://chargefox.com/charging/map', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for any dynamic content to load
    await page.waitForTimeout(10000);
    
    console.log('\n📡 API Requests found:');
    requests.forEach((req, i) => {
      console.log(`${i + 1}. ${req.method} ${req.url}`);
    });
    
    console.log('\n📨 API Responses found:');
    responses.forEach((res, i) => {
      console.log(`${i + 1}. ${res.status} ${res.url}`);
      if (res.data && res.data.length > 0) {
        console.log(`   Data preview: ${res.data.substring(0, 200)}...`);
      }
    });
    
    // Try to find any JavaScript variables that might contain station data
    const jsData = await page.evaluate(() => {
      const results = [];
      
      // Look for common variable names
      const possibleVars = ['stations', 'locations', 'chargers', 'markers', 'data'];
      
      possibleVars.forEach(varName => {
        try {
          if (window[varName] && typeof window[varName] === 'object') {
            results.push({
              variable: varName,
              type: Array.isArray(window[varName]) ? 'array' : 'object',
              length: Array.isArray(window[varName]) ? window[varName].length : Object.keys(window[varName]).length,
              sample: JSON.stringify(window[varName]).substring(0, 500)
            });
          }
        } catch (e) {
          // Variable doesn't exist or can't be stringified
        }
      });
      
      return results;
    });
    
    console.log('\n🔍 JavaScript variables found:');
    jsData.forEach((data, i) => {
      console.log(`${i + 1}. ${data.variable}: ${data.type} (${data.length} items)`);
      console.log(`   Sample: ${data.sample}...`);
    });
    
  } catch (error) {
    console.error('❌ Error analyzing Chargefox:', error.message);
  } finally {
    await browser.close();
  }
}

async function analyzePlugShareAPI() {
  console.log('\n🔌 Analyzing PlugShare API endpoints...');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  const apiRequests = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('api') || url.includes('.json') || url.includes('graphql')) {
      apiRequests.push({
        method: request.method(),
        url: url
      });
    }
  });
  
  try {
    await page.goto('https://www.plugshare.com/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    await page.waitForTimeout(5000);
    
    // Try to search for Australia to trigger API calls
    try {
      await page.type('input[placeholder*="search"], input[name*="search"], input[type="search"]', 'Australia');
      await page.waitForTimeout(3000);
    } catch (e) {
      console.log('Could not find search input');
    }
    
    console.log('\n📡 PlugShare API Requests:');
    apiRequests.forEach((req, i) => {
      console.log(`${i + 1}. ${req.method} ${req.url}`);
    });
    
  } catch (error) {
    console.error('❌ Error analyzing PlugShare:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the analysis
async function runAPIAnalysis() {
  console.log('🚀 Starting API endpoint analysis...\n');
  
  await analyzeChargefoxAPI();
  await analyzePlugShareAPI();
  
  console.log('\n✅ API analysis complete!');
}

runAPIAnalysis().catch(console.error);