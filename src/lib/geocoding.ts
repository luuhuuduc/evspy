// Utility for reverse geocoding coordinates to addresses
interface ReverseGeocodingResult {
  formattedAddress: string
  suburb?: string
  state?: string
  postcode?: string
  country?: string
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodingResult | null> {
  try {
    // Use OpenStreetMap Nominatim service (free, no API key required)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'EVSpy/1.0 (EV Charging Station App)'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data && data.display_name) {
      return {
        formattedAddress: data.display_name,
        suburb: data.address?.suburb || data.address?.city_district || data.address?.neighbourhood,
        state: data.address?.state,
        postcode: data.address?.postcode,
        country: data.address?.country
      }
    }

    return null
  } catch (error) {
    console.error('Reverse geocoding failed:', error)
    return null
  }
}

// Cache for geocoding results to avoid repeated API calls
const geocodingCache = new Map<string, ReverseGeocodingResult | null>()

export async function reverseGeocodeWithCache(latitude: number, longitude: number): Promise<ReverseGeocodingResult | null> {
  // Round coordinates to 4 decimal places for caching (about 11m precision)
  const lat = Math.round(latitude * 10000) / 10000
  const lng = Math.round(longitude * 10000) / 10000
  const cacheKey = `${lat},${lng}`

  if (geocodingCache.has(cacheKey)) {
    return geocodingCache.get(cacheKey)!
  }

  const result = await reverseGeocode(lat, lng)
  geocodingCache.set(cacheKey, result)
  
  return result
}

// Extract a short, user-friendly name from the full address
export function extractLocationName(address: string): string {
  // Split by comma and take the first meaningful part
  const parts = address.split(',').map(part => part.trim())
  
  // Skip house numbers and take the first named location
  for (const part of parts) {
    if (part && !/^\d+/.test(part) && part.length > 3) {
      return part
    }
  }
  
  return parts[0] || 'Charging Station'
}