'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Zap, TrendingUp, BarChart3, ShieldCheck, DollarSign } from 'lucide-react'

interface NetworkStat {
  network: string
  avgPricePerKwh: number
  minPrice: number
  maxPrice: number
  reportCount: number
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<NetworkStat[]>([])
  const [nationalAvg, setNationalAvg] = useState<number>(0.55)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true)
        const res = await fetch('/api/analytics')
        const data = await res.json()
        if (data.success) {
          setStats(data.networkStats)
          setNationalAvg(data.nationalAvgPrice)
        }
      } catch (err) {
        console.error('Failed to load analytics:', err)
      } finally {
        setLoading(false)
      }
    }
    loadAnalytics()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-green-600 mr-2" />
              <Link href="/" className="text-2xl font-bold text-gray-900">EVSpy</Link>
              <span className="ml-2 text-sm text-gray-500 font-medium">Australia</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-700 hover:text-green-600">Home</Link>
              <Link href="/stations" className="text-gray-700 hover:text-green-600">Find Stations</Link>
              <Link href="/submit-price" className="text-gray-700 hover:text-green-600">Submit Price</Link>
              <Link href="/calculator" className="text-gray-700 hover:text-green-600">Savings Calculator</Link>
              <Link href="/analytics" className="text-green-600 font-semibold">Analytics</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Analytics Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-purple-100 rounded-full mb-3">
            <BarChart3 className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Australian EV Pricing Insights</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mt-2">
            Real-time average electricity rates and pricing trends across Australian EV charging networks.
          </p>
        </div>

        {/* Overview Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
            <div className="p-4 bg-green-100 rounded-lg text-green-600 mr-4">
              <DollarSign className="h-8 w-8" />
            </div>
            <div>
              <span className="text-xs text-gray-500 font-medium uppercase">National Avg Rate</span>
              <div className="text-2xl font-bold text-gray-900">${nationalAvg.toFixed(2)} / kWh</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
            <div className="p-4 bg-blue-100 rounded-lg text-blue-600 mr-4">
              <Zap className="h-8 w-8" />
            </div>
            <div>
              <span className="text-xs text-gray-500 font-medium uppercase">Lowest Public Rate</span>
              <div className="text-2xl font-bold text-gray-900">$0.35 - $0.45 / kWh</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
            <div className="p-4 bg-purple-100 rounded-lg text-purple-600 mr-4">
              <TrendingUp className="h-8 w-8" />
            </div>
            <div>
              <span className="text-xs text-gray-500 font-medium uppercase">Ultra-Rapid DC Rate</span>
              <div className="text-2xl font-bold text-gray-900">$0.65 - $0.75 / kWh</div>
            </div>
          </div>
        </div>

        {/* Network Breakdown Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <ShieldCheck className="h-5 w-5 text-purple-600 mr-2" />
            Network Price Comparison
          </h2>

          {loading ? (
            <div className="text-center py-10 text-gray-500">Loading pricing analytics...</div>
          ) : stats.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'Chargefox', rate: '$0.55/kWh', desc: 'Australia\'s largest charging network' },
                { name: 'Evie Networks', rate: '$0.58/kWh', desc: '100% renewable powered fast charging' },
                { name: 'Tesla Supercharger', rate: '$0.62/kWh', desc: 'High reliability V3 & V4 chargers' },
                { name: 'BP Pulse', rate: '$0.65/kWh', desc: 'Convenience store ultra-rapid charging' }
              ].map(net => (
                <div key={net.name} className="p-5 bg-gray-50 rounded-xl border border-gray-100">
                  <h3 className="font-semibold text-gray-900">{net.name}</h3>
                  <div className="text-2xl font-bold text-green-600 my-2">{net.rate}</div>
                  <p className="text-xs text-gray-500">{net.desc}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map(s => (
                <div key={s.network} className="p-5 bg-gray-50 rounded-xl border border-gray-100">
                  <h3 className="font-semibold text-gray-900">{s.network}</h3>
                  <div className="text-2xl font-bold text-green-600 my-2">${s.avgPricePerKwh}/kWh</div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Min: ${s.minPrice.toFixed(2)} | Max: ${s.maxPrice.toFixed(2)}</div>
                    <div>Reports: {s.reportCount} verified submissions</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
