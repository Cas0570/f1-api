import { describe, it, expect, vi, beforeEach } from 'vitest';
import { seasonService } from '../../../src/services/seasonService';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
vi.mock('@prisma/client', () => {
  const mockPrismaClient = {
    season: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    raceResult: {
      findMany: vi.fn(),
    },
  };
  return {
    PrismaClient: vi.fn(() => mockPrismaClient),
  };
});

describe('SeasonService', () => {
  let prisma: any;

  beforeEach(() => {
    prisma = new PrismaClient();
    vi.clearAllMocks();
  });

  describe('getAllSeasons', () => {
    it('should return paginated seasons', async () => {
      const mockSeasons = [
        {
          id: 1,
          year: 2024,
          url: 'http://example.com/2024',
        },
        {
          id: 2,
          year: 2023,
          url: 'http://example.com/2023',
        },
      ];

      prisma.season.findMany.mockResolvedValue(mockSeasons);
      prisma.season.count.mockResolvedValue(2);

      const result = await seasonService.getAllSeasons({ page: 1, limit: 20 });

      expect(result.seasons).toHaveLength(2);
      expect(result.seasons[0].year).toBe(2024);
      expect(result.meta).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    });

    it('should sort seasons by year descending (most recent first)', async () => {
      prisma.season.findMany.mockResolvedValue([]);
      prisma.season.count.mockResolvedValue(0);

      await seasonService.getAllSeasons({ page: 1, limit: 20 });

      expect(prisma.season.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { year: 'desc' },
        })
      );
    });

    it('should handle pagination correctly', async () => {
      prisma.season.findMany.mockResolvedValue([]);
      prisma.season.count.mockResolvedValue(75);

      const result = await seasonService.getAllSeasons({ page: 4, limit: 20 });

      expect(prisma.season.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 60,
          take: 20,
        })
      );

      expect(result.meta).toEqual({
        page: 4,
        limit: 20,
        total: 75,
        totalPages: 4,
        hasNext: false,
        hasPrev: true,
      });
    });

    it('should cap limit at 100', async () => {
      prisma.season.findMany.mockResolvedValue([]);
      prisma.season.count.mockResolvedValue(0);

      await seasonService.getAllSeasons({ page: 1, limit: 150 });

      expect(prisma.season.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      );
    });

    it('should enforce minimum page of 1', async () => {
      prisma.season.findMany.mockResolvedValue([]);
      prisma.season.count.mockResolvedValue(0);

      const result = await seasonService.getAllSeasons({ page: 0, limit: 20 });

      expect(result.meta.page).toBe(1);
    });
  });

  describe('getSeasonById', () => {
    it('should return season with stats', async () => {
      const mockSeason = {
        id: 1,
        year: 2024,
        url: 'http://example.com/2024',
        races: [
          {
            raceResults: [{ driverId: 1 }, { driverId: 2 }, { driverId: 3 }],
          },
          {
            raceResults: [{ driverId: 1 }, { driverId: 2 }, { driverId: 4 }],
          },
        ],
      };

      const mockTeams = [{ teamId: 1 }, { teamId: 2 }, { teamId: 3 }];

      prisma.season.findUnique.mockResolvedValue(mockSeason);
      prisma.raceResult.findMany.mockResolvedValue(mockTeams);

      const result = await seasonService.getSeasonById(1);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
      expect(result?.stats).toEqual({
        totalRaces: 2,
        drivers: 4, // Unique drivers: 1, 2, 3, 4
        teams: 3,
      });
    });

    it('should return null for non-existent season', async () => {
      prisma.season.findUnique.mockResolvedValue(null);

      const result = await seasonService.getSeasonById(999);

      expect(result).toBeNull();
    });

    it('should handle season with no races', async () => {
      const mockSeason = {
        id: 1,
        year: 2025,
        url: 'http://example.com/2025',
        races: [],
      };

      prisma.season.findUnique.mockResolvedValue(mockSeason);
      prisma.raceResult.findMany.mockResolvedValue([]);

      const result = await seasonService.getSeasonById(1);

      expect(result?.stats).toEqual({
        totalRaces: 0,
        drivers: 0,
        teams: 0,
      });
    });

    it('should count unique drivers across all races', async () => {
      const mockSeason = {
        id: 1,
        year: 2024,
        url: 'http://example.com/2024',
        races: [
          {
            raceResults: [
              { driverId: 1 },
              { driverId: 1 }, // Same driver twice (shouldn't double count)
              { driverId: 2 },
            ],
          },
          {
            raceResults: [
              { driverId: 1 }, // Same driver in different race
              { driverId: 3 },
            ],
          },
        ],
      };

      prisma.season.findUnique.mockResolvedValue(mockSeason);
      prisma.raceResult.findMany.mockResolvedValue([{ teamId: 1 }]);

      const result = await seasonService.getSeasonById(1);

      expect(result?.stats?.drivers).toBe(3); // Only 3 unique drivers: 1, 2, 3
    });
  });

  describe('getSeasonByYear', () => {
    it('should return season by year', async () => {
      const mockSeason = {
        id: 1,
        year: 2024,
        url: 'http://example.com/2024',
        races: [
          {
            raceResults: [{ driverId: 1 }],
          },
        ],
      };

      prisma.season.findUnique.mockResolvedValue(mockSeason);
      prisma.raceResult.findMany.mockResolvedValue([{ teamId: 1 }]);

      const result = await seasonService.getSeasonByYear(2024);

      expect(result).not.toBeNull();
      expect(result?.year).toBe(2024);
      expect(prisma.season.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { year: 2024 },
        })
      );
    });

    it('should return null for non-existent year', async () => {
      prisma.season.findUnique.mockResolvedValue(null);

      const result = await seasonService.getSeasonByYear(1900);

      expect(result).toBeNull();
    });

    it('should include stats for season by year', async () => {
      const mockSeason = {
        id: 1,
        year: 2023,
        url: 'http://example.com/2023',
        races: [
          {
            raceResults: [{ driverId: 1 }, { driverId: 2 }],
          },
        ],
      };

      prisma.season.findUnique.mockResolvedValue(mockSeason);
      prisma.raceResult.findMany.mockResolvedValue([
        { teamId: 1 },
        { teamId: 2 },
      ]);

      const result = await seasonService.getSeasonByYear(2023);

      expect(result?.stats).toBeDefined();
      expect(result?.stats?.totalRaces).toBe(1);
      expect(result?.stats?.drivers).toBe(2);
      expect(result?.stats?.teams).toBe(2);
    });

    it('should handle years from the early F1 era', async () => {
      const mockSeason = {
        id: 1,
        year: 1950,
        url: 'http://example.com/1950',
        races: [
          {
            raceResults: [{ driverId: 1 }],
          },
        ],
      };

      prisma.season.findUnique.mockResolvedValue(mockSeason);
      prisma.raceResult.findMany.mockResolvedValue([{ teamId: 1 }]);

      const result = await seasonService.getSeasonByYear(1950);

      expect(result?.year).toBe(1950);
    });
  });
});
