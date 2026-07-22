import React from 'react'
import { ExternalLink } from 'lucide-react'

interface GoogleMapsButtonProps {
  latitude: number
  longitude: number
  address?: string
  name?: string
  className?: string
}

// Check if address is a placeholder or generic text
function isPlaceholderAddress(address?: string): boolean {
  if (!address) return true
  
  const placeholderPatterns = [
    'Location available via',
    'TBD',
    'Charging Station',
    'Station',
    'Location data available',
    'Chargefox Station'
  ]
  
  return placeholderPatterns.some(pattern => 
    address.toLowerCase().includes(pattern.toLowerCase())
  )
}

export const GoogleMapsButton: React.FC<GoogleMapsButtonProps> = ({
  latitude,
  longitude,
  address,
  name,
  className = ''
}) => {
  // Use coordinates if address is placeholder or missing
  const shouldUseCoordinates = isPlaceholderAddress(address)
  
  // Create Google Maps URL
  const query = shouldUseCoordinates 
    ? `${latitude},${longitude}`  // Use coordinates for precise location
    : address!
    
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
  
  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        inline-flex items-center gap-1 px-2 py-1 
        bg-green-600 hover:bg-green-700 
        text-white text-xs font-medium 
        rounded border border-green-700
        transition-colors duration-200
        no-underline
        ${className}
      `}
      title={`Open ${name || 'location'} in Google Maps`}
    >
      <ExternalLink size={12} />
      <span>Maps</span>
    </a>
  )
}

export default GoogleMapsButton