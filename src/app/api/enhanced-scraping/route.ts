import { NextRequest, NextResponse } from 'next/server'
import { enhancedScraper } from '@/lib/enhanced-scrapers'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { platforms = ['chargefox', 'plugshare', 'chargeprice', 'exploren'] } = await request.json()
    
    console.log('🚀 Starting enhanced multi-platform scraping for:', platforms)
    
    const results = await enhancedScraper.scrapeAllPlatforms()
    
    return NextResponse.json({
      success: true,
      message: 'Enhanced scraping completed successfully',
      results,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Enhanced scraping error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to run enhanced scraping',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get comprehensive statistics about scraped data
    const [
      totalStations,
      totalPrices,
      recentPrices,
      networkStats,
      sourceStats
    ] = await Promise.all([
      prisma.chargingStation.count(),
      prisma.priceReport.count(),
      prisma.priceReport.findMany({
        where: {
          reportedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        include: {
          station: {
            select: {
              name: true,
              network: true,
              latitude: true,
              longitude: true
            }
          }
        },
        orderBy: {
          reportedAt: 'desc'
        },
        take: 20
      }),
      prisma.chargingStation.groupBy({
        by: ['network'],
        _count: {
          network: true
        },
        orderBy: {
          _count: {
            network: 'desc'
          }
        }
      }),
      // Get stations by last verified time to show data freshness
      prisma.chargingStation.groupBy({
        by: ['lastVerified'],
        _count: {
          lastVerified: true
        },
        orderBy: {
          lastVerified: 'desc'
        },
        take: 10
      })
    ])

    const stats = {
      overview: {
        totalStations,
        totalPriceReports: totalPrices,
        recentPrices24h: recentPrices.length,
        lastUpdated: recentPrices[0]?.reportedAt || null
      },
      networks: networkStats.map(stat => ({
        network: stat.network || 'Unknown',
        stationCount: stat._count.network
      })),
      dataSources: sourceStats.slice(0, 5).map(stat => ({
        lastVerified: stat.lastVerified,
        count: stat._count.lastVerified
      })),
      recentPricing: recentPrices.slice(0, 10).map(price => ({
        stationName: price.station.name,
        network: price.station.network,
        pricePerKwh: price.pricePerKwh,
        sessionFee: price.sessionFee,
        reportedAt: price.reportedAt,
        location: {
          latitude: price.station.latitude,
          longitude: price.station.longitude
        }
      }))
    }

    return NextResponse.json({
      success: true,
      stats,
      message: 'Enhanced scraping statistics retrieved'
    })
  } catch (error) {
    console.error('Error getting enhanced scraping stats:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get scraping statistics' 
      },
      { status: 500 }
    )
  }
}