// Simple test to check website accessibility
const puppeteer = require('puppeteer');

async function testWebsiteAccess() {
  console.log('🔍 Testing website accessibility...');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });
  
  const page = await browser.newPage();
  
  const websites = [
    { name: 'Chargefox', url: 'https://chargefox.com/' },
    { name: 'PlugShare', url: 'https://www.plugshare.com/' },
    { name: 'Chargeprice', url: 'https://chargeprice.app/' },
    { name: 'Exploren', url: 'https://exploren.com.au/' }
  ];
  
  for (const site of websites) {
    try {
      console.log(`\n🌐 Testing ${site.name}: ${site.url}`);
      
      const response = await page.goto(site.url, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });
      
      const statusCode = response?.status();
      const title = await page.title();
      
      console.log(`✅ ${site.name}: Status ${statusCode}, Title: "${title}"`);
      
      // Check for any obvious station/charging related content
      const hasChargingContent = await page.evaluate(() => {
        const text = document.body.textContent?.toLowerCase() || '';
        const keywords = ['charging', 'station', 'electric', 'ev', 'charger'];
        return keywords.some(keyword => text.includes(keyword));
      });
      
      console.log(`🔋 Has charging content: ${hasChargingContent}`);
      
    } catch (error) {
      console.log(`❌ ${site.name}: Error - ${error.message}`);
    }
  }
  
  await browser.close();
  console.log('\n✅ Website accessibility test complete!');
}

testWebsiteAccess().catch(console.error);