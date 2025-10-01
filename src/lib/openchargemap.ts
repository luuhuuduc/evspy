// OpenChargeMap API integration for fetching charging station data
import axios from 'axios'
import { prisma } from './prisma'

// OpenChargeMap API types
interface OCMLocation {
  ID: number
  Title: string
  AddressInfo: {
    AddressLine1?: string
    Town?: string
    StateOrProvince?: string
    Postcode?: string
    Country: {
      Title: string
    }
    Latitude: number
    Longitude: number
  }
  OperatorInfo?: {
    Title: string
    WebsiteURL?: string
  }
  StatusType?: {
    IsOperational: boolean
  }
  Connections?: Array<{
    ConnectionType: {
      Title: string
    }
    PowerKW?: number
    Quantity?: number
  }>
  NumberOfPoints?: number
}



export class OpenChargeMapService {
  private apiKey: string
  private baseUrl = 'https://api.openchargemap.io/v3/poi'

  constructor() {
    this.apiKey = process.env.OPENCHARGEMAP_API_KEY || ''
  }

  /**
   * Fetch charging stations from OpenChargeMap for Australia
   */
  async fetchAustralianStations(options: {
    latitude?: number
    longitude?: number
    distance?: number // in km
    maxResults?: number
  } = {}): Promise<OCMLocation[]> {
    try {
      const params = new URLSearchParams({
        countrycode: 'AU', // Australia
        output: 'json',
        includecomments: 'false',
        maxresults: (options.maxResults || 100).toString(),
        compact: 'true',
        verbose: 'false',
      })

      if (this.apiKey) {
        params.append('key', this.apiKey)
      }

      if (options.latitude && options.longitude) {
        params.append('latitude', options.latitude.toString())
        params.append('longitude', options.longitude.toString())
        if (options.distance) {
          params.append('distance', options.distance.toString())
        }
      }

      const response = await axios.get(`${this.baseUrl}/?${params.toString()}`)
      return response.data as OCMLocation[]
    } catch (error) {
      console.error('Error fetching from OpenChargeMap:', error)
      throw new Error('Failed to fetch charging stations')
    }
  }

  /**
   * Import stations from OpenChargeMap into our database
   */
  async importStations(limit = 500): Promise<number> {
    try {
      const ocmStations = await this.fetchAustralianStations({ maxResults: limit })
      let importedCount = 0

      for (const ocmStation of ocmStations) {
        try {
          // Check if station already exists
          const existing = await prisma.chargingStation.findUnique({
            where: { ocmId: ocmStation.ID }
          })

          if (existing) {
            continue // Skip if already exists
          }

          // Extract connector types
          const connectorTypes = ocmStation.Connections?.map(
            conn => conn.ConnectionType.Title
          ).join(', ') || ''

          // Calculate maximum power
          const maxPower = ocmStation.Connections?.reduce(
            (max, conn) => Math.max(max, conn.PowerKW || 0), 0
          ) || null

          // Import the station
          await prisma.chargingStation.create({
            data: {
              ocmId: ocmStation.ID,
              name: ocmStation.Title,
              latitude: ocmStation.AddressInfo.Latitude,
              longitude: ocmStation.AddressInfo.Longitude,
              address: ocmStation.AddressInfo.AddressLine1 || '',
              suburb: ocmStation.AddressInfo.Town || '',
              state: ocmStation.AddressInfo.StateOrProvince || '',
              postcode: ocmStation.AddressInfo.Postcode || '',
              country: ocmStation.AddressInfo.Country.Title,
              network: ocmStation.OperatorInfo?.Title || '',
              website: ocmStation.OperatorInfo?.WebsiteURL || '',
              connectorTypes,
              powerKw: maxPower,
              numConnectors: ocmStation.NumberOfPoints || 1,
              isActive: ocmStation.StatusType?.IsOperational ?? true,
              isVerified: true, // OCM data is considered verified
              lastVerified: new Date(),
            }
          })

          importedCount++
        } catch (error) {
          console.error(`Error importing station ${ocmStation.ID}:`, error)
          // Continue with next station
        }
      }

      return importedCount
    } catch (error) {
      console.error('Error importing stations:', error)
      throw error
    }
  }

  /**
   * Search for nearby charging stations
   */
  async searchNearbyStations(
    latitude: number,
    longitude: number,
    radiusKm: number = 50
  ) {
    return await prisma.chargingStation.findMany({
      where: {
        isActive: true,
        // Use approximate distance calculation for SQLite
        // In production, you might want to use PostGIS or similar
        latitude: {
          gte: latitude - (radiusKm / 111), // Rough lat degree conversion
          lte: latitude + (radiusKm / 111),
        },
        longitude: {
          gte: longitude - (radiusKm / (111 * Math.cos(latitude * Math.PI / 180))),
          lte: longitude + (radiusKm / (111 * Math.cos(latitude * Math.PI / 180))),
        },
      },
      include: {
        priceReports: {
          orderBy: { reportedAt: 'desc' },
          take: 1,
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            reviews: true,
            priceReports: true,
          },
        },
      },
      orderBy: [
        { isVerified: 'desc' },
        { updatedAt: 'desc' },
      ],
    })
  }

  /**
   * Get stations by network (Chargefox, Evie, etc.)
   */
  async getStationsByNetwork(networkName: string) {
    return await prisma.chargingStation.findMany({
      where: {
        network: {
          contains: networkName,
        },
        isActive: true,
      },
      include: {
        priceReports: {
          orderBy: { reportedAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            reviews: true,
            priceReports: true,
          },
        },
      },
    })
  }
}