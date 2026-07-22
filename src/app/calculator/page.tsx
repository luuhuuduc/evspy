'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Zap, Fuel, DollarSign, Leaf, ArrowRight, Calculator } from 'lucide-react'

export default function CalculatorPage() {
  const [annualDistance, setAnnualDistance] = useState<number>(15000) // km/year
  const [evEfficiency, setEvEfficiency] = useState<number>(16.5) // kWh/100km
  const [chargingPrice, setChargingPrice] = useState<number>(0.45) // $/kWh
  const [petrolPrice, setPetrolPrice] = useState<number>(1.95) // $/L
  const [petrolEfficiency, setPetrolEfficiency] = useState<number>(8.5) // L/100km

  // Calculations
  const evKwhPerYear = (annualDistance / 100) * evEfficiency
  const evCostPerYear = evKwhPerYear * chargingPrice
  const evCostPer100km = evEfficiency * chargingPrice

  const petrolLitresPerYear = (annualDistance / 100) * petrolEfficiency
  const petrolCostPerYear = petrolLitresPerYear * petrolPrice
  const petrolCostPer100km = petrolEfficiency * petrolPrice

  const annualSavings = petrolCostPerYear - evCostPerYear
  const co2SavedKg = Math.round(petrolLitresPerYear * 2.31) // ~2.31 kg CO2 per litre of petrol

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Navigation Header */}
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
              <Link href="/calculator" className="text-green-600 font-semibold">Savings Calculator</Link>
              <Link href="/analytics" className="text-gray-700 hover:text-green-600">Analytics</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-green-100 rounded-full mb-3">
            <Calculator className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">EV vs Fuel Savings Calculator</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Compare your electric vehicle charging costs against petrol or diesel vehicles in Australia.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Inputs Section */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <Zap className="h-5 w-5 text-green-600 mr-2" />
              Driving & Vehicle Parameters
            </h2>

            <div className="space-y-6">
              {/* Annual Distance */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Annual Distance Driven</label>
                  <span className="text-sm font-bold text-green-600">{annualDistance.toLocaleString()} km/year</span>
                </div>
                <input
                  type="range"
                  min={5000}
                  max={50000}
                  step={1000}
                  value={annualDistance}
                  onChange={(e) => setAnnualDistance(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                />
              </div>

              {/* Grid 2 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* EV Parameters */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-100 space-y-4">
                  <h3 className="font-medium text-green-900 flex items-center text-sm">
                    <Zap className="h-4 w-4 mr-1 text-green-600" /> Electric Vehicle (EV)
                  </h3>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">EV Efficiency (kWh/100km)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={evEfficiency}
                      onChange={(e) => setEvEfficiency(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-md text-sm focus:ring-green-500 focus:border-green-500 bg-white"
                    />
                    <span className="text-xs text-gray-500 mt-1 block">Avg Tesla Model 3 / BYD Atto 3: 15-17 kWh</span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Charging Rate ($/kWh)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={chargingPrice}
                      onChange={(e) => setChargingPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-md text-sm focus:ring-green-500 focus:border-green-500 bg-white"
                    />
                    <span className="text-xs text-gray-500 mt-1 block">Home AC: $0.25 | Public DC: $0.50-$0.70</span>
                  </div>
                </div>

                {/* Petrol Parameters */}
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 space-y-4">
                  <h3 className="font-medium text-amber-900 flex items-center text-sm">
                    <Fuel className="h-4 w-4 mr-1 text-amber-600" /> Petrol / Diesel Car
                  </h3>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Fuel Consumption (L/100km)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={petrolEfficiency}
                      onChange={(e) => setPetrolEfficiency(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-md text-sm focus:ring-amber-500 focus:border-amber-500 bg-white"
                    />
                    <span className="text-xs text-gray-500 mt-1 block">Average sedan/SUV: 7.5 - 9.5 L/100km</span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Fuel Price ($/L)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={petrolPrice}
                      onChange={(e) => setPetrolPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-md text-sm focus:ring-amber-500 focus:border-amber-500 bg-white"
                    />
                    <span className="text-xs text-gray-500 mt-1 block">Unleaded 95 / Diesel avg in AU</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Savings Results Card */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                Annual Cost Summary
              </h2>

              {/* Total Savings Highlights */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-5 text-white mb-6 text-center">
                <span className="text-xs font-semibold uppercase tracking-wider opacity-90">Estimated Annual Savings</span>
                <div className="text-4xl font-extrabold my-1">
                  ${Math.max(0, annualSavings).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs opacity-90">Save money every kilometer with EV charging</p>
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600 flex items-center">
                    <Zap className="h-4 w-4 text-green-600 mr-1" /> EV Annual Charging
                  </span>
                  <span className="font-semibold text-gray-900">${evCostPerYear.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600 flex items-center">
                    <Fuel className="h-4 w-4 text-amber-600 mr-1" /> Petrol Annual Fuel
                  </span>
                  <span className="font-semibold text-gray-900">${petrolCostPerYear.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Cost per 100km (EV vs Petrol)</span>
                  <span className="font-semibold text-green-700">${evCostPer100km.toFixed(2)} vs ${petrolCostPer100km.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-gray-600 flex items-center">
                    <Leaf className="h-4 w-4 text-emerald-600 mr-1" /> CO2 Reduction
                  </span>
                  <span className="font-semibold text-emerald-700">{co2SavedKg.toLocaleString()} kg / year</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Link
                href="/stations"
                className="w-full inline-flex items-center justify-center px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow"
              >
                Find Cheap Charging Stations <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
