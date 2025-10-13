import { describe, it, expect, beforeEach } from 'vitest';
import {
  cleanDatabase,
  mockSeason,
  mockRace,
  mockCircuit,
  mockDriver,
  mockTeam,
  mockRaceResult,
  mockStatus,
} from '../../helpers/testSetup';
import { seasonService } from '../../../src/services/seasonService';

describe('SeasonService', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('getAllSeasons', () => {
    it('should return empty array when no seasons exist', async () => {
      const result = await seasonService.getAllSeasons({});

      expect(result.seasons).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    it('should return all seasons with default pagination', async () => {
      await mockSeason.createBatch([2020, 2021, 2022, 2023, 2024]);

      const result = await seasonService.getAllSeasons({});

      expect(result.seasons).toHaveLength(5);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(result.meta.total).toBe(5);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.hasNext).toBe(false);
      expect(result.meta.hasPrev).toBe(false);
    });

    it('should paginate seasons correctly', async () => {
      // Create 25 seasons
      const years = Array.from({ length: 25 }, (_, i) => 2000 + i);
      await mockSeason.createBatch(years);

      // Page 1
      const page1 = await seasonService.getAllSeasons({ page: 1, limit: 10 });
      expect(page1.seasons).toHaveLength(10);
      expect(page1.meta.page).toBe(1);
      expect(page1.meta.total).toBe(25);
      expect(page1.meta.totalPages).toBe(3);
      expect(page1.meta.hasNext).toBe(true);
      expect(page1.meta.hasPrev).toBe(false);

      // Page 2
      const page2 = await seasonService.getAllSeasons({ page: 2, limit: 10 });
      expect(page2.seasons).toHaveLength(10);
      expect(page2.meta.page).toBe(2);
      expect(page2.meta.hasNext).toBe(true);
      expect(page2.meta.hasPrev).toBe(true);

      // Page 3 (last page)
      const page3 = await seasonService.getAllSeasons({ page: 3, limit: 10 });
      expect(page3.seasons).toHaveLength(5);
      expect(page3.meta.hasNext).toBe(false);
      expect(page3.meta.hasPrev).toBe(true);
    });

    it('should sort seasons by year descending (most recent first)', async () => {
      await mockSeason.createBatch([2020, 2022, 2021, 2024, 2023]);

      const result = await seasonService.getAllSeasons({});

      expect(result.seasons[0].year).toBe(2024);
      expect(result.seasons[1].year).toBe(2023);
      expect(result.seasons[2].year).toBe(2022);
      expect(result.seasons[3].year).toBe(2021);
      expect(result.seasons[4].year).toBe(2020);
    });

    it('should handle page numbers less than 1', async () => {
      await mockSeason.createBatch([2020, 2021, 2022]);

      const result = await seasonService.getAllSeasons({ page: 0 });

      expect(result.meta.page).toBe(1);
    });

    it('should cap limit at 100', async () => {
      await mockSeason.createBatch([2020, 2021]);

      const result = await seasonService.getAllSeasons({ limit: 200 });

      expect(result.meta.limit).toBe(100);
    });

    it('should use default limit when 0 is provided', async () => {
      await mockSeason.createBatch([2020, 2021]);

      const result = await seasonService.getAllSeasons({ limit: 0 });

      expect(result.meta.limit).toBe(20);
    });
  });

  describe('getSeasonById', () => {
    it('should return season with basic info', async () => {
      const created = await mockSeason.create({ year: 2024 });

      const season = await seasonService.getSeasonById(created.id);

      expect(season).toBeDefined();
      expect(season?.id).toBe(created.id);
      expect(season?.year).toBe(2024);
      expect(season?.url).toBeDefined();
    });

    it('should return null for non-existent season', async () => {
      const season = await seasonService.getSeasonById(99999);

      expect(season).toBeNull();
    });

    it('should calculate statistics correctly - no races', async () => {
      const created = await mockSeason.create();

      const season = await seasonService.getSeasonById(created.id);

      expect(season?.stats).toEqual({
        totalRaces: 0,
        drivers: 0,
        teams: 0,
      });
    });

    it('should calculate statistics correctly - with races', async () => {
      const season = await mockSeason.create({ year: 2024 });
      const circuit1 = await mockCircuit.create({ circuitRef: 'circuit1' });
      const circuit2 = await mockCircuit.create({ circuitRef: 'circuit2' });
      const circuit3 = await mockCircuit.create({ circuitRef: 'circuit3' });

      await mockRace.create(season.id, circuit1.id, { round: 1 });
      await mockRace.create(season.id, circuit2.id, { round: 2 });
      await mockRace.create(season.id, circuit3.id, { round: 3 });

      const result = await seasonService.getSeasonById(season.id);

      expect(result?.stats?.totalRaces).toBe(3);
    });

    it('should count unique drivers correctly', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);

      const driver1 = await mockDriver.create({ driverRef: 'd1' });
      const driver2 = await mockDriver.create({ driverRef: 'd2' });
      const driver3 = await mockDriver.create({ driverRef: 'd3' });
      const team = await mockTeam.create();
      const status = await mockStatus.create();

      // Driver 1 and 2 in race
      await mockRaceResult.create(race.id, driver1.id, team.id, status.id);
      await mockRaceResult.create(race.id, driver2.id, team.id, status.id);

      const result = await seasonService.getSeasonById(season.id);

      expect(result?.stats?.drivers).toBe(2);

      // Add another race with driver3 and driver1 again
      const race2 = await mockRace.create(season.id, circuit.id, { round: 2 });
      await mockRaceResult.create(race2.id, driver1.id, team.id, status.id);
      await mockRaceResult.create(race2.id, driver3.id, team.id, status.id);

      const result2 = await seasonService.getSeasonById(season.id);

      // Should be 3 unique drivers across all races
      expect(result2?.stats?.drivers).toBe(3);
    });

    it('should count unique teams correctly', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);

      const driver1 = await mockDriver.create({ driverRef: 'd1' });
      const driver2 = await mockDriver.create({ driverRef: 'd2' });
      const team1 = await mockTeam.create({ teamRef: 't1' });
      const team2 = await mockTeam.create({ teamRef: 't2' });
      const status = await mockStatus.create();

      // Two teams in race
      await mockRaceResult.create(race.id, driver1.id, team1.id, status.id);
      await mockRaceResult.create(race.id, driver2.id, team2.id, status.id);

      const result = await seasonService.getSeasonById(season.id);

      expect(result?.stats?.teams).toBe(2);
    });

    it('should handle driver appearing in multiple races', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const driver = await mockDriver.create();
      const team = await mockTeam.create();
      const status = await mockStatus.create();

      // Same driver in 3 races
      for (let i = 1; i <= 3; i++) {
        const race = await mockRace.create(season.id, circuit.id, { round: i });
        await mockRaceResult.create(race.id, driver.id, team.id, status.id);
      }

      const result = await seasonService.getSeasonById(season.id);

      expect(result?.stats?.totalRaces).toBe(3);
      expect(result?.stats?.drivers).toBe(1); // Same driver, counted once
    });
  });

  describe('getSeasonByYear', () => {
    it('should return season by year', async () => {
      await mockSeason.create({ year: 2024 });

      const season = await seasonService.getSeasonByYear(2024);

      expect(season).toBeDefined();
      expect(season?.year).toBe(2024);
    });

    it('should return null for non-existent year', async () => {
      const season = await seasonService.getSeasonByYear(1949);

      expect(season).toBeNull();
    });

    it('should include statistics like getSeasonById', async () => {
      const season = await mockSeason.create({ year: 2024 });
      const circuit = await mockCircuit.create();

      await mockRace.create(season.id, circuit.id);

      const result = await seasonService.getSeasonByYear(2024);

      expect(result?.stats?.totalRaces).toBe(1);
    });

    it('should handle historic seasons', async () => {
      await mockSeason.create({ year: 1950 });

      const season = await seasonService.getSeasonByYear(1950);

      expect(season).toBeDefined();
      expect(season?.year).toBe(1950);
    });

    it('should handle future seasons', async () => {
      await mockSeason.create({ year: 2030 });

      const season = await seasonService.getSeasonByYear(2030);

      expect(season).toBeDefined();
      expect(season?.year).toBe(2030);
    });
  });

  describe('Edge Cases', () => {
    it('should handle season with many races', async () => {
      const season = await mockSeason.create({ year: 2024 });
      const circuits = await mockCircuit.createBatch(24);

      // Create 24 races (full calendar)
      for (let i = 0; i < 24; i++) {
        await mockRace.create(season.id, circuits[i].id, { round: i + 1 });
      }

      const result = await seasonService.getSeasonById(season.id);

      expect(result?.stats?.totalRaces).toBe(24);
    });

    it('should handle season with many drivers', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);
      const team = await mockTeam.create();
      const status = await mockStatus.create();

      // Create 20 drivers (10 teams × 2 drivers)
      const drivers = await mockDriver.createBatch(20);
      for (const driver of drivers) {
        await mockRaceResult.create(race.id, driver.id, team.id, status.id);
      }

      const result = await seasonService.getSeasonById(season.id);

      expect(result?.stats?.drivers).toBe(20);
    });

    it('should handle season with driver mid-season changes', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const team = await mockTeam.create();
      const status = await mockStatus.create();

      const driver1 = await mockDriver.create({ driverRef: 'd1' });
      const driver2 = await mockDriver.create({ driverRef: 'd2' });

      // Race 1: driver1
      const race1 = await mockRace.create(season.id, circuit.id, { round: 1 });
      await mockRaceResult.create(race1.id, driver1.id, team.id, status.id);

      // Race 2: driver2 replaces driver1
      const race2 = await mockRace.create(season.id, circuit.id, { round: 2 });
      await mockRaceResult.create(race2.id, driver2.id, team.id, status.id);

      const result = await seasonService.getSeasonById(season.id);

      expect(result?.stats?.drivers).toBe(2);
    });

    it('should handle season with no results but has races', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();

      // Race exists but no results yet
      await mockRace.create(season.id, circuit.id);

      const result = await seasonService.getSeasonById(season.id);

      expect(result?.stats?.totalRaces).toBe(1);
      expect(result?.stats?.drivers).toBe(0);
      expect(result?.stats?.teams).toBe(0);
    });

    it('should return empty results for page beyond total pages', async () => {
      await mockSeason.createBatch([2020, 2021, 2022]);

      const result = await seasonService.getAllSeasons({ page: 10, limit: 10 });

      expect(result.seasons).toHaveLength(0);
      expect(result.meta.page).toBe(10);
      expect(result.meta.hasNext).toBe(false);
    });

    it('should handle very old seasons', async () => {
      await mockSeason.create({ year: 1950 });

      const result = await seasonService.getSeasonByYear(1950);

      expect(result).toBeDefined();
      expect(result?.year).toBe(1950);
    });

    it('should handle consecutive seasons correctly', async () => {
      await mockSeason.createBatch([2020, 2021, 2022, 2023, 2024]);

      const result = await seasonService.getAllSeasons({ limit: 10 });

      // Should be sorted descending
      expect(result.seasons[0].year).toBe(2024);
      expect(result.seasons[4].year).toBe(2020);
      expect(result.seasons).toHaveLength(5);
    });
  });
});
