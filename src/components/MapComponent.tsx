'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L, { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Zap, DollarSign, MapPin, Clock } from 'lucide-react'
import GoogleMapsButton from './GoogleMapsButton'

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
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

interface MapComponentProps {
  center: LatLngExpression
  stations: ChargingStation[]
  userLocation: UserLocation
  loading: boolean
}

// Custom icons for different station types
const createStationIcon = (network?: string) => {
  const networkColor = getNetworkColor(network)
  
  return L.divIcon({
    html: `
      <div style="
        background-color: ${networkColor};
        border: 2px solid white;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">
        <div style="
          color: white;
          font-size: 12px;
          font-weight: bold;
        ">⚡</div>
      </div>
    `,
    className: 'custom-station-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  })
}

const createUserIcon = () => {
  return L.divIcon({
    html: `
      <div style="
        background-color: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        animation: pulse 2s infinite;
      "></div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      </style>
    `,
    className: 'user-location-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

const getNetworkColor = (network?: string): string => {
  if (!network) return '#6b7280'
  
  const networkLower = network.toLowerCase()
  if (networkLower.includes('chargefox')) return '#ff6b35'
  if (networkLower.includes('evie')) return '#00c851'
  if (networkLower.includes('tesla')) return '#cc0000'
  if (networkLower.includes('bp')) return '#00916e'
  return '#6b7280'
}

const formatPrice = (pricePerKwh?: number, sessionFee?: number): string => {
  if (!pricePerKwh && !sessionFee) return 'No pricing data'
  
  let priceText = ''
  if (pricePerKwh) {
    priceText = `$${pricePerKwh.toFixed(2)}/kWh`
  }
  if (sessionFee) {
    priceText += priceText ? ` + $${sessionFee.toFixed(2)} session` : `$${sessionFee.toFixed(2)} session fee`
  }
  return priceText
}

const getTimeSince = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return `${Math.floor(diffDays / 30)} months ago`
}

// Component to fit map to show all stations
function FitMapBounds({ stations, userLocation }: { stations: ChargingStation[], userLocation: UserLocation }) {
  const map = useMap()
  
  useEffect(() => {
    if (stations.length > 0) {
      const bounds = L.latLngBounds([
        [userLocation.latitude, userLocation.longitude],
        ...stations.map(station => [station.latitude, station.longitude] as LatLngExpression)
      ])
      
      map.fitBounds(bounds, { padding: [20, 20] })
    }
  }, [map, stations, userLocation])
  
  return null
}

export default function MapComponent({ center, stations, userLocation }: MapComponentProps) {
  const mapRef = useRef<L.Map>(null)

  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* User location marker */}
      <Marker
        position={[userLocation.latitude, userLocation.longitude]}
        icon={createUserIcon()}
      >
        <Popup>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <MapPin className="h-4 w-4 text-blue-600 mr-1" />
              <span className="font-medium">Your Location</span>
            </div>
            <div className="text-sm text-gray-600">
              {userLocation.accuracy && (
                <span>Accuracy: ±{Math.round(userLocation.accuracy)}m</span>
              )}
            </div>
          </div>
        </Popup>
      </Marker>

      {/* Charging station markers */}
      {stations.map((station) => {
        const latestPrice = station.priceReports[0]
        
        return (
          <Marker
            key={station.id}
            position={[station.latitude, station.longitude]}
            icon={createStationIcon(station.network)}
          >
            <Popup maxWidth={300} minWidth={250}>
              <div className="p-2">
                {/* Station Header */}
                <div className="border-b pb-2 mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                    {station.name}
                  </h3>
                  <div className="flex items-center mt-1">
                    <MapPin className="h-3 w-3 text-gray-500 mr-1" />
                    <span className="text-xs text-gray-600 flex-1">
                      {station.address}
                      {station.suburb && `, ${station.suburb}`}
                    </span>
                    <GoogleMapsButton 
                      latitude={station.latitude}
                      longitude={station.longitude}
                      address={station.address}
                      name={station.name}
                      className="ml-2"
                    />
                  </div>
                </div>

                {/* Network and Technical Info */}
                <div className="space-y-1 mb-3">
                  {station.network && (
                    <div className="flex items-center">
                      <Zap className="h-3 w-3 text-gray-500 mr-1" />
                      <span className="text-xs text-gray-700">{station.network}</span>
                    </div>
                  )}
                  
                  {station.powerKw && (
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Power:</span> {station.powerKw}kW
                    </div>
                  )}
                  
                  {station.connectorTypes && (
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Connectors:</span> {station.connectorTypes}
                    </div>
                  )}
                </div>

                {/* Pricing Information */}
                {latestPrice ? (
                  <div className="bg-green-50 rounded-lg p-2 mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center">
                        <DollarSign className="h-3 w-3 text-green-600 mr-1" />
                        <span className="text-xs font-medium text-green-800">Latest Price</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 text-gray-500 mr-1" />
                        <span className="text-xs text-gray-600">
                          {getTimeSince(latestPrice.reportedAt)}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-green-700">
                      {formatPrice(latestPrice.pricePerKwh, latestPrice.sessionFee)}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-2 mb-2">
                    <span className="text-xs text-gray-500">No pricing data available</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-1">
                  <button className="flex-1 bg-green-600 text-white py-1 px-2 rounded text-xs hover:bg-green-700">
                    Details
                  </button>
                  <button className="flex-1 bg-gray-100 text-gray-700 py-1 px-2 rounded text-xs hover:bg-gray-200">
                    Add Price
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}

      {/* Auto-fit bounds to show all stations */}
      <FitMapBounds stations={stations} userLocation={userLocation} />
    </MapContainer>
  )
}