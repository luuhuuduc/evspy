import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { stationId, pricePerKwh, sessionFee = 0, connectorType, timeOfDay = 'peak' } = body

    if (!stationId) {
      return NextResponse.json({ success: false, error: 'Station ID is required' }, { status: 400 })
    }

    if (pricePerKwh === undefined || typeof pricePerKwh !== 'number' || pricePerKwh <= 0) {
      return NextResponse.json({ success: false, error: 'Valid price per kWh is required' }, { status: 400 })
    }

    // Create a new price report in database
    const priceReport = await prisma.priceReport.create({
      data: {
        stationId,
        pricePerKwh,
        sessionFee: typeof sessionFee === 'number' ? sessionFee : 0,
        connectorType: connectorType || 'CCS2',
        timeOfDay,
        isVerified: true,
        reportedAt: new Date(),
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Price report submitted successfully',
      priceReport
    })
  } catch (error) {
    console.error('Error submitting price report:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit price report' },
      { status: 500 }
    )
  }
}
