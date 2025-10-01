'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Zap, 
  RefreshCw, 
  Activity, 
  Database, 
  Clock, 
  AlertCircle,
  CheckCircle,
  PlayCircle 
} from 'lucide-react'

interface ScrapingStats {
  totalPricesLast24h: number
  networkBreakdown: Record<string, number>
  lastScrapedAt: string | null
}

interface ScrapingStatus {
  success: boolean
  stats: ScrapingStats
  recentPrices: Array<{
    pricePerKwh: number | null
    sessionFee: number | null
    reportedAt: string
    station: {
      name: string
      network: string | null
    }
  }>
}

export default function AdminPage() {
  const [scrapingStatus, setScrapingStatus] = useState<ScrapingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [scraping, setScraping] = useState(false)
  const [enhancedScraping, setEnhancedScraping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchScrapingStatus()
  }, [])

  const fetchScrapingStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/scrape-prices')
      const data = await response.json()
      
      if (data.success) {
        setScrapingStatus(data)
      } else {
        setError('Failed to fetch scraping status')
      }
    } catch (err) {
      setError('Failed to load admin dashboard')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const runEnhancedScraping = async () => {
    try {
      setEnhancedScraping(true)
      setError(null)
      
      const response = await fetch('/api/enhanced-scraping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platforms: ['chargefox', 'plugshare', 'chargeprice', 'exploren'] })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Refresh the status after scraping
        await fetchScrapingStatus()
      } else {
        setError('Enhanced scraping failed: ' + result.error)
      }
    } catch (err) {
      setError('Failed to run enhanced scraping')
      console.error('Error:', err)
    } finally {
      setEnhancedScraping(false)
    }
  }

  const runScraping = async () => {
    try {
      setScraping(true)
      setError(null)
      
      const response = await fetch('/api/scrape-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ networks: ['chargefox', 'evie', 'tesla'] })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Refresh the status after scraping
        await fetchScrapingStatus()
      } else {
        setError('Scraping failed: ' + result.error)
      }
    } catch (err) {
      setError('Failed to run scraping')
      console.error('Error:', err)
    } finally {
      setScraping(false)
    }
  }

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Never'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    
    if (diffHours > 24) {
      return `${Math.floor(diffHours / 24)} days ago`
    } else if (diffHours > 0) {
      return `${diffHours} hours ago`
    } else {
      return `${diffMinutes} minutes ago`
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <Zap className="h-8 w-8 text-green-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">EVSpy</span>
              <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">Admin</span>
            </Link>
            <nav className="flex space-x-8">
              <Link href="/" className="text-gray-700 hover:text-green-600">Home</Link>
              <Link href="/stations" className="text-gray-700 hover:text-green-600">Stations</Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">EVSpy Admin Dashboard</h1>
          <p className="text-gray-600">Monitor price scraping and system status</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-green-600 mr-2" />
            <span className="text-gray-600">Loading dashboard...</span>
          </div>
        )}

        {/* Dashboard Content */}
        {!loading && scrapingStatus && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Statistics Cards */}
            <div className="lg:col-span-2 space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="flex items-center">
                    <Database className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Prices (24h)</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {scrapingStatus.stats.totalPricesLast24h}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Last Scraped</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatTimeAgo(scrapingStatus.stats.lastScrapedAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="flex items-center">
                    <Activity className="h-8 w-8 text-purple-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Networks</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Object.keys(scrapingStatus.stats.networkBreakdown).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Network Breakdown */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Network Breakdown (24h)</h3>
                <div className="space-y-3">
                  {Object.entries(scrapingStatus.stats.networkBreakdown).map(([network, count]) => (
                    <div key={network} className="flex justify-between items-center">
                      <span className="text-gray-700">{network || 'Unknown'}</span>
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                        {count} prices
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Prices */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Recent Price Updates</h3>
                <div className="space-y-3">
                  {scrapingStatus.recentPrices.map((price, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        <p className="font-medium text-gray-900">{price.station.name}</p>
                        <p className="text-sm text-gray-600">{price.station.network}</p>
                      </div>
                      <div className="text-right">
                        {price.pricePerKwh && (
                          <p className="font-semibold text-green-600">
                            ${price.pricePerKwh.toFixed(2)}/kWh
                          </p>
                        )}
                        {price.sessionFee && (
                          <p className="text-sm text-gray-600">
                            +${price.sessionFee.toFixed(2)} session
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {formatTimeAgo(price.reportedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Control Panel */}
            <div className="space-y-6">
              {/* Scraping Controls */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Enhanced Scraping Controls</h3>
                
                <div className="space-y-4">
                  <button
                    onClick={runEnhancedScraping}
                    disabled={enhancedScraping}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {enhancedScraping ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                        Enhanced Scraping...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-5 w-5 mr-2" />
                        Run Enhanced Scraping
                      </>
                    )}
                  </button>
                  
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    <strong>Enhanced Scraping includes:</strong><br/>
                    • Chargefox (chargefox.com)<br/>
                    • PlugShare (plugshare.com)<br/>
                    • Chargeprice (chargeprice.app)<br/>
                    • Exploren (exploren.com.au)
                  </div>

                  <button
                    onClick={runScraping}
                    disabled={scraping}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {scraping ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Legacy Scraping...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Run Legacy Scraping
                      </>
                    )}
                  </button>

                  <button
                    onClick={fetchScrapingStatus}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Status
                  </button>
                </div>
              </div>

              {/* System Status */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">System Status</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Scraping Service</span>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-green-600 text-sm">Active</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Database</span>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-green-600 text-sm">Connected</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">API</span>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-green-600 text-sm">Online</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                
                <div className="space-y-2">
                  <Link
                    href="/api/import-stations"
                    className="block w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 text-center"
                  >
                    Import Stations
                  </Link>
                  
                  <Link
                    href="/stations"
                    className="block w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 text-center"
                  >
                    View All Stations
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}