'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Loader2, MapPin, Navigation } from 'lucide-react'

// Dynamically import the map to avoid SSR issues
const DynamicMap = dynamic(() => import('./MapComponent'), {
  loading: () => (
    <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
      <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      <span className="ml-2 text-gray-600">Loading map...</span>
    </div>
  ),
  ssr: false,
})

interface ChargingStation {
  id: string
  name: string
  address: string
  suburb?: string
  state: string
  network?: string
  latitude: number
  longitude: number
  priceReports: Array<{
    pricePerKwh?: number
    sessionFee?: number
    reportedAt: string
  }>
  connectorTypes?: string
  powerKw?: number
}

interface UserLocation {
  latitude: number
  longitude: number
  accuracy?: number
}

export default function InteractiveMap() {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [stations, setStations] = useState<ChargingStation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [locationPermission, setLocationPermission] = useState<'pending' | 'granted' | 'denied'>('pending')

  // Get user's current location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          }
          setUserLocation(location)
          setLocationPermission('granted')
          fetchNearbyStations(location.latitude, location.longitude)
        },
        (error) => {
          console.error('Error getting location:', error)
          setLocationPermission('denied')
          // Fallback to Sydney CBD coordinates
          const sydneyLocation = { latitude: -33.8688, longitude: 151.2093 }
          setUserLocation(sydneyLocation)
          fetchNearbyStations(sydneyLocation.latitude, sydneyLocation.longitude)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      )
    } else {
      setLocationPermission('denied')
      setError('Geolocation is not supported by this browser')
      // Fallback to Sydney CBD
      const sydneyLocation = { latitude: -33.8688, longitude: 151.2093 }
      setUserLocation(sydneyLocation)
      fetchNearbyStations(sydneyLocation.latitude, sydneyLocation.longitude)
    }
  }, [])

  const fetchNearbyStations = async (lat: number, lng: number, radius: number = 50) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/stations?lat=${lat}&lng=${lng}&radius=${radius}`)
      const data = await response.json()
      
      if (data.success) {
        setStations(data.stations)
      } else {
        setError('Failed to fetch nearby stations')
      }
    } catch (err) {
      console.error('Error fetching stations:', err)
      setError('Failed to load charging stations')
    } finally {
      setLoading(false)
    }
  }

  const requestLocation = () => {
    setLocationPermission('pending')
    setError(null)
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          }
          setUserLocation(location)
          setLocationPermission('granted')
          fetchNearbyStations(location.latitude, location.longitude)
        },
        (error) => {
          console.error('Error getting location:', error)
          setLocationPermission('denied')
          setError('Unable to access your location. Please enable location services.')
        }
      )
    }
  }

  return (
    <div className="w-full">
      {/* Location Status Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <MapPin className="h-5 w-5 text-green-600 mr-2" />
            <div>
              {locationPermission === 'granted' && userLocation && (
                <span className="text-sm text-gray-700">
                  Using your current location ({userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)})
                </span>
              )}
              {locationPermission === 'denied' && (
                <span className="text-sm text-gray-700">
                  Using default location (Sydney CBD)
                </span>
              )}
              {locationPermission === 'pending' && (
                <span className="text-sm text-gray-700">
                  Getting your location...
                </span>
              )}
            </div>
          </div>
          
          {locationPermission === 'denied' && (
            <button
              onClick={requestLocation}
              className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Enable Location
            </button>
          )}
        </div>
        
        {error && (
          <div className="mt-2 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Nearby EV Charging Stations
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            {loading ? 'Loading stations...' : `Found ${stations.length} stations nearby`}
          </p>
        </div>
        
        {userLocation && (
          <div className="h-96 lg:h-[600px]">
            <DynamicMap
              center={[userLocation.latitude, userLocation.longitude]}
              stations={stations}
              userLocation={userLocation}
              loading={loading}
            />
          </div>
        )}
      </div>

      {/* Station Count and Refresh */}
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {!loading && stations.length > 0 && (
            <span>Showing {stations.length} charging stations within 50km</span>
          )}
        </div>
        
        <button
          onClick={() => userLocation && fetchNearbyStations(userLocation.latitude, userLocation.longitude)}
          disabled={loading || !userLocation}
          className="flex items-center bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm"
        >
          <Navigation className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>
    </div>
  )
}