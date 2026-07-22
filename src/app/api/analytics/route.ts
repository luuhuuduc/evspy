import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const priceReports = await prisma.priceReport.findMany({
      include: {
        station: {
          select: {
            name: true,
            network: true,
            powerKw: true,
            address: true,
            state: true
          }
        }
      },
      orderBy: { reportedAt: 'desc' }
    })

    const networkPrices: Record<string, { total: number; count: number; min: number; max: number }> = {}

    priceReports.forEach(report => {
      if (report.pricePerKwh && report.station.network) {
        const net = report.station.network
        if (!networkPrices[net]) {
          networkPrices[net] = { total: 0, count: 0, min: report.pricePerKwh, max: report.pricePerKwh }
        }
        networkPrices[net].total += report.pricePerKwh
        networkPrices[net].count += 1
        networkPrices[net].min = Math.min(networkPrices[net].min, report.pricePerKwh)
        networkPrices[net].max = Math.max(networkPrices[net].max, report.pricePerKwh)
      }
    })

    const networkStats = Object.keys(networkPrices).map(network => ({
      network,
      avgPricePerKwh: parseFloat((networkPrices[network].total / networkPrices[network].count).toFixed(2)),
      minPrice: networkPrices[network].min,
      maxPrice: networkPrices[network].max,
      reportCount: networkPrices[network].count
    }))

    return NextResponse.json({
      success: true,
      networkStats,
      totalReports: priceReports.length,
      nationalAvgPrice: networkStats.length > 0
        ? parseFloat((networkStats.reduce((acc, curr) => acc + curr.avgPricePerKwh, 0) / networkStats.length).toFixed(2))
        : 0.55
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
