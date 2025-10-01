import { NextRequest, NextResponse } from 'next/server'
import { OpenChargeMapService } from '@/lib/openchargemap'

export async function POST(request: NextRequest) {
  try {
    const { limit = 100 } = await request.json()
    
    const ocmService = new OpenChargeMapService()
    const importedCount = await ocmService.importStations(limit)
    
    return NextResponse.json({
      success: true,
      message: `Successfully imported ${importedCount} charging stations`,
      importedCount,
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to import charging stations' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const ocmService = new OpenChargeMapService()
    
    // Get sample data to test the connection
    const stations = await ocmService.fetchAustralianStations({ maxResults: 10 })
    
    return NextResponse.json({
      success: true,
      sampleStations: stations.length,
      message: 'OpenChargeMap API connection successful',
    })
  } catch (error) {
    console.error('API test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to connect to OpenChargeMap API' 
      },
      { status: 500 }
    )
  }
}