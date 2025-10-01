import { NextRequest, NextResponse } from 'next/server'
import { networkScraper } from '@/lib/scrapers'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { networks = ['chargefox', 'evie', 'tesla'] } = await request.json()
    
    console.log('Starting price scraping for networks:', networks)
    
    const results = await networkScraper.scrapeAllNetworks()
    
    return NextResponse.json({
      success: true,
      message: 'Price scraping completed successfully',
      results,
    })
  } catch (error) {
    console.error('Scraping error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to scrape pricing data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Return scraping status and last run info
    const recentPrices = await prisma.priceReport.findMany({
      where: {
        reportedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: {
        station: {
          select: {
            name: true,
            network: true
          }
        }
      },
      orderBy: {
        reportedAt: 'desc'
      },
      take: 50
    })

    const scrapingStats = {
      totalPricesLast24h: recentPrices.length,
      networkBreakdown: recentPrices.reduce((acc: Record<string, number>, price: { station: { network: string | null } }) => {
        const network = price.station.network || 'Unknown'
        acc[network] = (acc[network] || 0) + 1
        return acc
      }, {}),
      lastScrapedAt: recentPrices[0]?.reportedAt || null
    }

    return NextResponse.json({
      success: true,
      stats: scrapingStats,
      recentPrices: recentPrices.slice(0, 10) // Show only 10 most recent
    })
  } catch (error) {
    console.error('Error getting scraping status:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get scraping status' 
      },
      { status: 500 }
    )
  }
}