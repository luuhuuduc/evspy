// Analyze Chargefox marker click behavior and location names
const puppeteer = require('puppeteer');

async function analyzeChargefoxMarkerClick() {
  console.log('🦊 Analyzing Chargefox marker click behavior...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser to see interactions
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    slowMo: 200
  });
  
  const page = await browser.newPage();
  
  let markerClickRequests = [];
  let markerClickResponses = [];
  
  // Track network requests that happen after clicking
  page.on('request', (request) => {
    const url = request.url();
    markerClickRequests.push({
      timestamp: Date.now(),
      method: request.method(),
      url: url,
      isApi: url.includes('api') || url.includes('graphql') || url.includes('location')
    });
  });
  
  // Track responses with location data
  page.on('response', async (response) => {
    const url = response.url();
    const contentType = response.headers()['content-type'] || '';
    
    if (contentType.includes('application/json')) {
      try {
        const data = await response.text();
        if (data && (data.includes('name') || data.includes('address') || data.includes('Royal'))) {
          markerClickResponses.push({
            timestamp: Date.now(),
            url: url,
            status: response.status(),
            size: data.length,
            preview: data.substring(0, 500),
            fullData: data
          });
        }
      } catch (e) {
        // Ignore errors
      }
    }
  });
  
  try {
    console.log('🌐 Navigating to Chargefox...');
    await page.goto('https://www.chargefox.com/drivers/ev-owner', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log('⏳ Waiting for map to load...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // Clear previous requests to focus on marker click
    markerClickRequests = [];
    markerClickResponses = [];
    
    console.log('🖱️ Looking for markers to click...');
    
    // Wait for markers to be visible
    await page.waitForSelector('.marker', { timeout: 10000 });
    
    // Get all markers
    const markers = await page.$$('.marker');
    console.log(`Found ${markers.length} markers`);
    
    if (markers.length > 0) {
      console.log('🎯 Clicking on first marker...');
      const startTime = Date.now();
      
      // Click on the first marker
      await markers[0].click();
      
      // Wait for any popup or detail panel to appear
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Look for popup content
      const popupContent = await page.evaluate(() => {
        // Look for various popup selectors
        const selectors = [
          '.popup',
          '.station-popup',
          '.marker-popup',
          '.leaflet-popup',
          '.mapboxgl-popup',
          '[class*="popup"]',
          '[class*="detail"]',
          '[class*="info"]'
        ];
        
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent) {
            return {
              selector: selector,
              text: element.textContent,
              html: element.innerHTML.substring(0, 1000)
            };
          }
        }
        return null;
      });
      
      console.log('\n📝 Popup content found:');
      if (popupContent) {
        console.log('Selector:', popupContent.selector);
        console.log('Text:', popupContent.text.substring(0, 200));
        console.log('HTML preview:', popupContent.html.substring(0, 300));
      } else {
        console.log('❌ No popup content found');
      }
      
      // Check for Google Maps button
      const mapsButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a, [onclick*="maps"], [href*="maps"], [class*="map"]'));
        return buttons.map(btn => ({
          tagName: btn.tagName,
          text: btn.textContent?.trim(),
          href: btn.href || '',
          onclick: btn.onclick?.toString() || '',
          className: btn.className
        })).filter(btn => 
          btn.text?.toLowerCase().includes('map') || 
          btn.href.includes('maps') ||
          btn.onclick.includes('maps')
        );
      });
      
      console.log('\n🗺️ Google Maps buttons found:');
      mapsButton.forEach((btn, i) => {
        console.log(`${i + 1}. ${btn.tagName}: "${btn.text}"`);
        console.log(`   Href: ${btn.href}`);
        console.log(`   Class: ${btn.className}`);
        console.log('');
      });
      
      // Filter requests that happened after the click
      const clickRequests = markerClickRequests.filter(req => req.timestamp > startTime);
      const clickResponses = markerClickResponses.filter(resp => resp.timestamp > startTime);
      
      console.log('\n📡 API requests after marker click:');
      clickRequests.filter(req => req.isApi).forEach((req, i) => {
        console.log(`${i + 1}. ${req.method} ${req.url}`);
      });
      
      console.log('\n📨 JSON responses after marker click:');
      clickResponses.forEach((resp, i) => {
        console.log(`${i + 1}. ${resp.url}`);
        console.log(`   Preview: ${resp.preview}...`);
        
        // Save detailed response if it looks important
        if (resp.fullData.includes('Royal') || resp.fullData.includes('name')) {
          const fs = require('fs');
          fs.writeFileSync(`marker-click-response-${i + 1}.json`, resp.fullData);
          console.log(`   💾 Saved to marker-click-response-${i + 1}.json`);
        }
        console.log('');
      });
    }
    
    // Wait for manual inspection
    console.log('\n⏳ Keeping browser open for 10 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the analysis
analyzeChargefoxMarkerClick().catch(console.error);