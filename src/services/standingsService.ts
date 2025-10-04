import { PrismaClient } from '@prisma/client';
import type {
  DriverStandingResponse,
  ConstructorStandingResponse,
  StandingsQueryParams,
} from '../types/api';

const prisma = new PrismaClient();

export class StandingsService {
  /**
   * Get driver standings
   * If season and round provided: standings after that specific race
   * If only season provided: final standings for that season
   * If neither: latest standings across all data
   */
  async getDriverStandings(params: StandingsQueryParams): Promise<{
    standings: DriverStandingResponse[];
    season?: number;
    round?: number;
    raceName?: string;
  } | null> {
    let race;

    if (params.season && params.round) {
      // Get standings after specific race
      const season = await prisma.season.findUnique({
        where: { year: params.season },
      });

      if (!season) return null;

      race = await prisma.race.findFirst({
        where: {
          seasonId: season.id,
          round: params.round,
        },
      });

      if (!race) return null;
    } else if (params.season) {
      // Get final standings for season (last race)
      const season = await prisma.season.findUnique({
        where: { year: params.season },
        include: {
          races: {
            orderBy: { round: 'desc' },
            take: 1,
          },
        },
      });

      if (!season || season.races.length === 0) return null;
      race = season.races[0];
    } else {
      // Get latest standings (most recent race)
      race = await prisma.race.findFirst({
        orderBy: { date: 'desc' },
      });

      if (!race) return null;
    }

    const standings = await prisma.driverStanding.findMany({
      where: { raceId: race.id },
      include: {
        driver: true,
        race: {
          include: {
            season: true,
          },
        },
      },
      orderBy: { position: 'asc' },
    });

    return {
      standings: standings.map((standing) => ({
        position: standing.position,
        points: standing.points,
        wins: standing.wins,
        driver: {
          id: standing.driver.id,
          driverRef: standing.driver.driverRef,
          code: standing.driver.code,
          forename: standing.driver.forename,
          surname: standing.driver.surname,
        },
      })),
      season: standings[0].race.season.year,
      round: standings[0].race.round,
      raceName: standings[0].race.name,
    };
  }

  /**
   * Get constructor standings
   * Same logic as driver standings
   */
  async getConstructorStandings(params: StandingsQueryParams): Promise<{
    standings: ConstructorStandingResponse[];
    season?: number;
    round?: number;
    raceName?: string;
  } | null> {
    let race;

    if (params.season && params.round) {
      // Get standings after specific race
      const season = await prisma.season.findUnique({
        where: { year: params.season },
      });

      if (!season) return null;

      race = await prisma.race.findFirst({
        where: {
          seasonId: season.id,
          round: params.round,
        },
      });

      if (!race) return null;
    } else if (params.season) {
      // Get final standings for season (last race)
      const season = await prisma.season.findUnique({
        where: { year: params.season },
        include: {
          races: {
            orderBy: { round: 'desc' },
            take: 1,
          },
        },
      });

      if (!season || season.races.length === 0) return null;
      race = season.races[0];
    } else {
      // Get latest standings (most recent race)
      race = await prisma.race.findFirst({
        orderBy: { date: 'desc' },
      });

      if (!race) return null;
    }

    const standings = await prisma.constructorStanding.findMany({
      where: { raceId: race.id },
      include: {
        team: true,
        race: {
          include: {
            season: true,
          },
        },
      },
      orderBy: { position: 'asc' },
    });

    return {
      standings: standings.map((standing) => ({
        position: standing.position,
        points: standing.points,
        wins: standing.wins,
        team: {
          id: standing.team.id,
          teamRef: standing.team.teamRef,
          name: standing.team.name,
        },
      })),
      season: standings[0].race.season.year,
      round: standings[0].race.round,
      raceName: standings[0].race.name,
    };
  }
}

// Export singleton instance
export const standingsService = new StandingsService();
