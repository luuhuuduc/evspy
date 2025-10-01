// Test the Google Maps button functionality
import React from 'react'
import GoogleMapsButton from '../src/components/GoogleMapsButton'

function TestGoogleMapsButton() {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Google Maps Button Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Royal Australian Mint (Example location)</h3>
        <p>Address: 17 Denison St, Deakin ACT 2600</p>
        <GoogleMapsButton 
          latitude={-35.3157}
          longitude={149.1003}
          address="17 Denison St, Deakin ACT 2600"
          name="Royal Australian Mint"
        />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Sydney Opera House (Example location)</h3>
        <p>Address: Bennelong Point, Sydney NSW 2000</p>
        <GoogleMapsButton 
          latitude={-33.8568}
          longitude={151.2153}
          address="Bennelong Point, Sydney NSW 2000"
          name="Sydney Opera House"
        />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Coordinates Only (Example)</h3>
        <p>Latitude: -37.8136, Longitude: 144.9631</p>
        <GoogleMapsButton 
          latitude={-37.8136}
          longitude={144.9631}
          name="Melbourne Location"
        />
      </div>
    </div>
  )
}

export default TestGoogleMapsButton