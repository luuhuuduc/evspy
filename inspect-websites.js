// Test script to inspect actual website structure
const puppeteer = require('puppeteer');

async function inspectChargefox() {
  console.log('🔍 Inspecting Chargefox website structure...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser for debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🌐 Navigating to Chargefox...');
    await page.goto('https://chargefox.com/charging/map', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for page to fully load
    await page.waitForTimeout(10000);
    
    // Get page title
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    // Take a screenshot
    await page.screenshot({ path: 'chargefox-debug.png', fullPage: true });
    console.log('📸 Screenshot saved as chargefox-debug.png');
    
    // Get HTML content
    const bodyHTML = await page.evaluate(() => {
      return document.body.innerHTML.substring(0, 2000); // First 2000 chars
    });
    console.log('🔍 Body HTML sample:', bodyHTML);
    
    // Look for any elements that might contain station data
    const stationElements = await page.evaluate(() => {
      const selectors = [
        '[data-station]',
        '.station',
        '.marker',
        '.charging-station',
        '[class*="station"]',
        '[class*="marker"]',
        '[class*="location"]'
      ];
      
      const results = [];
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          results.push({
            selector,
            count: elements.length,
            firstElementHTML: elements[0].outerHTML.substring(0, 500)
          });
        }
      }
      return results;
    });
    
    console.log('🎯 Found elements:', stationElements);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

async function inspectPlugShare() {
  console.log('🔍 Inspecting PlugShare website structure...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🌐 Navigating to PlugShare...');
    await page.goto('https://www.plugshare.com/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    await page.waitForTimeout(5000);
    
    const title = await page.title();
    console.log('📄 PlugShare title:', title);
    
    // Check if there are any station elements
    const stationInfo = await page.evaluate(() => {
      const selectors = [
        '[data-station]',
        '.station',
        '.location',
        '.charger',
        '[class*="station"]',
        '[class*="charger"]',
        '[class*="location"]'
      ];
      
      const results = [];
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          results.push({
            selector,
            count: elements.length
          });
        }
      }
      return results;
    });
    
    console.log('🎯 PlugShare elements:', stationInfo);
    
  } catch (error) {
    console.error('❌ PlugShare error:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the inspection
async function runInspection() {
  console.log('🚀 Starting website structure inspection...\n');
  
  await inspectChargefox();
  console.log('\n' + '='.repeat(50) + '\n');
  await inspectPlugShare();
  
  console.log('\n✅ Inspection complete!');
}

runInspection().catch(console.error);