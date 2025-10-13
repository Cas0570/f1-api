import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  cleanDatabase,
  mockTeam,
  mockDriver,
  mockRaceResult,
  mockQualifyingResult,
  mockRace,
  mockSeason,
  mockCircuit,
  mockStatus,
  testPrisma,
} from '../../helpers/testSetup';
import { teamService } from '../../../src/services/teamService';
import { cacheService } from '../../../src/services/cacheService';

describe('TeamService', () => {
  beforeEach(async () => {
    await cleanDatabase();
    cacheService.flush();
  });

  afterEach(() => {
    cacheService.flush();
  });

  describe('getAllTeams', () => {
    it('should return empty array when no teams exist', async () => {
      const result = await teamService.getAllTeams({});

      expect(result.teams).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    it('should return all teams with default pagination', async () => {
      await mockTeam.createBatch(5);

      const result = await teamService.getAllTeams({});

      expect(result.teams).toHaveLength(5);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(result.meta.total).toBe(5);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.hasNext).toBe(false);
      expect(result.meta.hasPrev).toBe(false);
    });

    it('should paginate teams correctly', async () => {
      await mockTeam.createBatch(25);

      // Page 1
      const page1 = await teamService.getAllTeams({ page: 1, limit: 10 });
      expect(page1.teams).toHaveLength(10);
      expect(page1.meta.page).toBe(1);
      expect(page1.meta.total).toBe(25);
      expect(page1.meta.totalPages).toBe(3);
      expect(page1.meta.hasNext).toBe(true);
      expect(page1.meta.hasPrev).toBe(false);

      // Page 2
      const page2 = await teamService.getAllTeams({ page: 2, limit: 10 });
      expect(page2.teams).toHaveLength(10);
      expect(page2.meta.page).toBe(2);
      expect(page2.meta.hasNext).toBe(true);
      expect(page2.meta.hasPrev).toBe(true);

      // Page 3 (last page)
      const page3 = await teamService.getAllTeams({ page: 3, limit: 10 });
      expect(page3.teams).toHaveLength(5);
      expect(page3.meta.hasNext).toBe(false);
      expect(page3.meta.hasPrev).toBe(true);

      // Ensure different teams on each page
      const page1Ids = page1.teams.map((t) => t.id);
      const page2Ids = page2.teams.map((t) => t.id);
      expect(page1Ids).not.toEqual(page2Ids);
    });

    it('should filter by nationality', async () => {
      await mockTeam.create({
        nationality: 'Italian',
        teamRef: 'ferrari',
        name: 'Ferrari',
      });
      await mockTeam.create({
        nationality: 'Italian',
        teamRef: 'alphatauri',
        name: 'AlphaTauri',
      });
      await mockTeam.create({
        nationality: 'British',
        teamRef: 'mclaren',
        name: 'McLaren',
      });

      const result = await teamService.getAllTeams({ nationality: 'Italian' });

      expect(result.teams).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      result.teams.forEach((team) => {
        expect(team.nationality).toBe('Italian');
      });
    });

    it('should filter by nationality case-insensitively', async () => {
      await mockTeam.create({ nationality: 'Italian', teamRef: 'ferrari' });

      const result = await teamService.getAllTeams({ nationality: 'italian' });

      expect(result.teams).toHaveLength(1);
      expect(result.teams[0].nationality).toBe('Italian');
    });

    it('should search by team name', async () => {
      await mockTeam.create({
        name: 'Mercedes-AMG Petronas F1 Team',
        teamRef: 'mercedes',
      });
      await mockTeam.create({
        name: 'Red Bull Racing',
        teamRef: 'red_bull',
      });

      const result = await teamService.getAllTeams({ search: 'Mercedes' });

      expect(result.teams).toHaveLength(1);
      expect(result.teams[0].name).toContain('Mercedes');
    });

    it('should search by teamRef', async () => {
      await mockTeam.create({ teamRef: 'mercedes', name: 'Mercedes' });
      await mockTeam.create({ teamRef: 'ferrari', name: 'Ferrari' });

      const result = await teamService.getAllTeams({ search: 'mercedes' });

      expect(result.teams).toHaveLength(1);
      expect(result.teams[0].teamRef).toBe('mercedes');
    });

    it('should search case-insensitively', async () => {
      await mockTeam.create({ name: 'Ferrari', teamRef: 'ferrari' });

      const result = await teamService.getAllTeams({ search: 'ferrari' });

      expect(result.teams).toHaveLength(1);
      expect(result.teams[0].name).toBe('Ferrari');
    });

    it('should combine nationality filter and search', async () => {
      await mockTeam.create({
        nationality: 'British',
        name: 'Mercedes',
        teamRef: 'mercedes',
      });
      await mockTeam.create({
        nationality: 'British',
        name: 'McLaren',
        teamRef: 'mclaren',
      });
      await mockTeam.create({
        nationality: 'Italian',
        name: 'Ferrari',
        teamRef: 'ferrari',
      });

      const result = await teamService.getAllTeams({
        nationality: 'British',
        search: 'Mercedes',
      });

      expect(result.teams).toHaveLength(1);
      expect(result.teams[0].name).toBe('Mercedes');
      expect(result.teams[0].nationality).toBe('British');
    });

    it('should sort teams alphabetically by name', async () => {
      await mockTeam.create({ name: 'Red Bull Racing', teamRef: 'red_bull' });
      await mockTeam.create({ name: 'Ferrari', teamRef: 'ferrari' });
      await mockTeam.create({ name: 'Mercedes', teamRef: 'mercedes' });

      const result = await teamService.getAllTeams({});

      expect(result.teams[0].name).toBe('Ferrari');
      expect(result.teams[1].name).toBe('Mercedes');
      expect(result.teams[2].name).toBe('Red Bull Racing');
    });

    it('should handle page numbers less than 1', async () => {
      await mockTeam.createBatch(5);

      const result = await teamService.getAllTeams({ page: 0 });

      expect(result.meta.page).toBe(1);
    });

    it('should handle negative page numbers', async () => {
      await mockTeam.createBatch(5);

      const result = await teamService.getAllTeams({ page: -5 });

      expect(result.meta.page).toBe(1);
    });

    it('should cap limit at 100', async () => {
      await mockTeam.createBatch(5);

      const result = await teamService.getAllTeams({ limit: 200 });

      expect(result.meta.limit).toBe(100);
    });

    it('should use default limit when 0 is provided', async () => {
      await mockTeam.createBatch(5);

      const result = await teamService.getAllTeams({ limit: 0 });

      expect(result.meta.limit).toBe(20);
    });
  });

  describe('getTeamById', () => {
    it('should return team with basic info', async () => {
      const created = await mockTeam.create({
        name: 'Mercedes-AMG Petronas',
        teamRef: 'mercedes',
        nationality: 'German',
      });

      const team = await teamService.getTeamById(created.id);

      expect(team).toBeDefined();
      expect(team?.id).toBe(created.id);
      expect(team?.name).toBe('Mercedes-AMG Petronas');
      expect(team?.teamRef).toBe('mercedes');
      expect(team?.nationality).toBe('German');
    });

    it('should return null for non-existent team', async () => {
      const team = await teamService.getTeamById(99999);

      expect(team).toBeNull();
    });

    it('should calculate statistics correctly - no races', async () => {
      const created = await mockTeam.create();

      const team = await teamService.getTeamById(created.id);

      expect(team?.stats).toEqual({
        races: 0,
        wins: 0,
        podiums: 0,
        poles: 0,
        championships: 0,
      });
    });

    it('should calculate statistics correctly - with races', async () => {
      const team = await mockTeam.create();
      const driver = await mockDriver.create();
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const status = await mockStatus.create();

      // Create 5 races
      for (let i = 1; i <= 5; i++) {
        const race = await mockRace.create(season.id, circuit.id, { round: i });

        // 2 wins (position 1)
        const position = i <= 2 ? 1 : i <= 4 ? 2 : 5;

        await mockRaceResult.create(race.id, driver.id, team.id, status.id, {
          position,
          positionText: position.toString(),
        });

        // 3 poles
        if (i <= 3) {
          await mockQualifyingResult.create(race.id, driver.id, team.id, {
            position: 1,
          });
        }
      }

      const result = await teamService.getTeamById(team.id);

      expect(result?.stats).toEqual({
        races: 5,
        wins: 2,
        podiums: 4, // positions 1, 1, 2, 2 = 4 podiums
        poles: 3,
        championships: 0,
      });
    });

    it('should count only positions 1-3 as podiums', async () => {
      const team = await mockTeam.create();
      const driver = await mockDriver.create();
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const status = await mockStatus.create();

      const positions = [1, 2, 3, 4, 5];
      for (const pos of positions) {
        const race = await mockRace.create(season.id, circuit.id, {
          round: pos,
        });
        await mockRaceResult.create(race.id, driver.id, team.id, status.id, {
          position: pos,
          positionText: pos.toString(),
        });
      }

      const result = await teamService.getTeamById(team.id);

      expect(result?.stats?.podiums).toBe(3);
    });

    it('should handle multiple drivers for the same team', async () => {
      const team = await mockTeam.create();
      const driver1 = await mockDriver.create({ driverRef: 'driver1' });
      const driver2 = await mockDriver.create({ driverRef: 'driver2' });
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const status = await mockStatus.create();

      const race = await mockRace.create(season.id, circuit.id);

      // Both drivers finish on podium
      await mockRaceResult.create(race.id, driver1.id, team.id, status.id, {
        position: 1,
      });
      await mockRaceResult.create(race.id, driver2.id, team.id, status.id, {
        position: 2,
      });

      const result = await teamService.getTeamById(team.id);

      expect(result?.stats).toEqual({
        races: 2, // 2 entries (one per driver)
        wins: 1,
        podiums: 2,
        poles: 0,
        championships: 0,
      });
    });

    it('should handle DNF results (null position)', async () => {
      const team = await mockTeam.create();
      const driver = await mockDriver.create();
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const status = await mockStatus.create({ category: 'mechanical' });

      const race = await mockRace.create(season.id, circuit.id);
      await mockRaceResult.create(race.id, driver.id, team.id, status.id, {
        position: null,
        positionText: 'R',
      });

      const result = await teamService.getTeamById(team.id);

      expect(result?.stats).toEqual({
        races: 1,
        wins: 0,
        podiums: 0,
        poles: 0,
        championships: 0,
      });
    });

    it('should cache team details', async () => {
      const created = await mockTeam.create();

      // First call - hits database
      const firstCall = await teamService.getTeamById(created.id);
      expect(firstCall).toBeDefined();

      // Delete from database
      await testPrisma.team.delete({ where: { id: created.id } });

      // Second call - hits cache
      const secondCall = await teamService.getTeamById(created.id);
      expect(secondCall).toBeDefined();
      expect(secondCall?.id).toBe(created.id);

      // Verify cache usage
      const cacheStats = cacheService.getStats();
      expect(cacheStats.hits).toBeGreaterThan(0);
    });
  });

  describe('getTeamByRef', () => {
    it('should return team by reference', async () => {
      await mockTeam.create({
        teamRef: 'mercedes',
        name: 'Mercedes-AMG Petronas',
      });

      const team = await teamService.getTeamByRef('mercedes');

      expect(team).toBeDefined();
      expect(team?.teamRef).toBe('mercedes');
      expect(team?.name).toBe('Mercedes-AMG Petronas');
    });

    it('should return null for non-existent reference', async () => {
      const team = await teamService.getTeamByRef('nonexistent');

      expect(team).toBeNull();
    });

    it('should include statistics like getTeamById', async () => {
      const team = await mockTeam.create({ teamRef: 'test_team' });
      const driver = await mockDriver.create();
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const status = await mockStatus.create();

      const race = await mockRace.create(season.id, circuit.id);
      await mockRaceResult.create(race.id, driver.id, team.id, status.id, {
        position: 1,
      });

      const result = await teamService.getTeamByRef('test_team');

      expect(result?.stats?.wins).toBe(1);
    });

    it('should cache team by ref', async () => {
      const created = await mockTeam.create({ teamRef: 'cached_team' });

      // First call
      await teamService.getTeamByRef('cached_team');

      // Delete from database
      await testPrisma.team.delete({ where: { id: created.id } });

      // Second call - from cache
      const cached = await teamService.getTeamByRef('cached_team');
      expect(cached).toBeDefined();
      expect(cached?.teamRef).toBe('cached_team');
    });
  });

  describe('getNationalities', () => {
    it('should return empty array when no teams exist', async () => {
      const nationalities = await teamService.getNationalities();

      expect(nationalities).toEqual([]);
    });

    it('should return unique nationalities sorted alphabetically', async () => {
      await mockTeam.create({ nationality: 'British' });
      await mockTeam.create({ nationality: 'German' });
      await mockTeam.create({ nationality: 'Italian' });
      await mockTeam.create({ nationality: 'British' }); // Duplicate

      const nationalities = await teamService.getNationalities();

      expect(nationalities).toEqual(['British', 'German', 'Italian']);
      expect(nationalities).toHaveLength(3);
    });

    it('should maintain case from database', async () => {
      await mockTeam.create({ nationality: 'British' });

      const nationalities = await teamService.getNationalities();

      expect(nationalities[0]).toBe('British');
    });

    it('should cache nationalities for 24 hours', async () => {
      await mockTeam.create({ nationality: 'British' });

      // First call
      await teamService.getNationalities();

      // Add new nationality
      await mockTeam.create({ nationality: 'German' });

      // Second call - returns cached value
      const cached = await teamService.getNationalities();
      expect(cached).toEqual(['British']);

      // Clear cache and try again
      cacheService.flush();
      const fresh = await teamService.getNationalities();
      expect(fresh).toEqual(['British', 'German']);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long team names', async () => {
      const longName = 'A'.repeat(255);
      const team = await mockTeam.create({ name: longName });

      const result = await teamService.getTeamById(team.id);

      expect(result?.name).toBe(longName);
    });

    it('should handle special characters in team names', async () => {
      await mockTeam.create({
        name: 'Aston Martin Aramco Cognizant F1 Team',
        teamRef: 'aston_martin',
      });

      const result = await teamService.getAllTeams({ search: 'Aston' });

      expect(result.teams).toHaveLength(1);
    });

    it('should handle special characters in search', async () => {
      await mockTeam.create({
        name: 'Alfa Romeo F1 Team ORLEN',
        teamRef: 'alfa',
      });

      const result = await teamService.getAllTeams({ search: 'Romeo' });

      expect(result.teams).toHaveLength(1);
    });

    it('should return empty results for page beyond total pages', async () => {
      await mockTeam.createBatch(5);

      const result = await teamService.getAllTeams({ page: 10, limit: 10 });

      expect(result.teams).toHaveLength(0);
      expect(result.meta.page).toBe(10);
      expect(result.meta.hasNext).toBe(false);
    });

    it('should handle team with many races across multiple seasons', async () => {
      const team = await mockTeam.create();
      const driver = await mockDriver.create();
      const circuit = await mockCircuit.create();
      const status = await mockStatus.create();

      // Create races across 3 seasons
      for (let year = 2022; year <= 2024; year++) {
        const season = await mockSeason.create({ year });

        for (let round = 1; round <= 5; round++) {
          const race = await mockRace.create(season.id, circuit.id, { round });
          await mockRaceResult.create(race.id, driver.id, team.id, status.id, {
            position: 1,
          });
        }
      }

      const result = await teamService.getTeamById(team.id);

      expect(result?.stats?.races).toBe(15); // 3 years × 5 races
      expect(result?.stats?.wins).toBe(15);
    });

    it('should handle team with no results but has qualifying', async () => {
      const team = await mockTeam.create();
      const driver = await mockDriver.create();
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();

      const race = await mockRace.create(season.id, circuit.id);
      await mockQualifyingResult.create(race.id, driver.id, team.id, {
        position: 1,
      });

      const result = await teamService.getTeamById(team.id);

      expect(result?.stats?.races).toBe(0);
      expect(result?.stats?.poles).toBe(1);
    });
  });
});
