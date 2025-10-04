import { describe, it, expect, vi, beforeEach } from 'vitest';
import { circuitService } from '../../../src/services/circuitService';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
vi.mock('@prisma/client', () => {
  const mockPrismaClient = {
    circuit: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
  };
  return {
    PrismaClient: vi.fn(() => mockPrismaClient),
  };
});

describe('CircuitService', () => {
  let prisma: any;

  beforeEach(() => {
    prisma = new PrismaClient();
    vi.clearAllMocks();
  });

  describe('getAllCircuits', () => {
    it('should return paginated circuits', async () => {
      const mockCircuits = [
        {
          id: 1,
          circuitRef: 'monza',
          name: 'Autodromo Nazionale di Monza',
          location: 'Monza',
          country: 'Italy',
          lat: 45.6156,
          lng: 9.28111,
          alt: 162,
          url: 'http://example.com',
        },
      ];

      prisma.circuit.findMany.mockResolvedValue(mockCircuits);
      prisma.circuit.count.mockResolvedValue(1);

      const result = await circuitService.getAllCircuits({
        page: 1,
        limit: 20,
      });

      expect(result.circuits).toHaveLength(1);
      expect(result.circuits[0].name).toBe('Autodromo Nazionale di Monza');
      expect(result.meta).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    });

    it('should filter by country', async () => {
      prisma.circuit.findMany.mockResolvedValue([]);
      prisma.circuit.count.mockResolvedValue(0);

      await circuitService.getAllCircuits({
        page: 1,
        limit: 20,
        country: 'Italy',
      });

      expect(prisma.circuit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            country: { equals: 'Italy', mode: 'insensitive' },
          }),
        })
      );
    });

    it('should search by name, location, or circuitRef', async () => {
      prisma.circuit.findMany.mockResolvedValue([]);
      prisma.circuit.count.mockResolvedValue(0);

      await circuitService.getAllCircuits({
        page: 1,
        limit: 20,
        search: 'monza',
      });

      expect(prisma.circuit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                name: { contains: 'monza', mode: 'insensitive' },
              }),
              expect.objectContaining({
                location: { contains: 'monza', mode: 'insensitive' },
              }),
              expect.objectContaining({
                circuitRef: { contains: 'monza', mode: 'insensitive' },
              }),
            ]),
          }),
        })
      );
    });

    it('should sort circuits by name ascending', async () => {
      prisma.circuit.findMany.mockResolvedValue([]);
      prisma.circuit.count.mockResolvedValue(0);

      await circuitService.getAllCircuits({ page: 1, limit: 20 });

      expect(prisma.circuit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        })
      );
    });

    it('should handle pagination correctly', async () => {
      prisma.circuit.findMany.mockResolvedValue([]);
      prisma.circuit.count.mockResolvedValue(75);

      const result = await circuitService.getAllCircuits({
        page: 2,
        limit: 25,
      });

      expect(prisma.circuit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 25,
          take: 25,
        })
      );

      expect(result.meta).toEqual({
        page: 2,
        limit: 25,
        total: 75,
        totalPages: 3,
        hasNext: true,
        hasPrev: true,
      });
    });

    it('should include coordinates in response', async () => {
      const mockCircuit = {
        id: 1,
        circuitRef: 'spa',
        name: 'Circuit de Spa-Francorchamps',
        location: 'Spa',
        country: 'Belgium',
        lat: 50.4372,
        lng: 5.97139,
        alt: 401,
        url: 'http://example.com',
      };

      prisma.circuit.findMany.mockResolvedValue([mockCircuit]);
      prisma.circuit.count.mockResolvedValue(1);

      const result = await circuitService.getAllCircuits({
        page: 1,
        limit: 20,
      });

      expect(result.circuits[0].lat).toBe(50.4372);
      expect(result.circuits[0].lng).toBe(5.97139);
      expect(result.circuits[0].alt).toBe(401);
    });
  });

  describe('getCircuitById', () => {
    it('should return circuit with stats', async () => {
      const mockCircuit = {
        id: 1,
        circuitRef: 'silverstone',
        name: 'Silverstone Circuit',
        location: 'Silverstone',
        country: 'UK',
        lat: 52.0786,
        lng: -1.01694,
        alt: 153,
        url: 'http://example.com',
        races: [
          {
            name: 'British Grand Prix',
            season: { year: 2020 },
          },
          {
            name: 'British Grand Prix',
            season: { year: 2021 },
          },
          {
            name: 'British Grand Prix',
            season: { year: 2024 },
          },
        ],
      };

      prisma.circuit.findUnique.mockResolvedValue(mockCircuit);

      const result = await circuitService.getCircuitById(1);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
      expect(result?.stats).toEqual({
        totalRaces: 3,
        firstRace: {
          year: 2020,
          name: 'British Grand Prix',
        },
        lastRace: {
          year: 2024,
          name: 'British Grand Prix',
        },
      });
    });

    it('should return null for non-existent circuit', async () => {
      prisma.circuit.findUnique.mockResolvedValue(null);

      const result = await circuitService.getCircuitById(999);

      expect(result).toBeNull();
    });

    it('should handle circuit with no races', async () => {
      const mockCircuit = {
        id: 1,
        circuitRef: 'newcircuit',
        name: 'New Circuit',
        location: 'Location',
        country: 'Country',
        lat: 0,
        lng: 0,
        alt: 0,
        url: 'http://example.com',
        races: [],
      };

      prisma.circuit.findUnique.mockResolvedValue(mockCircuit);

      const result = await circuitService.getCircuitById(1);

      expect(result?.stats).toEqual({
        totalRaces: 0,
        firstRace: undefined,
        lastRace: undefined,
      });
    });

    it('should handle circuit with single race', async () => {
      const mockCircuit = {
        id: 1,
        circuitRef: 'jeddah',
        name: 'Jeddah Corniche Circuit',
        location: 'Jeddah',
        country: 'Saudi Arabia',
        lat: 21.6319,
        lng: 39.1044,
        alt: 15,
        url: 'http://example.com',
        races: [
          {
            name: 'Saudi Arabian Grand Prix',
            season: { year: 2021 },
          },
        ],
      };

      prisma.circuit.findUnique.mockResolvedValue(mockCircuit);

      const result = await circuitService.getCircuitById(1);

      expect(result?.stats?.totalRaces).toBe(1);
      expect(result?.stats?.firstRace).toEqual(result?.stats?.lastRace);
    });
  });

  describe('getCircuitByRef', () => {
    it('should return circuit by reference', async () => {
      const mockCircuit = {
        id: 1,
        circuitRef: 'monaco',
        name: 'Circuit de Monaco',
        location: 'Monte Carlo',
        country: 'Monaco',
        lat: 43.7347,
        lng: 7.42056,
        alt: 7,
        url: 'http://example.com',
        races: [],
      };

      prisma.circuit.findUnique.mockResolvedValue(mockCircuit);

      const result = await circuitService.getCircuitByRef('monaco');

      expect(result).not.toBeNull();
      expect(result?.circuitRef).toBe('monaco');
      expect(prisma.circuit.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { circuitRef: 'monaco' },
        })
      );
    });

    it('should return null for non-existent reference', async () => {
      prisma.circuit.findUnique.mockResolvedValue(null);

      const result = await circuitService.getCircuitByRef('nonexistent');

      expect(result).toBeNull();
    });

    it('should include stats for circuit by ref', async () => {
      const mockCircuit = {
        id: 1,
        circuitRef: 'monza',
        name: 'Autodromo Nazionale di Monza',
        location: 'Monza',
        country: 'Italy',
        lat: 45.6156,
        lng: 9.28111,
        alt: 162,
        url: 'http://example.com',
        races: [
          { name: 'Italian GP', season: { year: 2023 } },
          { name: 'Italian GP', season: { year: 2024 } },
        ],
      };

      prisma.circuit.findUnique.mockResolvedValue(mockCircuit);

      const result = await circuitService.getCircuitByRef('monza');

      expect(result?.stats).toBeDefined();
      expect(result?.stats?.totalRaces).toBe(2);
    });
  });

  describe('getCountries', () => {
    it('should return sorted unique countries', async () => {
      const mockCountries = [
        { country: 'Belgium' },
        { country: 'Italy' },
        { country: 'Monaco' },
        { country: 'UK' },
      ];

      prisma.circuit.findMany.mockResolvedValue(mockCountries);

      const result = await circuitService.getCountries();

      expect(result).toEqual(['Belgium', 'Italy', 'Monaco', 'UK']);
      expect(prisma.circuit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: { country: true },
          distinct: ['country'],
          orderBy: { country: 'asc' },
        })
      );
    });

    it('should return empty array when no circuits', async () => {
      prisma.circuit.findMany.mockResolvedValue([]);

      const result = await circuitService.getCountries();

      expect(result).toEqual([]);
    });
  });
});
