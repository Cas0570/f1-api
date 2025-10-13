import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  cleanDatabase,
  mockDriver,
  mockRaceResult,
  mockQualifyingResult,
  mockRace,
  mockSeason,
  mockCircuit,
  mockTeam,
  mockStatus,
  testPrisma,
} from '../../helpers/testSetup';
import { driverService } from '../../../src/services/driverService';
import { cacheService } from '../../../src/services/cacheService';

describe('DriverService', () => {
  beforeEach(async () => {
    await cleanDatabase();
    cacheService.flush(); // Clear cache before each test
  });

  afterEach(() => {
    cacheService.flush(); // Clean up cache after each test
  });

  describe('getAllDrivers', () => {
    it('should return empty array when no drivers exist', async () => {
      const result = await driverService.getAllDrivers({});

      expect(result.drivers).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    it('should return all drivers with default pagination', async () => {
      // Create 5 drivers
      await mockDriver.createBatch(5);

      const result = await driverService.getAllDrivers({});

      expect(result.drivers).toHaveLength(5);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(result.meta.total).toBe(5);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.hasNext).toBe(false);
      expect(result.meta.hasPrev).toBe(false);
    });

    it('should paginate drivers correctly', async () => {
      // Create 25 drivers
      await mockDriver.createBatch(25);

      // Get page 1
      const page1 = await driverService.getAllDrivers({ page: 1, limit: 10 });
      expect(page1.drivers).toHaveLength(10);
      expect(page1.meta.page).toBe(1);
      expect(page1.meta.total).toBe(25);
      expect(page1.meta.totalPages).toBe(3);
      expect(page1.meta.hasNext).toBe(true);
      expect(page1.meta.hasPrev).toBe(false);

      // Get page 2
      const page2 = await driverService.getAllDrivers({ page: 2, limit: 10 });
      expect(page2.drivers).toHaveLength(10);
      expect(page2.meta.page).toBe(2);
      expect(page2.meta.hasNext).toBe(true);
      expect(page2.meta.hasPrev).toBe(true);

      // Get page 3 (last page)
      const page3 = await driverService.getAllDrivers({ page: 3, limit: 10 });
      expect(page3.drivers).toHaveLength(5);
      expect(page3.meta.page).toBe(3);
      expect(page3.meta.hasNext).toBe(false);
      expect(page3.meta.hasPrev).toBe(true);

      // Ensure different drivers on each page
      const page1Ids = page1.drivers.map((d) => d.id);
      const page2Ids = page2.drivers.map((d) => d.id);
      expect(page1Ids).not.toEqual(page2Ids);
    });

    it('should filter by nationality', async () => {
      // Create drivers with different nationalities
      await mockDriver.create({ nationality: 'British', driverRef: 'brit1' });
      await mockDriver.create({ nationality: 'British', driverRef: 'brit2' });
      await mockDriver.create({ nationality: 'German', driverRef: 'ger1' });
      await mockDriver.create({ nationality: 'Spanish', driverRef: 'spa1' });

      const result = await driverService.getAllDrivers({
        nationality: 'British',
      });

      expect(result.drivers).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      result.drivers.forEach((driver) => {
        expect(driver.nationality).toBe('British');
      });
    });

    it('should filter by nationality case-insensitively', async () => {
      await mockDriver.create({ nationality: 'British', driverRef: 'brit1' });

      const result = await driverService.getAllDrivers({
        nationality: 'british',
      });

      expect(result.drivers).toHaveLength(1);
      expect(result.drivers[0].nationality).toBe('British');
    });

    it('should search by forename', async () => {
      await mockDriver.create({
        forename: 'Lewis',
        surname: 'Hamilton',
        driverRef: 'hamilton',
      });
      await mockDriver.create({
        forename: 'Max',
        surname: 'Verstappen',
        driverRef: 'verstappen',
      });

      const result = await driverService.getAllDrivers({ search: 'Lewis' });

      expect(result.drivers).toHaveLength(1);
      expect(result.drivers[0].forename).toBe('Lewis');
    });

    it('should search by surname', async () => {
      await mockDriver.create({
        forename: 'Lewis',
        surname: 'Hamilton',
        driverRef: 'hamilton',
      });
      await mockDriver.create({
        forename: 'Max',
        surname: 'Verstappen',
        driverRef: 'verstappen',
      });

      const result = await driverService.getAllDrivers({
        search: 'Verstappen',
      });

      expect(result.drivers).toHaveLength(1);
      expect(result.drivers[0].surname).toBe('Verstappen');
    });

    it('should search by driverRef', async () => {
      await mockDriver.create({ driverRef: 'hamilton' });
      await mockDriver.create({ driverRef: 'verstappen' });

      const result = await driverService.getAllDrivers({ search: 'hamilton' });

      expect(result.drivers).toHaveLength(1);
      expect(result.drivers[0].driverRef).toBe('hamilton');
    });

    it('should search case-insensitively', async () => {
      await mockDriver.create({
        forename: 'Lewis',
        driverRef: 'hamilton',
      });

      const result = await driverService.getAllDrivers({ search: 'lewis' });

      expect(result.drivers).toHaveLength(1);
      expect(result.drivers[0].forename).toBe('Lewis');
    });

    it('should combine nationality filter and search', async () => {
      await mockDriver.create({
        nationality: 'British',
        forename: 'Lewis',
        driverRef: 'hamilton',
      });
      await mockDriver.create({
        nationality: 'British',
        forename: 'George',
        driverRef: 'russell',
      });
      await mockDriver.create({
        nationality: 'Spanish',
        forename: 'Fernando',
        driverRef: 'alonso',
      });

      const result = await driverService.getAllDrivers({
        nationality: 'British',
        search: 'Lewis',
      });

      expect(result.drivers).toHaveLength(1);
      expect(result.drivers[0].forename).toBe('Lewis');
      expect(result.drivers[0].nationality).toBe('British');
    });

    it('should sort drivers alphabetically by surname then forename', async () => {
      await mockDriver.create({
        forename: 'Max',
        surname: 'Verstappen',
        driverRef: 'ver',
      });
      await mockDriver.create({
        forename: 'Lewis',
        surname: 'Hamilton',
        driverRef: 'ham',
      });
      await mockDriver.create({
        forename: 'Charles',
        surname: 'Leclerc',
        driverRef: 'lec',
      });

      const result = await driverService.getAllDrivers({});

      expect(result.drivers[0].surname).toBe('Hamilton');
      expect(result.drivers[1].surname).toBe('Leclerc');
      expect(result.drivers[2].surname).toBe('Verstappen');
    });

    it('should handle page numbers less than 1', async () => {
      await mockDriver.createBatch(5);

      const result = await driverService.getAllDrivers({ page: 0 });

      expect(result.meta.page).toBe(1); // Should default to 1
    });

    it('should handle negative page numbers', async () => {
      await mockDriver.createBatch(5);

      const result = await driverService.getAllDrivers({ page: -5 });

      expect(result.meta.page).toBe(1); // Should default to 1
    });

    it('should cap limit at 100', async () => {
      await mockDriver.createBatch(5);

      const result = await driverService.getAllDrivers({ limit: 200 });

      expect(result.meta.limit).toBe(100); // Should be capped at 100
    });

    it('should use default limit when 0 is provided', async () => {
      await mockDriver.createBatch(5);

      const result = await driverService.getAllDrivers({ limit: 0 });

      expect(result.meta.limit).toBe(20); // 0 is falsy, so defaults to 20
    });
  });

  describe('getDriverById', () => {
    it('should return driver with basic info', async () => {
      const created = await mockDriver.create({
        forename: 'Lewis',
        surname: 'Hamilton',
        code: 'HAM',
        number: 44,
      });

      const driver = await driverService.getDriverById(created.id);

      expect(driver).toBeDefined();
      expect(driver?.id).toBe(created.id);
      expect(driver?.forename).toBe('Lewis');
      expect(driver?.surname).toBe('Hamilton');
      expect(driver?.fullName).toBe('Lewis Hamilton');
      expect(driver?.code).toBe('HAM');
      expect(driver?.number).toBe(44);
    });

    it('should return null for non-existent driver', async () => {
      const driver = await driverService.getDriverById(99999);

      expect(driver).toBeNull();
    });

    it('should calculate statistics correctly - no races', async () => {
      const created = await mockDriver.create();

      const driver = await driverService.getDriverById(created.id);

      expect(driver?.stats).toEqual({
        races: 0,
        wins: 0,
        podiums: 0,
        poles: 0,
        championships: 0,
      });
    });

    it('should calculate statistics correctly - with races', async () => {
      // Create driver
      const driver = await mockDriver.create();
      const team = await mockTeam.create();
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

      const result = await driverService.getDriverById(driver.id);

      expect(result?.stats).toEqual({
        races: 5,
        wins: 2,
        podiums: 4, // positions 1, 1, 2, 2 = 4 podiums
        poles: 3,
        championships: 0,
      });
    });

    it('should count only positions 1-3 as podiums', async () => {
      const driver = await mockDriver.create();
      const team = await mockTeam.create();
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const status = await mockStatus.create();

      // Create races with different positions
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

      const result = await driverService.getDriverById(driver.id);

      expect(result?.stats?.podiums).toBe(3); // Only positions 1, 2, 3
    });

    it('should handle DNF results (null position)', async () => {
      const driver = await mockDriver.create();
      const team = await mockTeam.create();
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const status = await mockStatus.create({ category: 'mechanical' });

      const race = await mockRace.create(season.id, circuit.id);
      await mockRaceResult.create(race.id, driver.id, team.id, status.id, {
        position: null,
        positionText: 'R',
      });

      const result = await driverService.getDriverById(driver.id);

      expect(result?.stats).toEqual({
        races: 1,
        wins: 0,
        podiums: 0,
        poles: 0,
        championships: 0,
      });
    });

    it('should cache driver details', async () => {
      const created = await mockDriver.create();

      // First call - should hit database
      const firstCall = await driverService.getDriverById(created.id);
      expect(firstCall).toBeDefined();

      // Delete the driver from database (but cache should still have it)
      await testPrisma.driver.delete({ where: { id: created.id } });

      // Second call - should hit cache
      const secondCall = await driverService.getDriverById(created.id);
      expect(secondCall).toBeDefined();
      expect(secondCall?.id).toBe(created.id);

      // Verify cache was used by checking cache stats
      const cacheStats = cacheService.getStats();
      expect(cacheStats.hits).toBeGreaterThan(0);
    });

    it('should format dob as ISO date string', async () => {
      const created = await mockDriver.create({
        dob: new Date('1985-01-07'),
      });

      const driver = await driverService.getDriverById(created.id);

      expect(driver?.dob).toBe('1985-01-07');
      expect(typeof driver?.dob).toBe('string');
    });
  });

  describe('getDriverByRef', () => {
    it('should return driver by reference', async () => {
      await mockDriver.create({
        driverRef: 'hamilton',
        forename: 'Lewis',
        surname: 'Hamilton',
      });

      const driver = await driverService.getDriverByRef('hamilton');

      expect(driver).toBeDefined();
      expect(driver?.driverRef).toBe('hamilton');
      expect(driver?.forename).toBe('Lewis');
    });

    it('should return null for non-existent reference', async () => {
      const driver = await driverService.getDriverByRef('nonexistent');

      expect(driver).toBeNull();
    });

    it('should include statistics like getDriverById', async () => {
      const driver = await mockDriver.create({ driverRef: 'test_driver' });
      const team = await mockTeam.create();
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const status = await mockStatus.create();

      // Create a win
      const race = await mockRace.create(season.id, circuit.id);
      await mockRaceResult.create(race.id, driver.id, team.id, status.id, {
        position: 1,
      });

      const result = await driverService.getDriverByRef('test_driver');

      expect(result?.stats?.wins).toBe(1);
    });

    it('should cache driver by ref', async () => {
      const created = await mockDriver.create({ driverRef: 'cached_driver' });

      // First call
      await driverService.getDriverByRef('cached_driver');

      // Delete from database
      await testPrisma.driver.delete({ where: { id: created.id } });

      // Second call - should still work from cache
      const cached = await driverService.getDriverByRef('cached_driver');
      expect(cached).toBeDefined();
      expect(cached?.driverRef).toBe('cached_driver');
    });
  });

  describe('getNationalities', () => {
    it('should return empty array when no drivers exist', async () => {
      const nationalities = await driverService.getNationalities();

      expect(nationalities).toEqual([]);
    });

    it('should return unique nationalities sorted alphabetically', async () => {
      await mockDriver.create({ nationality: 'British' });
      await mockDriver.create({ nationality: 'German' });
      await mockDriver.create({ nationality: 'Spanish' });
      await mockDriver.create({ nationality: 'British' }); // Duplicate

      const nationalities = await driverService.getNationalities();

      expect(nationalities).toEqual(['British', 'German', 'Spanish']);
      expect(nationalities).toHaveLength(3); // No duplicates
    });

    it('should maintain case from database', async () => {
      await mockDriver.create({ nationality: 'British' });

      const nationalities = await driverService.getNationalities();

      expect(nationalities[0]).toBe('British'); // Not lowercase
    });

    it('should cache nationalities for 24 hours', async () => {
      await mockDriver.create({ nationality: 'British' });

      // First call
      await driverService.getNationalities();

      // Add new nationality
      await mockDriver.create({ nationality: 'German' });

      // Second call - should return cached value (only British)
      const cached = await driverService.getNationalities();
      expect(cached).toEqual(['British']);

      // Clear cache and try again
      cacheService.flush();
      const fresh = await driverService.getNationalities();
      expect(fresh).toEqual(['British', 'German']);
    });
  });

  describe('Edge Cases', () => {
    it('should handle driver with no code', async () => {
      const driver = await mockDriver.create({ code: null });

      const result = await driverService.getDriverById(driver.id);

      expect(result?.code).toBeNull();
    });

    it('should handle driver with no number', async () => {
      const driver = await mockDriver.create({ number: null });

      const result = await driverService.getDriverById(driver.id);

      expect(result?.number).toBeNull();
    });

    it('should handle very long names', async () => {
      const longName = 'A'.repeat(255);
      const driver = await mockDriver.create({
        forename: longName,
        surname: longName,
      });

      const result = await driverService.getDriverById(driver.id);

      expect(result?.forename).toBe(longName);
      expect(result?.fullName).toBe(`${longName} ${longName}`);
    });

    it('should handle special characters in search', async () => {
      await mockDriver.create({
        forename: "O'Brien",
        driverRef: 'obrien',
      });

      const result = await driverService.getAllDrivers({ search: "O'Brien" });

      expect(result.drivers).toHaveLength(1);
    });

    it('should return empty results for page beyond total pages', async () => {
      await mockDriver.createBatch(5);

      const result = await driverService.getAllDrivers({ page: 10, limit: 10 });

      expect(result.drivers).toHaveLength(0);
      expect(result.meta.page).toBe(10);
      expect(result.meta.hasNext).toBe(false);
    });
  });
});
