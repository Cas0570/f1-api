import { describe, it, expect, vi, beforeEach } from 'vitest';
import { driverService } from '../../../src/services/driverService';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
vi.mock('@prisma/client', () => {
  const mockPrismaClient = {
    driver: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
  };
  return {
    PrismaClient: vi.fn(() => mockPrismaClient),
  };
});

describe('DriverService', () => {
  let prisma: any;

  beforeEach(() => {
    prisma = new PrismaClient();
    vi.clearAllMocks();
  });

  describe('getAllDrivers', () => {
    it('should return paginated drivers', async () => {
      const mockDrivers = [
        {
          id: 1,
          driverRef: 'hamilton',
          number: 44,
          code: 'HAM',
          forename: 'Lewis',
          surname: 'Hamilton',
          dob: new Date('1985-01-07'),
          nationality: 'British',
          url: 'http://example.com',
        },
      ];

      prisma.driver.findMany.mockResolvedValue(mockDrivers);
      prisma.driver.count.mockResolvedValue(1);

      const result = await driverService.getAllDrivers({ page: 1, limit: 20 });

      expect(result.drivers).toHaveLength(1);
      expect(result.drivers[0].fullName).toBe('Lewis Hamilton');
      expect(result.meta).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    });

    it('should filter by nationality', async () => {
      prisma.driver.findMany.mockResolvedValue([]);
      prisma.driver.count.mockResolvedValue(0);

      await driverService.getAllDrivers({
        page: 1,
        limit: 20,
        nationality: 'British',
      });

      expect(prisma.driver.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            nationality: { equals: 'British', mode: 'insensitive' },
          }),
        })
      );
    });

    it('should search by name', async () => {
      prisma.driver.findMany.mockResolvedValue([]);
      prisma.driver.count.mockResolvedValue(0);

      await driverService.getAllDrivers({
        page: 1,
        limit: 20,
        search: 'hamilton',
      });

      expect(prisma.driver.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                forename: { contains: 'hamilton', mode: 'insensitive' },
              }),
            ]),
          }),
        })
      );
    });

    it('should handle pagination correctly', async () => {
      prisma.driver.findMany.mockResolvedValue([]);
      prisma.driver.count.mockResolvedValue(100);

      const result = await driverService.getAllDrivers({ page: 2, limit: 10 });

      expect(prisma.driver.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );

      expect(result.meta).toEqual({
        page: 2,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: true,
      });
    });

    it('should enforce maximum limit', async () => {
      prisma.driver.findMany.mockResolvedValue([]);
      prisma.driver.count.mockResolvedValue(0);

      await driverService.getAllDrivers({ page: 1, limit: 200 });

      expect(prisma.driver.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100, // Should be capped at 100
        })
      );
    });

    it('should enforce minimum page number', async () => {
      prisma.driver.findMany.mockResolvedValue([]);
      prisma.driver.count.mockResolvedValue(0);

      const result = await driverService.getAllDrivers({ page: -1, limit: 20 });

      expect(result.meta.page).toBe(1);
    });

    it('should format dates correctly', async () => {
      const mockDriver = {
        id: 1,
        driverRef: 'hamilton',
        number: 44,
        code: 'HAM',
        forename: 'Lewis',
        surname: 'Hamilton',
        dob: new Date('1985-01-07'),
        nationality: 'British',
        url: 'http://example.com',
      };

      prisma.driver.findMany.mockResolvedValue([mockDriver]);
      prisma.driver.count.mockResolvedValue(1);

      const result = await driverService.getAllDrivers({ page: 1, limit: 20 });

      expect(result.drivers[0].dob).toBe('1985-01-07');
    });
  });

  describe('getDriverById', () => {
    it('should return driver with stats', async () => {
      const mockDriver = {
        id: 1,
        driverRef: 'hamilton',
        number: 44,
        code: 'HAM',
        forename: 'Lewis',
        surname: 'Hamilton',
        dob: new Date('1985-01-07'),
        nationality: 'British',
        url: 'http://example.com',
        raceResults: [
          { position: 1, points: 25 },
          { position: 2, points: 18 },
          { position: 1, points: 25 },
        ],
        qualifyingResults: [{ position: 1 }, { position: 2 }, { position: 1 }],
      };

      prisma.driver.findUnique.mockResolvedValue(mockDriver);

      const result = await driverService.getDriverById(1);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
      expect(result?.stats).toEqual({
        races: 3,
        wins: 2,
        podiums: 3,
        poles: 2,
        championships: 0,
      });
    });

    it('should return null for non-existent driver', async () => {
      prisma.driver.findUnique.mockResolvedValue(null);

      const result = await driverService.getDriverById(999);

      expect(result).toBeNull();
    });

    it('should calculate podiums correctly', async () => {
      const mockDriver = {
        id: 1,
        driverRef: 'hamilton',
        number: 44,
        code: 'HAM',
        forename: 'Lewis',
        surname: 'Hamilton',
        dob: new Date('1985-01-07'),
        nationality: 'British',
        url: 'http://example.com',
        raceResults: [
          { position: 1, points: 25 },
          { position: 2, points: 18 },
          { position: 3, points: 15 },
          { position: 4, points: 12 },
        ],
        qualifyingResults: [],
      };

      prisma.driver.findUnique.mockResolvedValue(mockDriver);

      const result = await driverService.getDriverById(1);

      expect(result?.stats?.podiums).toBe(3);
    });

    it('should not count null positions as podiums', async () => {
      const mockDriver = {
        id: 1,
        driverRef: 'hamilton',
        number: 44,
        code: 'HAM',
        forename: 'Lewis',
        surname: 'Hamilton',
        dob: new Date('1985-01-07'),
        nationality: 'British',
        url: 'http://example.com',
        raceResults: [
          { position: 1, points: 25 },
          { position: null, points: 0 },
        ],
        qualifyingResults: [],
      };

      prisma.driver.findUnique.mockResolvedValue(mockDriver);

      const result = await driverService.getDriverById(1);

      expect(result?.stats?.podiums).toBe(1);
    });
  });

  describe('getDriverByRef', () => {
    it('should return driver by reference', async () => {
      const mockDriver = {
        id: 1,
        driverRef: 'hamilton',
        number: 44,
        code: 'HAM',
        forename: 'Lewis',
        surname: 'Hamilton',
        dob: new Date('1985-01-07'),
        nationality: 'British',
        url: 'http://example.com',
        raceResults: [],
        qualifyingResults: [],
      };

      prisma.driver.findUnique.mockResolvedValue(mockDriver);

      const result = await driverService.getDriverByRef('hamilton');

      expect(result).not.toBeNull();
      expect(result?.driverRef).toBe('hamilton');
      expect(prisma.driver.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { driverRef: 'hamilton' },
        })
      );
    });

    it('should return null for non-existent reference', async () => {
      prisma.driver.findUnique.mockResolvedValue(null);

      const result = await driverService.getDriverByRef('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getNationalities', () => {
    it('should return sorted unique nationalities', async () => {
      const mockNationalities = [
        { nationality: 'British' },
        { nationality: 'Dutch' },
        { nationality: 'German' },
      ];

      prisma.driver.findMany.mockResolvedValue(mockNationalities);

      const result = await driverService.getNationalities();

      expect(result).toEqual(['British', 'Dutch', 'German']);
      expect(prisma.driver.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: { nationality: true },
          distinct: ['nationality'],
          orderBy: { nationality: 'asc' },
        })
      );
    });

    it('should return empty array when no drivers', async () => {
      prisma.driver.findMany.mockResolvedValue([]);

      const result = await driverService.getNationalities();

      expect(result).toEqual([]);
    });
  });
});
