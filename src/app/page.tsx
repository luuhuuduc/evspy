import Link from "next/link";
import { MapPin, Zap, Search, Star } from "lucide-react";
import InteractiveMap from "@/components/InteractiveMap";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-green-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">EVSpy</h1>
              <span className="ml-2 text-sm text-gray-500 font-medium">Australia</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-700 hover:text-green-600 font-medium">Home</Link>
              <Link href="/stations" className="text-gray-700 hover:text-green-600 font-medium">Find Stations</Link>
              <Link href="/submit-price" className="text-gray-700 hover:text-green-600 font-medium">Submit Price</Link>
              <Link href="/calculator" className="text-gray-700 hover:text-green-600 font-medium">Savings Calculator</Link>
              <Link href="/analytics" className="text-gray-700 hover:text-green-600 font-medium">Analytics</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/signin"
                className="text-gray-700 hover:text-green-600"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Map */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Find the Best
            <span className="text-green-600"> EV Charging </span>
            Prices Near You
          </h1>
          <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto">
            Real-time EV charging prices across Australia. Compare rates, find nearby stations, 
            and help the community with crowdsourced pricing data.
          </p>
        </div>

        {/* Interactive Map - Main Feature */}
        <div className="mb-12">
          <InteractiveMap />
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <MapPin className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-center">Location-Based Search</h3>
            <p className="text-gray-600 text-center">
              Automatically find charging stations near your current location with real-time pricing.
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <Zap className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-center">Live Price Data</h3>
            <p className="text-gray-600 text-center">
              Get the latest pricing from Chargefox, Evie, Tesla, and more through our scraping system.
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <Star className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-center">Community Driven</h3>
            <p className="text-gray-600 text-center">
              Submit prices and reviews to help fellow EV drivers save money and time.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-2xl font-semibold mb-6 text-center">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/stations"
              className="bg-green-100 rounded-lg p-4 hover:bg-green-200 transition-colors text-center"
            >
              <Search className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-green-800">Browse All Stations</span>
            </Link>
            <Link
              href="/submit-price"
              className="bg-blue-100 rounded-lg p-4 hover:bg-blue-200 transition-colors text-center"
            >
              <Zap className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-blue-800">Submit Pricing</span>
            </Link>
            <Link
              href="/api/import-stations"
              className="bg-purple-100 rounded-lg p-4 hover:bg-purple-200 transition-colors text-center"
            >
              <MapPin className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-purple-800">Import Data</span>
            </Link>
            <Link
              href="/about"
              className="bg-gray-100 rounded-lg p-4 hover:bg-gray-200 transition-colors text-center"
            >
              <Star className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-800">Learn More</span>
            </Link>
          </div>
        </div>

        {/* Popular Networks */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h3 className="text-2xl font-semibold mb-6 text-center">Supported Networks</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Chargefox', bg: 'bg-orange-100', text: 'text-orange-600' },
              { name: 'Evie Networks', bg: 'bg-green-100', text: 'text-green-600' },
              { name: 'Tesla Supercharger', bg: 'bg-red-100', text: 'text-red-600' },
              { name: 'BP Pulse', bg: 'bg-teal-100', text: 'text-teal-600' }
            ].map((network) => (
              <Link
                key={network.name}
                href={`/stations?network=${network.name.toLowerCase().replace(' ', '-')}`}
                className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
              >
                <div className="text-center">
                  <div className={`h-12 w-12 ${network.bg} rounded-full flex items-center justify-center mx-auto mb-2`}>
                    <Zap className={`h-6 w-6 ${network.text}`} />
                  </div>
                  <span className="text-sm font-medium">{network.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Zap className="h-6 w-6 text-green-500 mr-2" />
                <span className="text-xl font-bold">EVSpy</span>
              </div>
              <p className="text-gray-400">
                Australia&apos;s leading EV charging price comparison platform.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/stations" className="hover:text-white">Find Stations</Link></li>
                <li><Link href="/submit-price" className="hover:text-white">Submit Price</Link></li>
                <li><Link href="/api-docs" className="hover:text-white">API</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link href="/feedback" className="hover:text-white">Feedback</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 EVSpy. All rights reserved. Helping Australia go electric.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
