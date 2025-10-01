import React from 'react'
import { ExternalLink } from 'lucide-react'

interface GoogleMapsButtonProps {
  latitude: number
  longitude: number
  address?: string
  name?: string
  className?: string
}

export const GoogleMapsButton: React.FC<GoogleMapsButtonProps> = ({
  latitude,
  longitude,
  address,
  name,
  className = ''
}) => {
  const handleOpenMaps = () => {
    // Create Google Maps URL
    const query = address || `${latitude},${longitude}`
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    
    // Open in new tab
    window.open(mapsUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      onClick={handleOpenMaps}
      className={`
        inline-flex items-center gap-1 px-2 py-1 
        bg-green-600 hover:bg-green-700 
        text-white text-xs font-medium 
        rounded border border-green-700
        transition-colors duration-200
        ${className}
      `}
      title={`Open ${name || 'location'} in Google Maps`}
    >
      <ExternalLink size={12} />
      <span>Maps</span>
    </button>
  )
}

export default GoogleMapsButton