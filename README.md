# EVSpy - Australian EV Charging Price Comparison

EVSpy is a comprehensive web platform for comparing electric vehicle charging station prices across Australia, similar to PetrolSpy but specifically designed for EV charging infrastructure.

## 🚗⚡ Features

- **Station Discovery**: Find EV charging stations across Australia with real-time data
- **Price Comparison**: Compare charging rates across different networks (Chargefox, Evie, Tesla, BP Pulse)
- **Crowdsourced Pricing**: Community-driven price submissions and updates
- **User Reviews**: Read and submit reviews for charging stations
- **OpenChargeMap Integration**: Leverages the global open database of charging stations
- **Network Coverage**: Supports major Australian charging networks
- **Mobile-Friendly**: Responsive design optimized for mobile use

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (development), PostgreSQL (production)
- **Authentication**: NextAuth.js
- **Maps**: React Leaflet (planned)
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/evspy.git
   cd evspy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Database
   DATABASE_URL="file:./dev.db"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   
   # OpenChargeMap API (optional - get from https://openchargemap.org)
   OPENCHARGEMAP_API_KEY="your-api-key"
   
   # Application
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Import charging station data** (optional)
   Visit `http://localhost:3000/api/import-stations` or run:
   ```bash
   curl -X POST http://localhost:3000/api/import-stations -H "Content-Type: application/json" -d '{"limit": 100}'
   ```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── import-stations/
│   │   └── stations/
│   ├── stations/         # Station listing page
│   └── page.tsx          # Home page
├── lib/
│   ├── prisma.ts         # Database connection
│   └── openchargemap.ts  # OpenChargeMap integration
└── prisma/
    └── schema.prisma     # Database schema
```

## 🗄 Database Schema

The application uses a relational database with the following main entities:

- **Users**: Authentication and user profiles
- **ChargingStations**: Station locations and details
- **PriceReports**: User-submitted pricing data
- **Reviews**: Station reviews and ratings
- **UserFavorites**: Bookmarked stations

## 🔌 API Endpoints

### Stations
- `GET /api/stations` - Search charging stations
- `GET /api/stations?lat=-33.8688&lng=151.2093&radius=50` - Find nearby stations
- `GET /api/stations?network=Chargefox` - Filter by network

### Data Import
- `GET /api/import-stations` - Test OpenChargeMap connection
- `POST /api/import-stations` - Import stations from OpenChargeMap

## 🌏 Data Sources

### Primary Sources
- **OpenChargeMap**: Global open database for station locations and basic info
- **Crowdsourced**: User-submitted pricing and reviews

### Australian Networks Supported
- Chargefox
- Evie Networks
- Tesla Supercharger
- BP Pulse
- And more...

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenChargeMap](https://openchargemap.org) for providing open charging station data
- The Australian EV community for inspiration
- PetrolSpy for the model of crowdsourced fuel price comparison

## 🔮 Roadmap

- [ ] Interactive map interface
- [ ] User authentication and profiles  
- [ ] Price submission forms
- [ ] Review system
- [ ] Mobile app
- [ ] Data scraping for major networks
- [ ] Real-time availability data
- [ ] Push notifications for price alerts
- [ ] API for third-party integrations

---

**EVSpy** - Helping Australia transition to electric vehicles, one charging session at a time! 🇦🇺⚡
