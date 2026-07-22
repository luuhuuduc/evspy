'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Zap, CheckCircle2, AlertCircle, Search } from 'lucide-react'

interface StationOption {
  id: string
  name: string
  address: string
  network?: string
}

export default function SubmitPricePage() {
  const [stations, setStations] = useState<StationOption[]>([])
  const [selectedStationId, setSelectedStationId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [pricePerKwh, setPricePerKwh] = useState<string>('0.45')
  const [sessionFee, setSessionFee] = useState<string>('0.00')
  const [connectorType, setConnectorType] = useState<string>('CCS2')
  const [timeOfDay, setTimeOfDay] = useState<string>('all_day')
  
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    async function loadStations() {
      try {
        const res = await fetch('/api/stations')
        const data = await res.json()
        if (data.success && Array.isArray(data.stations)) {
          setStations(data.stations)
          if (data.stations.length > 0) {
            setSelectedStationId(data.stations[0].id)
          }
        }
      } catch (err) {
        console.error('Failed to load stations:', err)
      }
    }
    loadStations()
  }, [])

  const filteredStations = stations.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.network && s.network.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!selectedStationId) {
      setErrorMessage('Please select a charging station.')
      return
    }

    const priceNum = parseFloat(pricePerKwh)
    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMessage('Please enter a valid price per kWh.')
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch('/api/submit-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId: selectedStationId,
          pricePerKwh: priceNum,
          sessionFee: parseFloat(sessionFee) || 0,
          connectorType,
          timeOfDay
        })
      })

      const data = await res.json()
      if (data.success) {
        setSuccessMessage('Thank you! Your price submission was successfully recorded.')
        setPricePerKwh('0.45')
        setSessionFee('0.00')
      } else {
        setErrorMessage(data.error || 'Failed to submit price report.')
      }
    } catch (err) {
      console.error(err)
      setErrorMessage('An unexpected error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

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
              <Link href="/submit-price" className="text-green-600 font-semibold">Submit Price</Link>
              <Link href="/calculator" className="text-gray-700 hover:text-green-600">Savings Calculator</Link>
              <Link href="/analytics" className="text-gray-700 hover:text-green-600">Analytics</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Form Section */}
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-3">
              <Zap className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Submit EV Charging Price</h1>
            <p className="text-gray-600 mt-2">
              Help Australian EV drivers save money by sharing real-time pricing data from your local charging stations.
            </p>
          </div>

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-800">
              <CheckCircle2 className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-800">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Station Search / Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Charging Station</label>
              
              <div className="relative mb-3">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search station by name or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <select
                value={selectedStationId}
                onChange={(e) => setSelectedStationId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-green-500 focus:border-green-500"
              >
                {filteredStations.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name} ({station.address})
                  </option>
                ))}
              </select>
            </div>

            {/* Price Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Electricity Rate ($/kWh)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500 text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.45"
                    value={pricePerKwh}
                    onChange={(e) => setPricePerKwh(e.target.value)}
                    className="w-full pl-7 pr-4 py-2 border rounded-lg text-sm focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Connection / Session Fee ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500 text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={sessionFee}
                    onChange={(e) => setSessionFee(e.target.value)}
                    className="w-full pl-7 pr-4 py-2 border rounded-lg text-sm focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Connector & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Connector Type</label>
                <select
                  value={connectorType}
                  onChange={(e) => setConnectorType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-green-500 focus:border-green-500"
                >
                  <option value="CCS2">CCS2 (DC Fast)</option>
                  <option value="CHAdeMO">CHAdeMO (DC)</option>
                  <option value="Type 2">Type 2 (AC)</option>
                  <option value="Tesla Supercharger">Tesla Supercharger</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Rate Window</label>
                <select
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-green-500 focus:border-green-500"
                >
                  <option value="all_day">Flat Rate (All Day)</option>
                  <option value="peak">Peak Hours</option>
                  <option value="off_peak">Off-Peak Hours</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Price Report'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
