// API endpoint for enhanced multi-platform scraping including PlugShare
import { NextRequest, NextResponse } from 'next/server'
import { enhancedScraper } from '../../../lib/enhanced-scrapers'

export async function POST(request: NextRequest) {
  try {
    const { platforms = ['chargefox', 'plugshare'] } = await request.json()
    
    console.log('🚀 Starting enhanced scraping for platforms:', platforms)
    
    const allResults = {
      chargefox: 0,
      plugshare: 0,
      chargeprice: 0,
      exploren: 0,
      totalStations: 0,
      dbResults: { created: 0, updated: 0, errors: 0 }
    }
    
    // Test individual scrapers first
    if (platforms.includes('plugshare')) {
      console.log('🔌 Testing PlugShare scraper...')
      const plugshareStations = await enhancedScraper.scrapePlugShare()
      console.log(`✅ PlugShare test: ${plugshareStations.length} stations`)
      
      if (plugshareStations.length > 0) {
        // Save PlugShare data
        const saveResults = await enhancedScraper.saveStationData(plugshareStations)
        allResults.plugshare = plugshareStations.length
        allResults.dbResults.created += saveResults.created
        allResults.dbResults.updated += saveResults.updated
        allResults.dbResults.errors += saveResults.errors
      }
    }
    
    if (platforms.includes('chargefox')) {
      console.log('🦊 Testing Chargefox scraper...')
      const chargefoxStations = await enhancedScraper.scrapeChargefox()
      console.log(`✅ Chargefox test: ${chargefoxStations.length} stations`)
      
      if (chargefoxStations.length > 0) {
        // Save Chargefox data
        const saveResults = await enhancedScraper.saveStationData(chargefoxStations)
        allResults.chargefox = chargefoxStations.length
        allResults.dbResults.created += saveResults.created
        allResults.dbResults.updated += saveResults.updated
        allResults.dbResults.errors += saveResults.errors
      }
    }
    
    allResults.totalStations = allResults.chargefox + allResults.plugshare + allResults.chargeprice + allResults.exploren
    
    return NextResponse.json({
      success: true,
      message: 'Enhanced scraping completed',
      results: allResults,
      summary: {
        totalStationsScraped: allResults.totalStations,
        newStationsCreated: allResults.dbResults.created,
        existingStationsUpdated: allResults.dbResults.updated,
        errors: allResults.dbResults.errors
      }
    })
    
  } catch (error) {
    console.error('❌ Enhanced scraping error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to complete enhanced scraping',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Enhanced scraping API ready',
    availablePlatforms: ['chargefox', 'plugshare', 'chargeprice', 'exploren'],
    description: 'POST with {"platforms": ["chargefox", "plugshare"]} to scrape specific platforms'
  })
}