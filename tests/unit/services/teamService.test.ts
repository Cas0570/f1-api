import { describe, it, expect, vi, beforeEach } from 'vitest';
import { teamService } from '../../../src/services/teamService';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
vi.mock('@prisma/client', () => {
  const mockPrismaClient = {
    team: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
  };
  return {
    PrismaClient: vi.fn(() => mockPrismaClient),
  };
});

describe('TeamService', () => {
  let prisma: any;

  beforeEach(() => {
    prisma = new PrismaClient();
    vi.clearAllMocks();
  });

  describe('getAllTeams', () => {
    it('should return paginated teams', async () => {
      const mockTeams = [
        {
          id: 1,
          teamRef: 'mercedes',
          name: 'Mercedes',
          nationality: 'German',
          url: 'http://example.com',
        },
      ];

      prisma.team.findMany.mockResolvedValue(mockTeams);
      prisma.team.count.mockResolvedValue(1);

      const result = await teamService.getAllTeams({ page: 1, limit: 20 });

      expect(result.teams).toHaveLength(1);
      expect(result.teams[0].name).toBe('Mercedes');
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
      prisma.team.findMany.mockResolvedValue([]);
      prisma.team.count.mockResolvedValue(0);

      await teamService.getAllTeams({
        page: 1,
        limit: 20,
        nationality: 'Italian',
      });

      expect(prisma.team.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            nationality: { equals: 'Italian', mode: 'insensitive' },
          }),
        })
      );
    });

    it('should search by name or teamRef', async () => {
      prisma.team.findMany.mockResolvedValue([]);
      prisma.team.count.mockResolvedValue(0);

      await teamService.getAllTeams({
        page: 1,
        limit: 20,
        search: 'ferrari',
      });

      expect(prisma.team.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                name: { contains: 'ferrari', mode: 'insensitive' },
              }),
              expect.objectContaining({
                teamRef: { contains: 'ferrari', mode: 'insensitive' },
              }),
            ]),
          }),
        })
      );
    });

    it('should handle pagination correctly', async () => {
      prisma.team.findMany.mockResolvedValue([]);
      prisma.team.count.mockResolvedValue(50);

      const result = await teamService.getAllTeams({ page: 3, limit: 10 });

      expect(prisma.team.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        })
      );

      expect(result.meta).toEqual({
        page: 3,
        limit: 10,
        total: 50,
        totalPages: 5,
        hasNext: true,
        hasPrev: true,
      });
    });

    it('should sort teams by name ascending', async () => {
      prisma.team.findMany.mockResolvedValue([]);
      prisma.team.count.mockResolvedValue(0);

      await teamService.getAllTeams({ page: 1, limit: 20 });

      expect(prisma.team.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        })
      );
    });
  });

  describe('getTeamById', () => {
    it('should return team with stats', async () => {
      const mockTeam = {
        id: 1,
        teamRef: 'ferrari',
        name: 'Ferrari',
        nationality: 'Italian',
        url: 'http://example.com',
        raceResults: [
          { position: 1, points: 25 },
          { position: 2, points: 18 },
          { position: 1, points: 25 },
          { position: 4, points: 12 },
        ],
        qualifyingResults: [{ position: 1 }, { position: 1 }, { position: 2 }],
      };

      prisma.team.findUnique.mockResolvedValue(mockTeam);

      const result = await teamService.getTeamById(1);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
      expect(result?.stats).toEqual({
        races: 4,
        wins: 2,
        podiums: 3,
        poles: 2,
        championships: 0,
      });
    });

    it('should return null for non-existent team', async () => {
      prisma.team.findUnique.mockResolvedValue(null);

      const result = await teamService.getTeamById(999);

      expect(result).toBeNull();
    });

    it('should calculate podiums correctly (positions 1-3)', async () => {
      const mockTeam = {
        id: 1,
        teamRef: 'ferrari',
        name: 'Ferrari',
        nationality: 'Italian',
        url: 'http://example.com',
        raceResults: [
          { position: 1, points: 25 },
          { position: 2, points: 18 },
          { position: 3, points: 15 },
          { position: 4, points: 12 },
          { position: 5, points: 10 },
        ],
        qualifyingResults: [],
      };

      prisma.team.findUnique.mockResolvedValue(mockTeam);

      const result = await teamService.getTeamById(1);

      expect(result?.stats?.podiums).toBe(3);
      expect(result?.stats?.wins).toBe(1);
    });

    it('should handle teams with no results', async () => {
      const mockTeam = {
        id: 1,
        teamRef: 'newteam',
        name: 'New Team',
        nationality: 'American',
        url: 'http://example.com',
        raceResults: [],
        qualifyingResults: [],
      };

      prisma.team.findUnique.mockResolvedValue(mockTeam);

      const result = await teamService.getTeamById(1);

      expect(result?.stats).toEqual({
        races: 0,
        wins: 0,
        podiums: 0,
        poles: 0,
        championships: 0,
      });
    });
  });

  describe('getTeamByRef', () => {
    it('should return team by reference', async () => {
      const mockTeam = {
        id: 1,
        teamRef: 'red_bull',
        name: 'Red Bull Racing',
        nationality: 'Austrian',
        url: 'http://example.com',
        raceResults: [],
        qualifyingResults: [],
      };

      prisma.team.findUnique.mockResolvedValue(mockTeam);

      const result = await teamService.getTeamByRef('red_bull');

      expect(result).not.toBeNull();
      expect(result?.teamRef).toBe('red_bull');
      expect(prisma.team.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { teamRef: 'red_bull' },
        })
      );
    });

    it('should return null for non-existent reference', async () => {
      prisma.team.findUnique.mockResolvedValue(null);

      const result = await teamService.getTeamByRef('nonexistent');

      expect(result).toBeNull();
    });

    it('should include stats for team by ref', async () => {
      const mockTeam = {
        id: 1,
        teamRef: 'mercedes',
        name: 'Mercedes',
        nationality: 'German',
        url: 'http://example.com',
        raceResults: [{ position: 1, points: 25 }],
        qualifyingResults: [{ position: 1 }],
      };

      prisma.team.findUnique.mockResolvedValue(mockTeam);

      const result = await teamService.getTeamByRef('mercedes');

      expect(result?.stats).toBeDefined();
      expect(result?.stats?.wins).toBe(1);
    });
  });

  describe('getNationalities', () => {
    it('should return sorted unique nationalities', async () => {
      const mockNationalities = [
        { nationality: 'Austrian' },
        { nationality: 'British' },
        { nationality: 'German' },
        { nationality: 'Italian' },
      ];

      prisma.team.findMany.mockResolvedValue(mockNationalities);

      const result = await teamService.getNationalities();

      expect(result).toEqual(['Austrian', 'British', 'German', 'Italian']);
      expect(prisma.team.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: { nationality: true },
          distinct: ['nationality'],
          orderBy: { nationality: 'asc' },
        })
      );
    });

    it('should return empty array when no teams', async () => {
      prisma.team.findMany.mockResolvedValue([]);

      const result = await teamService.getNationalities();

      expect(result).toEqual([]);
    });
  });
});
