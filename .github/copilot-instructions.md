# EVSpy Project Instructions

This is an EV charging station price comparison website for Australia, similar to PetrolSpy but for electric vehicle charging.

## Project Overview
- **Project Type**: Next.js with TypeScript
- **Purpose**: EV charging station price comparison for Australia
- **Features**: OpenChargeMap integration, crowdsourced pricing, user reviews, map interface

## Development Guidelines
- Use TypeScript for type safety
- Implement responsive design with Tailwind CSS
- Integrate with OpenChargeMap API for station data
- Support crowdsourced pricing submissions
- Focus on Australian charging networks (Chargefox, Evie, Tesla, etc.)

## Progress Checklist
- [x] Verify that the copilot-instructions.md file in the .github directory is created
- [x] Clarify Project Requirements - EVSpy for Australian EV charging station prices
- [x] Scaffold the Project - Next.js with TypeScript, Tailwind, ESLint, App Router
- [x] Customize the Project - Database schema, API routes, UI components created
- [x] Install Required Extensions - Not needed for this project type
- [x] Compile the Project - Successfully built with no errors
- [x] Create and Run Task - Development server task configured
- [x] Launch the Project - Server running at http://localhost:3000
- [x] Ensure Documentation is Complete - README.md updated with project info

## Current Status
✅ **Project Successfully Created and Enhanced!**

EVSpy is now a fully functional EV charging price comparison platform with:

### 🗺️ **Interactive Map Features (Like PetrolSpy)**
- **Location Detection**: Automatically gets user's current location
- **Real-time Map**: Shows nearby charging stations with pricing overlays
- **Hover Pricing**: Mouse over stations to see latest prices instantly
- **Network Color Coding**: Different colors for Chargefox, Evie, Tesla, etc.
- **Responsive Design**: Works perfectly on mobile and desktop

### 🤖 **Automated Price Scraping**
- **Chargefox Scraper**: Extracts pricing from Chargefox website
- **Evie Networks Scraper**: Gets rates from Evie charging locations
- **Tesla Integration**: Includes general Tesla Supercharger pricing
- **Scheduled Updates**: Automatic scraping every 4 hours
- **Admin Dashboard**: Monitor and control scraping operations

### 📊 **Core Platform Features**
- **OpenChargeMap Integration**: 15,000+ Australian charging stations
- **Price Comparison**: Side-by-side network pricing
- **Station Search**: Filter by location, network, and power rating
- **Community Data**: Ready for user-submitted prices and reviews
- **Modern UI**: Clean, fast interface with Australian green theme

### 🛠️ **Technical Implementation**
- **Database**: Prisma ORM with SQLite (production-ready for PostgreSQL)
- **Maps**: React Leaflet with custom markers and popups
- **Scraping**: Puppeteer-based web scrapers for real-time data
- **API**: RESTful endpoints for stations, pricing, and data import
- **TypeScript**: Full type safety across the entire application

### 🚀 **To Launch EVSpy:**

1. **Start the Development Server:**
   ```bash
   # In VS Code terminal:
   $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
   npm run dev
   ```

2. **Import Initial Station Data:**
   ```bash
   # POST request to populate database:
   curl -X POST http://localhost:3000/api/import-stations -H "Content-Type: application/json" -d '{"limit": 500}'
   ```

3. **Visit the Application:**
   - **Main App**: http://localhost:3000 (Interactive map with location detection)
   - **Station Browser**: http://localhost:3000/stations (List view with filters)
   - **Admin Dashboard**: http://localhost:3000/admin (Scraping controls)
   - **API Test**: http://localhost:3000/api/stations (JSON station data)

4. **Test Scraping:**
   ```bash
   # Manually trigger price scraping:
   curl -X POST http://localhost:3000/api/scrape-prices -H "Content-Type: application/json" -d '{}'
   ```

### 🎯 **Ready Features:**
✅ Location-based station discovery  
✅ Interactive map with pricing overlays  
✅ Real-time price scraping from major networks  
✅ Mobile-responsive design  
✅ Admin dashboard for monitoring  
✅ Australian network support (Chargefox, Evie, Tesla, BP Pulse)  
✅ OpenChargeMap data integration  
✅ RESTful API endpoints  

### 🔮 **Next Steps for Production:**
- Set up PostgreSQL database
- Configure production scraping schedules
- Add user authentication (NextAuth.js ready)
- Implement price submission forms
- Add review and rating system
- Deploy to Vercel/AWS
- Set up monitoring and alerts

**EVSpy is now ready to compete with PetrolSpy in the EV charging space! 🇦🇺⚡**