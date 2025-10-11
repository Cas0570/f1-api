import { PrismaClient } from '@prisma/client';
import type {
  TeamResponse,
  PaginationMeta,
  PaginationParams,
} from '../types/api';
import { cacheService, CacheKeys } from './cacheService';

const prisma = new PrismaClient();

export interface TeamQueryParams extends PaginationParams {
  nationality?: string;
  search?: string;
}

export interface TeamDetailResponse extends TeamResponse {
  stats?: {
    races: number;
    wins: number;
    podiums: number;
    poles: number;
    championships: number;
  };
}

// Cache TTLs (in seconds)
const CACHE_TTL = {
  TEAM_DETAIL: 3600, // 1 hour
  NATIONALITIES: 86400, // 24 hours
};

export class TeamService {
  /**
   * Get all teams with pagination and optional filtering
   */
  async getAllTeams(
    params: TeamQueryParams
  ): Promise<{ teams: TeamResponse[]; meta: PaginationMeta }> {
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
          name: {
            contains: params.search,
            mode: 'insensitive',
          },
        },
        {
          teamRef: {
            contains: params.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Execute query with pagination
    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.team.count({ where }),
    ]);

    // Transform to response format
    const teamResponses: TeamResponse[] = teams.map((team) =>
      this.transformTeamToResponse(team)
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

    return { teams: teamResponses, meta };
  }

  /**
   * Get a single team by ID
   */
  async getTeamById(id: number): Promise<TeamDetailResponse | null> {
    // Check cache
    const cacheKey = CacheKeys.team(id);
    const cached = cacheService.get<TeamDetailResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    const team = await prisma.team.findUnique({
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

    if (!team) {
      return null;
    }

    // Calculate statistics
    const races = team.raceResults.length;
    const wins = team.raceResults.filter((r) => r.position === 1).length;
    const podiums = team.raceResults.filter(
      (r) => r.position && r.position <= 3
    ).length;
    const poles = team.qualifyingResults.filter((q) => q.position === 1).length;
    const championships = 0;

    const response: TeamDetailResponse = {
      ...this.transformTeamToResponse(team),
      stats: {
        races,
        wins,
        podiums,
        poles,
        championships,
      },
    };

    // Cache it
    cacheService.set(cacheKey, response, CACHE_TTL.TEAM_DETAIL);

    return response;
  }

  /**
   * Get team by reference (e.g., "mercedes")
   */
  async getTeamByRef(teamRef: string): Promise<TeamDetailResponse | null> {
    // Check cache
    const cacheKey = CacheKeys.teamByRef(teamRef);
    const cached = cacheService.get<TeamDetailResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    const team = await prisma.team.findUnique({
      where: { teamRef },
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

    if (!team) {
      return null;
    }

    // Calculate statistics (same as getTeamById)
    const races = team.raceResults.length;
    const wins = team.raceResults.filter((r) => r.position === 1).length;
    const podiums = team.raceResults.filter(
      (r) => r.position && r.position <= 3
    ).length;
    const poles = team.qualifyingResults.filter((q) => q.position === 1).length;
    const championships = 0;

    const response: TeamDetailResponse = {
      ...this.transformTeamToResponse(team),
      stats: {
        races,
        wins,
        podiums,
        poles,
        championships,
      },
    };

    // Cache it
    cacheService.set(cacheKey, response, CACHE_TTL.TEAM_DETAIL);

    return response;
  }

  /**
   * Transform Prisma team model to API response
   */
  private transformTeamToResponse(team: any): TeamResponse {
    return {
      id: team.id,
      teamRef: team.teamRef,
      name: team.name,
      nationality: team.nationality,
      url: team.url,
    };
  }

  /**
   * Get list of all nationalities (for filtering)
   */
  async getNationalities(): Promise<string[]> {
    // Check cache
    const cacheKey = CacheKeys.teamNationalities();
    const cached = cacheService.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const teams = await prisma.team.findMany({
      select: { nationality: true },
      distinct: ['nationality'],
      orderBy: { nationality: 'asc' },
    });

    const nationalities = teams.map((t) => t.nationality);

    // Cache it
    cacheService.set(cacheKey, nationalities, CACHE_TTL.NATIONALITIES);

    return nationalities;
  }
}

// Export singleton instance
export const teamService = new TeamService();
