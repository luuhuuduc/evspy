'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { MapPin, Zap, Star, DollarSign } from 'lucide-react'
import GoogleMapsButton from '../../components/GoogleMapsButton'

interface ChargingStation {
  id: string
  name: string
  address: string
  suburb?: string
  state: string
  postcode?: string
  network?: string
  connectorTypes?: string
  powerKw?: number
  latitude: number
  longitude: number
  priceReports: Array<{
    pricePerKwh?: number
    sessionFee?: number
    reportedAt: string
  }>
  reviews: Array<{
    rating: number
    comment?: string
    user: { name?: string }
  }>
  _count: {
    reviews: number
    priceReports: number
  }
}

interface StationsResponse {
  success: boolean
  stations: ChargingStation[]
  count: number
}

export default function StationsPage() {
  const [stations, setStations] = useState<ChargingStation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedNetwork, setSelectedNetwork] = useState('')

  const networks = ['All Networks', 'Chargefox', 'Evie Networks', 'Tesla', 'BP Pulse']

  const fetchStations = useCallback(async () => {
    try {
      setLoading(true)
      const networkParam = selectedNetwork && selectedNetwork !== 'All Networks' 
        ? `?network=${encodeURIComponent(selectedNetwork)}` 
        : ''
      
      const response = await fetch(`/api/stations${networkParam}`)
      const data: StationsResponse = await response.json()
      
      if (data.success) {
        setStations(data.stations)
      } else {
        setError('Failed to fetch stations')
      }
    } catch (err) {
      setError('Failed to load charging stations')
      console.error('Error fetching stations:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedNetwork])

  useEffect(() => {
    fetchStations()
  }, [fetchStations])

  const filteredStations = stations.filter(station =>
    station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    station.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    station.suburb?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    station.network?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getLatestPrice = (station: ChargingStation) => {
    if (station.priceReports.length === 0) return null
    return station.priceReports[0]
  }

  const getAverageRating = (station: ChargingStation) => {
    if (station.reviews.length === 0) return null
    const sum = station.reviews.reduce((acc, review) => acc + review.rating, 0)
    return sum / station.reviews.length
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
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-700 hover:text-green-600">Home</Link>
              <Link href="/stations" className="text-green-600 font-medium">Find Stations</Link>
              <Link href="/submit-price" className="text-gray-700 hover:text-green-600">Submit Price</Link>
              <Link href="/calculator" className="text-gray-700 hover:text-green-600">Savings Calculator</Link>
              <Link href="/analytics" className="text-gray-700 hover:text-green-600">Analytics</Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by station name, address, or network..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="lg:w-64">
                <select
                  value={selectedNetwork}
                  onChange={(e) => setSelectedNetwork(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {networks.map(network => (
                    <option key={network} value={network === 'All Networks' ? '' : network}>
                      {network}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">EV Charging Stations</h1>
          <p className="text-gray-600">
            {loading ? 'Loading...' : `Found ${filteredStations.length} charging stations`}
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
            <button 
              onClick={fetchStations}
              className="text-red-600 hover:text-red-800 font-medium mt-2"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        )}

        {/* Stations Grid */}
        {!loading && filteredStations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStations.map((station) => {
              const latestPrice = getLatestPrice(station)
              const averageRating = getAverageRating(station)
              
              return (
                <div key={station.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                      {station.name}
                    </h3>
                    {averageRating && (
                      <div className="flex items-center ml-2">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600 ml-1">
                          {averageRating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-start text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2 flex-1">
                        {station.address}
                        {station.suburb && `, ${station.suburb}`}
                        {station.state && ` ${station.state}`}
                        {station.postcode && ` ${station.postcode}`}
                      </span>
                      <GoogleMapsButton 
                        latitude={station.latitude}
                        longitude={station.longitude}
                        address={station.address}
                        name={station.name}
                        className="ml-2 flex-shrink-0"
                      />
                    </div>

                    {station.network && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Zap className="h-4 w-4 mr-2" />
                        <span>{station.network}</span>
                      </div>
                    )}

                    {station.powerKw && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium mr-2">Power:</span>
                        <span>{station.powerKw}kW</span>
                      </div>
                    )}

                    {station.connectorTypes && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium mr-2">Connectors:</span>
                        <span className="line-clamp-1">{station.connectorTypes}</span>
                      </div>
                    )}
                  </div>

                  {/* Price Information */}
                  {latestPrice ? (
                    <div className="bg-green-50 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                          <span className="text-sm font-medium text-green-800">Latest Price</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(latestPrice.reportedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mt-1">
                        {latestPrice.pricePerKwh && (
                          <span className="text-lg font-bold text-green-700">
                            ${latestPrice.pricePerKwh.toFixed(2)}/kWh
                          </span>
                        )}
                        {latestPrice.sessionFee && (
                          <span className="text-sm text-green-600 ml-2">
                            +${latestPrice.sessionFee.toFixed(2)} session fee
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <span className="text-sm text-gray-500">No pricing data available</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 text-sm">
                      View Details
                    </button>
                    <Link
                      href={`/submit-price?station=${station.id}`}
                      className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 text-sm"
                    >
                      Add Price
                    </Link>
                  </div>

                  {/* Stats */}
                  <div className="flex justify-between text-xs text-gray-500 mt-3">
                    <span>{station._count.reviews} reviews</span>
                    <span>{station._count.priceReports} price reports</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredStations.length === 0 && !error && (
          <div className="text-center py-12">
            <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No charging stations found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search criteria or import some station data.
            </p>
            <Link
              href="/api/import-stations"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
            >
              Import Station Data
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}