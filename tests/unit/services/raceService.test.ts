import { describe, it, expect, vi, beforeEach } from 'vitest';
import { raceService } from '../../../src/services/raceService';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
vi.mock('@prisma/client', () => {
  const mockPrismaClient = {
    race: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    season: {
      findUnique: vi.fn(),
    },
    circuit: {
      findUnique: vi.fn(),
    },
    raceResult: {
      findMany: vi.fn(),
    },
    qualifyingResult: {
      findMany: vi.fn(),
    },
  };
  return {
    PrismaClient: vi.fn(() => mockPrismaClient),
  };
});

describe('RaceService', () => {
  let prisma: any;

  beforeEach(() => {
    prisma = new PrismaClient();
    vi.clearAllMocks();
  });

  describe('getAllRaces', () => {
    it('should return paginated races', async () => {
      const mockRaces = [
        {
          id: 1,
          seasonId: 1,
          circuitId: 1,
          round: 16,
          name: 'Italian Grand Prix',
          date: new Date('2024-09-01'),
          time: new Date('1970-01-01T13:00:00Z'),
          url: 'http://example.com',
          season: { year: 2024 },
          circuit: {
            id: 1,
            circuitRef: 'monza',
            name: 'Monza',
            location: 'Monza',
            country: 'Italy',
            lat: 45.6156,
            lng: 9.28111,
            alt: 162,
            url: 'http://example.com',
          },
        },
      ];

      prisma.race.findMany.mockResolvedValue(mockRaces);
      prisma.race.count.mockResolvedValue(1);

      const result = await raceService.getAllRaces({ page: 1, limit: 20 });

      expect(result.races).toHaveLength(1);
      expect(result.races[0].name).toBe('Italian Grand Prix');
      expect(result.races[0].season).toBe(2024);
    });

    it('should filter by season', async () => {
      const mockSeason = { id: 1, year: 2024 };
      prisma.season.findUnique.mockResolvedValue(mockSeason);
      prisma.race.findMany.mockResolvedValue([]);
      prisma.race.count.mockResolvedValue(0);

      await raceService.getAllRaces({ page: 1, limit: 20, season: 2024 });

      expect(prisma.season.findUnique).toHaveBeenCalledWith({
        where: { year: 2024 },
      });
      expect(prisma.race.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { seasonId: 1 },
        })
      );
    });

    it('should return empty array for non-existent season', async () => {
      prisma.season.findUnique.mockResolvedValue(null);

      const result = await raceService.getAllRaces({
        page: 1,
        limit: 20,
        season: 1900,
      });

      expect(result.races).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('should filter by circuit', async () => {
      const mockCircuit = { id: 1, circuitRef: 'monaco' };
      prisma.circuit.findUnique.mockResolvedValue(mockCircuit);
      prisma.race.findMany.mockResolvedValue([]);
      prisma.race.count.mockResolvedValue(0);

      await raceService.getAllRaces({ page: 1, limit: 20, circuit: 'monaco' });

      expect(prisma.circuit.findUnique).toHaveBeenCalledWith({
        where: { circuitRef: 'monaco' },
      });
      expect(prisma.race.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { circuitId: 1 },
        })
      );
    });

    it('should sort races by date descending', async () => {
      prisma.race.findMany.mockResolvedValue([]);
      prisma.race.count.mockResolvedValue(0);

      await raceService.getAllRaces({ page: 1, limit: 20 });

      expect(prisma.race.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ date: 'desc' }],
        })
      );
    });

    it('should format dates correctly', async () => {
      const mockRace = {
        id: 1,
        seasonId: 1,
        circuitId: 1,
        round: 1,
        name: 'Test GP',
        date: new Date('2024-03-02'),
        time: new Date('1970-01-01T15:00:00Z'),
        url: 'http://example.com',
        season: { year: 2024 },
        circuit: {
          id: 1,
          circuitRef: 'test',
          name: 'Test',
          location: 'Test',
          country: 'Test',
          lat: 0,
          lng: 0,
          alt: 0,
          url: 'http://example.com',
        },
      };

      prisma.race.findMany.mockResolvedValue([mockRace]);
      prisma.race.count.mockResolvedValue(1);

      const result = await raceService.getAllRaces({ page: 1, limit: 20 });

      expect(result.races[0].date).toBe('2024-03-02');
      expect(result.races[0].time).toBe('15:00:00');
    });
  });

  describe('getRaceById', () => {
    it('should return race with stats', async () => {
      const mockRace = {
        id: 1,
        seasonId: 1,
        circuitId: 1,
        round: 1,
        name: 'Test GP',
        date: new Date('2024-03-02'),
        time: new Date('1970-01-01T15:00:00Z'),
        url: 'http://example.com',
        season: { year: 2024 },
        circuit: {
          id: 1,
          circuitRef: 'test',
          name: 'Test',
          location: 'Test',
          country: 'Test',
          lat: 0,
          lng: 0,
          alt: 0,
          url: 'http://example.com',
        },
        raceResults: [
          { position: 1, statusId: 1 },
          { position: 2, statusId: 1 },
          { position: null, statusId: 2 },
        ],
      };

      prisma.race.findUnique.mockResolvedValue(mockRace);

      const result = await raceService.getRaceById(1);

      expect(result).not.toBeNull();
      expect(result?.stats).toEqual({
        totalDrivers: 3,
        finishers: 2,
        dnfs: 1,
      });
    });

    it('should return null for non-existent race', async () => {
      prisma.race.findUnique.mockResolvedValue(null);

      const result = await raceService.getRaceById(999);

      expect(result).toBeNull();
    });
  });

  describe('getRacesBySeason', () => {
    it('should return races ordered by round', async () => {
      const mockSeason = {
        id: 1,
        year: 2024,
        url: 'http://example.com',
        races: [
          {
            id: 1,
            round: 1,
            name: 'Race 1',
            date: new Date('2024-03-02'),
            time: null,
            url: 'http://example.com',
            circuit: {
              id: 1,
              circuitRef: 'test',
              name: 'Test',
              location: 'Test',
              country: 'Test',
              lat: 0,
              lng: 0,
              alt: 0,
              url: 'http://example.com',
            },
          },
          {
            id: 2,
            round: 2,
            name: 'Race 2',
            date: new Date('2024-03-09'),
            time: null,
            url: 'http://example.com',
            circuit: {
              id: 1,
              circuitRef: 'test',
              name: 'Test',
              location: 'Test',
              country: 'Test',
              lat: 0,
              lng: 0,
              alt: 0,
              url: 'http://example.com',
            },
          },
        ],
      };

      prisma.season.findUnique.mockResolvedValue(mockSeason);

      const result = await raceService.getRacesBySeason(2024);

      expect(result).not.toBeNull();
      expect(result?.races).toHaveLength(2);
      expect(result?.races[0].round).toBe(1);
      expect(result?.races[1].round).toBe(2);
      expect(result?.season.year).toBe(2024);
    });

    it('should return null for non-existent season', async () => {
      prisma.season.findUnique.mockResolvedValue(null);

      const result = await raceService.getRacesBySeason(1900);

      expect(result).toBeNull();
    });
  });

  describe('getRaceResults', () => {
    it('should return race results ordered by position', async () => {
      const mockRace = { id: 1 };
      prisma.race.findUnique.mockResolvedValue(mockRace);

      const mockResults = [
        {
          position: 1,
          positionText: '1',
          driver: {
            id: 1,
            driverRef: 'hamilton',
            code: 'HAM',
            forename: 'Lewis',
            surname: 'Hamilton',
          },
          team: { id: 1, teamRef: 'mercedes', name: 'Mercedes' },
          gridPosition: 1,
          laps: 53,
          points: 25,
          time: '1:30:00.000',
          status: { status: 'Finished' },
        },
        {
          position: 2,
          positionText: '2',
          driver: {
            id: 2,
            driverRef: 'verstappen',
            code: 'VER',
            forename: 'Max',
            surname: 'Verstappen',
          },
          team: { id: 2, teamRef: 'red_bull', name: 'Red Bull Racing' },
          gridPosition: 2,
          laps: 53,
          points: 18,
          time: '+2.500',
          status: { status: 'Finished' },
        },
      ];

      prisma.raceResult.findMany.mockResolvedValue(mockResults);

      const result = await raceService.getRaceResults(1);

      expect(result).toHaveLength(2);
      expect(result?.[0].position).toBe(1);
      expect(result?.[0].driver.code).toBe('HAM');
      expect(result?.[1].position).toBe(2);
    });

    it('should return null for non-existent race', async () => {
      prisma.race.findUnique.mockResolvedValue(null);

      const result = await raceService.getRaceResults(999);

      expect(result).toBeNull();
    });

    it('should return empty array for race with no results', async () => {
      const mockRace = { id: 1 };
      prisma.race.findUnique.mockResolvedValue(mockRace);
      prisma.raceResult.findMany.mockResolvedValue([]);

      const result = await raceService.getRaceResults(1);

      expect(result).toEqual([]);
    });
  });

  describe('getQualifyingResults', () => {
    it('should return qualifying results ordered by position', async () => {
      const mockRace = { id: 1 };
      prisma.race.findUnique.mockResolvedValue(mockRace);

      const mockResults = [
        {
          position: 1,
          driver: {
            id: 1,
            driverRef: 'hamilton',
            code: 'HAM',
            forename: 'Lewis',
            surname: 'Hamilton',
          },
          team: { id: 1, teamRef: 'mercedes', name: 'Mercedes' },
          q1Time: '1:20.123',
          q2Time: '1:19.456',
          q3Time: '1:18.789',
        },
      ];

      prisma.qualifyingResult.findMany.mockResolvedValue(mockResults);

      const result = await raceService.getQualifyingResults(1);

      expect(result).toHaveLength(1);
      expect(result?.[0].position).toBe(1);
      expect(result?.[0].q3Time).toBe('1:18.789');
    });

    it('should return null for non-existent race', async () => {
      prisma.race.findUnique.mockResolvedValue(null);

      const result = await raceService.getQualifyingResults(999);

      expect(result).toBeNull();
    });

    it('should return empty array for race with no qualifying', async () => {
      const mockRace = { id: 1 };
      prisma.race.findUnique.mockResolvedValue(mockRace);
      prisma.qualifyingResult.findMany.mockResolvedValue([]);

      const result = await raceService.getQualifyingResults(1);

      expect(result).toEqual([]);
    });

    it('should handle null Q2/Q3 times', async () => {
      const mockRace = { id: 1 };
      prisma.race.findUnique.mockResolvedValue(mockRace);

      const mockResults = [
        {
          position: 20,
          driver: {
            id: 20,
            driverRef: 'driver',
            code: 'DRV',
            forename: 'Test',
            surname: 'Driver',
          },
          team: { id: 1, teamRef: 'team', name: 'Team' },
          q1Time: '1:22.000',
          q2Time: null,
          q3Time: null,
        },
      ];

      prisma.qualifyingResult.findMany.mockResolvedValue(mockResults);

      const result = await raceService.getQualifyingResults(1);

      expect(result?.[0].q2Time).toBeNull();
      expect(result?.[0].q3Time).toBeNull();
    });
  });
});
