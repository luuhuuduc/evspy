import { NextRequest, NextResponse } from 'next/server'
import { OpenChargeMapService } from '@/lib/openchargemap'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const latitude = parseFloat(searchParams.get('lat') || '0')
    const longitude = parseFloat(searchParams.get('lng') || '0')
    const radius = parseInt(searchParams.get('radius') || '50')
    const network = searchParams.get('network')

    const ocmService = new OpenChargeMapService()

    let stations
    if (network) {
      stations = await ocmService.getStationsByNetwork(network)
    } else if (latitude && longitude) {
      stations = await ocmService.searchNearbyStations(latitude, longitude, radius)
    } else {
      // Return a default set of stations (first 50)
      stations = await ocmService.searchNearbyStations(-33.8688, 151.2093, 100) // Sydney area
    }

    return NextResponse.json({
      success: true,
      stations,
      count: stations.length,
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to search charging stations' 
      },
      { status: 500 }
    )
  }
}