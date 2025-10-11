import { PrismaClient } from '@prisma/client';
import type {
  DriverResponse,
  DriverDetailResponse,
  DriverQueryParams,
  PaginationMeta,
} from '../types/api';
import { cacheService, CacheKeys } from './cacheService';

const prisma = new PrismaClient();

// Cache TTLs (in seconds)
const CACHE_TTL = {
  DRIVER_DETAIL: 3600, // 1 hour (driver data rarely changes)
  DRIVER_LIST: 600, // 10 minutes
  NATIONALITIES: 86400, // 24 hours (very stable)
};

export class DriverService {
  /**
   * Get all drivers with pagination and optional filtering
   */
  async getAllDrivers(
    params: DriverQueryParams
  ): Promise<{ drivers: DriverResponse[]; meta: PaginationMeta }> {
    // Don't cache paginated lists (too many variations)
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (params.nationality) {
      where.nationality = {
        equals: params.nationality,
        mode: 'insensitive',
      };
    }

    if (params.search) {
      where.OR = [
        {
          forename: {
            contains: params.search,
            mode: 'insensitive',
          },
        },
        {
          surname: {
            contains: params.search,
            mode: 'insensitive',
          },
        },
        {
          driverRef: {
            contains: params.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Execute query with pagination
    const [drivers, total] = await Promise.all([
      prisma.driver.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ surname: 'asc' }, { forename: 'asc' }],
      }),
      prisma.driver.count({ where }),
    ]);

    // Transform to response format
    const driverResponses: DriverResponse[] = drivers.map((driver) =>
      this.transformDriverToResponse(driver)
    );

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const meta: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return { drivers: driverResponses, meta };
  }

  /**
   * Get a single driver by ID (WITH CACHING)
   */
  async getDriverById(id: number): Promise<DriverDetailResponse | null> {
    // Check cache first
    const cacheKey = CacheKeys.driver(id);
    const cached = cacheService.get<DriverDetailResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    // Query database
    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        raceResults: {
          select: {
            position: true,
            points: true,
          },
        },
        qualifyingResults: {
          select: {
            position: true,
          },
        },
      },
    });

    if (!driver) {
      return null;
    }

    // Calculate statistics
    const races = driver.raceResults.length;
    const wins = driver.raceResults.filter((r) => r.position === 1).length;
    const podiums = driver.raceResults.filter(
      (r) => r.position && r.position <= 3
    ).length;
    const poles = driver.qualifyingResults.filter(
      (q) => q.position === 1
    ).length;
    const championships = 0;

    const response: DriverDetailResponse = {
      ...this.transformDriverToResponse(driver),
      stats: {
        races,
        wins,
        podiums,
        poles,
        championships,
      },
    };

    // Store in cache
    cacheService.set(cacheKey, response, CACHE_TTL.DRIVER_DETAIL);

    return response;
  }

  /**
   * Get driver by reference (WITH CACHING)
   */
  async getDriverByRef(
    driverRef: string
  ): Promise<DriverDetailResponse | null> {
    // Check cache first
    const cacheKey = CacheKeys.driverByRef(driverRef);
    const cached = cacheService.get<DriverDetailResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    // Query database
    const driver = await prisma.driver.findUnique({
      where: { driverRef },
      include: {
        raceResults: {
          select: {
            position: true,
            points: true,
          },
        },
        qualifyingResults: {
          select: {
            position: true,
          },
        },
      },
    });

    if (!driver) {
      return null;
    }

    // Calculate statistics (same as getDriverById)
    const races = driver.raceResults.length;
    const wins = driver.raceResults.filter((r) => r.position === 1).length;
    const podiums = driver.raceResults.filter(
      (r) => r.position && r.position <= 3
    ).length;
    const poles = driver.qualifyingResults.filter(
      (q) => q.position === 1
    ).length;
    const championships = 0;

    const response: DriverDetailResponse = {
      ...this.transformDriverToResponse(driver),
      stats: {
        races,
        wins,
        podiums,
        poles,
        championships,
      },
    };

    // Store in cache
    cacheService.set(cacheKey, response, CACHE_TTL.DRIVER_DETAIL);

    return response;
  }

  /**
   * Transform Prisma driver model to API response
   */
  private transformDriverToResponse(driver: any): DriverResponse {
    return {
      id: driver.id,
      driverRef: driver.driverRef,
      number: driver.number,
      code: driver.code,
      forename: driver.forename,
      surname: driver.surname,
      fullName: `${driver.forename} ${driver.surname}`,
      dob: driver.dob.toISOString().split('T')[0],
      nationality: driver.nationality,
      url: driver.url,
    };
  }

  /**
   * Get list of all nationalities (WITH CACHING)
   */
  async getNationalities(): Promise<string[]> {
    // Check cache first
    const cacheKey = CacheKeys.driverNationalities();
    const cached = cacheService.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Query database
    const drivers = await prisma.driver.findMany({
      select: { nationality: true },
      distinct: ['nationality'],
      orderBy: { nationality: 'asc' },
    });

    const nationalities = drivers.map((d) => d.nationality);

    // Store in cache (24 hours - this data is very stable)
    cacheService.set(cacheKey, nationalities, CACHE_TTL.NATIONALITIES);

    return nationalities;
  }
}

// Export singleton instance
export const driverService = new DriverService();
