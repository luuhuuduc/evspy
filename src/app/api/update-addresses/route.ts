// API endpoint to update existing stations with proper addresses
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { reverseGeocodeWithCache, extractLocationName } from '../../../lib/geocoding'

export async function POST(request: NextRequest) {
  try {
    const { limit = 50 } = await request.json()
    
    console.log(`🔄 Updating addresses for ${limit} stations...`)
    
    // Get stations with placeholder addresses
    const stations = await prisma.chargingStation.findMany({
      where: {
        OR: [
          { address: { contains: 'Location available via' } },
          { address: { contains: 'TBD' } },
          { suburb: 'TBD' },
          { state: 'TBD' }
        ]
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`📍 Found ${stations.length} stations needing address updates`)
    
    let updated = 0
    let errors = 0
    
    for (const station of stations) {
      try {
        // Get real address using reverse geocoding
        const addressInfo = await reverseGeocodeWithCache(station.latitude, station.longitude)
        
        if (addressInfo) {
          const stationName = extractLocationName(addressInfo.formattedAddress)
          
          await prisma.chargingStation.update({
            where: { id: station.id },
            data: {
              name: stationName.includes('Station') ? station.name : stationName, // Keep original if extracted name is generic
              address: addressInfo.formattedAddress,
              suburb: addressInfo.suburb || station.suburb,
              state: addressInfo.state || station.state,
              postcode: addressInfo.postcode || station.postcode
            }
          })
          
          updated++
          console.log(`✅ Updated: ${stationName}`)
        }
        
        // Rate limiting - wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.error(`❌ Error updating station ${station.id}:`, error)
        errors++
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Updated ${updated} stations, ${errors} errors`,
      updated,
      errors,
      totalProcessed: stations.length
    })
    
  } catch (error) {
    console.error('❌ Address update error:', error)
    return NextResponse.json(
      { error: 'Failed to update addresses' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get count of stations needing updates
    const needingUpdates = await prisma.chargingStation.count({
      where: {
        OR: [
          { address: { contains: 'Location available via' } },
          { address: { contains: 'TBD' } },
          { suburb: 'TBD' },
          { state: 'TBD' }
        ]
      }
    })
    
    return NextResponse.json({
      stationsNeedingUpdates: needingUpdates
    })
    
  } catch (error) {
    console.error('❌ Error checking stations:', error)
    return NextResponse.json(
      { error: 'Failed to check stations' },
      { status: 500 }
    )
  }
}