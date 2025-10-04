import { PrismaClient } from '@prisma/client';
import type {
  RaceResponse,
  RaceDetailResponse,
  RaceQueryParams,
  PaginationMeta,
  CircuitResponse,
} from '../types/api';

const prisma = new PrismaClient();

export class RaceService {
  /**
   * Get all races with pagination and optional filtering
   */
  async getAllRaces(
    params: RaceQueryParams
  ): Promise<{ races: RaceResponse[]; meta: PaginationMeta }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (params.season) {
      // Find season by year
      const season = await prisma.season.findUnique({
        where: { year: params.season },
      });
      if (season) {
        where.seasonId = season.id;
      } else {
        // Return empty result if season doesn't exist
        return {
          races: [],
          meta: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        };
      }
    }

    if (params.circuit) {
      // Find circuit by ref
      const circuit = await prisma.circuit.findUnique({
        where: { circuitRef: params.circuit },
      });
      if (circuit) {
        where.circuitId = circuit.id;
      } else {
        // Return empty result if circuit doesn't exist
        return {
          races: [],
          meta: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        };
      }
    }

    // Execute query with pagination
    const [races, total] = await Promise.all([
      prisma.race.findMany({
        where,
        skip,
        take: limit,
        include: {
          season: true,
          circuit: true,
        },
        orderBy: [{ date: 'desc' }], // Most recent first
      }),
      prisma.race.count({ where }),
    ]);

    // Transform to response format
    const raceResponses: RaceResponse[] = races.map((race) =>
      this.transformRaceToResponse(race)
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

    return { races: raceResponses, meta };
  }

  /**
   * Get a single race by ID
   */
  async getRaceById(id: number): Promise<RaceDetailResponse | null> {
    const race = await prisma.race.findUnique({
      where: { id },
      include: {
        season: true,
        circuit: true,
        raceResults: {
          select: {
            position: true,
            statusId: true,
          },
        },
      },
    });

    if (!race) {
      return null;
    }

    // Calculate statistics
    const totalDrivers = race.raceResults.length;
    const finishers = race.raceResults.filter(
      (r) => r.position !== null
    ).length;
    const dnfs = totalDrivers - finishers;

    const response: RaceDetailResponse = {
      ...this.transformRaceToResponse(race),
      stats: {
        totalDrivers,
        finishers,
        dnfs,
      },
    };

    return response;
  }

  /**
   * Get races by season year
   */
  async getRacesBySeason(year: number): Promise<{
    races: RaceResponse[];
    season: { id: number; year: number };
  } | null> {
    const season = await prisma.season.findUnique({
      where: { year },
      include: {
        races: {
          include: {
            circuit: true,
          },
          orderBy: { round: 'asc' }, // By race order in season
        },
      },
    });

    if (!season) {
      return null;
    }

    const races: RaceResponse[] = season.races.map((race) => ({
      id: race.id,
      season: year,
      round: race.round,
      name: race.name,
      date: race.date.toISOString().split('T')[0],
      time: race.time
        ? race.time.toISOString().split('T')[1].slice(0, 8)
        : null,
      circuit: this.transformCircuitToResponse(race.circuit),
      url: race.url,
    }));

    return {
      races,
      season: {
        id: season.id,
        year: season.year,
      },
    };
  }

  /**
   * Transform Prisma race model to API response
   */
  private transformRaceToResponse(race: any): RaceResponse {
    return {
      id: race.id,
      season: race.season.year,
      round: race.round,
      name: race.name,
      date: race.date.toISOString().split('T')[0], // YYYY-MM-DD
      time: race.time
        ? race.time.toISOString().split('T')[1].slice(0, 8)
        : null, // HH:MM:SS
      circuit: this.transformCircuitToResponse(race.circuit),
      url: race.url,
    };
  }

  /**
   * Transform circuit for nested response
   */
  private transformCircuitToResponse(circuit: any): CircuitResponse {
    return {
      id: circuit.id,
      circuitRef: circuit.circuitRef,
      name: circuit.name,
      location: circuit.location,
      country: circuit.country,
      lat: circuit.lat,
      lng: circuit.lng,
      alt: circuit.alt,
      url: circuit.url,
    };
  }
}

// Export singleton instance
export const raceService = new RaceService();
