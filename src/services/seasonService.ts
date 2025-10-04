import { PrismaClient } from '@prisma/client';
import type {
  SeasonResponse,
  PaginationMeta,
  PaginationParams,
} from '../types/api';

const prisma = new PrismaClient();

export interface SeasonQueryParams extends PaginationParams {
  // Seasons are simple - just year filtering
}

export interface SeasonDetailResponse extends SeasonResponse {
  stats?: {
    totalRaces: number;
    drivers: number;
    teams: number;
  };
}

export class SeasonService {
  /**
   * Get all seasons with pagination
   */
  async getAllSeasons(
    params: SeasonQueryParams
  ): Promise<{ seasons: SeasonResponse[]; meta: PaginationMeta }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [seasons, total] = await Promise.all([
      prisma.season.findMany({
        skip,
        take: limit,
        orderBy: { year: 'desc' }, // Most recent first
      }),
      prisma.season.count(),
    ]);

    // Transform to response format
    const seasonResponses: SeasonResponse[] = seasons.map((season) =>
      this.transformSeasonToResponse(season)
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

    return { seasons: seasonResponses, meta };
  }

  /**
   * Get a single season by ID
   */
  async getSeasonById(id: number): Promise<SeasonDetailResponse | null> {
    const season = await prisma.season.findUnique({
      where: { id },
      include: {
        races: {
          include: {
            raceResults: {
              distinct: ['driverId'],
              select: {
                driverId: true,
              },
            },
          },
        },
      },
    });

    if (!season) {
      return null;
    }

    // Calculate statistics
    const totalRaces = season.races.length;

    // Get unique drivers from all races
    const driverIds = new Set<number>();
    season.races.forEach((race) => {
      race.raceResults.forEach((result) => {
        driverIds.add(result.driverId);
      });
    });

    // Get unique teams from all races
    const teams = await prisma.raceResult.findMany({
      where: {
        race: {
          seasonId: season.id,
        },
      },
      distinct: ['teamId'],
      select: {
        teamId: true,
      },
    });

    const response: SeasonDetailResponse = {
      ...this.transformSeasonToResponse(season),
      stats: {
        totalRaces,
        drivers: driverIds.size,
        teams: teams.length,
      },
    };

    return response;
  }

  /**
   * Get season by year
   */
  async getSeasonByYear(year: number): Promise<SeasonDetailResponse | null> {
    const season = await prisma.season.findUnique({
      where: { year },
      include: {
        races: {
          include: {
            raceResults: {
              distinct: ['driverId'],
              select: {
                driverId: true,
              },
            },
          },
        },
      },
    });

    if (!season) {
      return null;
    }

    // Calculate statistics (same as getSeasonById)
    const totalRaces = season.races.length;

    const driverIds = new Set<number>();
    season.races.forEach((race) => {
      race.raceResults.forEach((result) => {
        driverIds.add(result.driverId);
      });
    });

    const teams = await prisma.raceResult.findMany({
      where: {
        race: {
          seasonId: season.id,
        },
      },
      distinct: ['teamId'],
      select: {
        teamId: true,
      },
    });

    const response: SeasonDetailResponse = {
      ...this.transformSeasonToResponse(season),
      stats: {
        totalRaces,
        drivers: driverIds.size,
        teams: teams.length,
      },
    };

    return response;
  }

  /**
   * Transform Prisma season model to API response
   */
  private transformSeasonToResponse(season: any): SeasonResponse {
    return {
      id: season.id,
      year: season.year,
      url: season.url,
    };
  }
}

// Export singleton instance
export const seasonService = new SeasonService();
