// API endpoint to test PlugShare scraping
import { NextResponse } from 'next/server'
import { enhancedScraper } from '../../../lib/enhanced-scrapers'

export async function POST() {
  try {
    console.log('🔌 Starting PlugShare scraping test...')
    
    const stations = await enhancedScraper.scrapePlugShare()
    
    console.log(`✅ PlugShare scraping completed: ${stations.length} stations found`)
    
    return NextResponse.json({
      success: true,
      message: `PlugShare scraping completed`,
      stationsFound: stations.length,
      sampleStations: stations.slice(0, 3).map(station => ({
        name: station.name,
        network: station.network,
        location: `${station.latitude}, ${station.longitude}`,
        address: station.address,
        pricePerKwh: station.pricePerKwh
      }))
    })
    
  } catch (error) {
    console.error('❌ PlugShare scraping error:', error)
    return NextResponse.json(
      { error: 'Failed to scrape PlugShare data' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'PlugShare scraper ready. Send POST request to start scraping.',
    description: 'This will scrape PlugShare for EV charging station data.'
  })
}