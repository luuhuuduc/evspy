// API endpoint to analyze PlugShare
import { NextResponse } from 'next/server'
import { plugshareAnalyzer } from '../../../lib/plugshare-analyzer'

export async function POST() {
  try {
    console.log('🔍 Starting PlugShare API analysis...')
    
    const apiCalls = await plugshareAnalyzer.analyzePlugShareAPIs()
    
    // Print analysis to console
    plugshareAnalyzer.printAnalysis()
    
    // Close browser
    await plugshareAnalyzer.closeBrowser()
    
    return NextResponse.json({
      success: true,
      message: 'PlugShare analysis completed',
      apiCallsFound: apiCalls.length,
      apiCalls: apiCalls.map(call => ({
        url: call.url,
        method: call.method,
        timestamp: call.timestamp,
        hasResponseData: !!call.responseData,
        responseType: typeof call.responseData
      }))
    })
    
  } catch (error) {
    console.error('❌ PlugShare analysis error:', error)
    
    // Make sure to close browser even on error
    try {
      await plugshareAnalyzer.closeBrowser()
    } catch (closeError) {
      console.error('Error closing browser:', closeError)
    }
    
    return NextResponse.json(
      { error: 'Failed to analyze PlugShare APIs' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'PlugShare API analyzer ready. Send POST request to start analysis.',
    instructions: 'This will open a browser window to analyze PlugShare API calls.'
  })
}