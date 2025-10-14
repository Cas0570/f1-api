import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  cleanDatabase,
  mockRace,
  mockSeason,
  mockCircuit,
  mockDriver,
  mockTeam,
  mockRaceResult,
  mockQualifyingResult,
  mockStatus,
} from '../../helpers/testSetup';
import { raceService } from '../../../src/services/raceService';
import { cacheService } from '../../../src/services/cacheService';

describe('RaceService', () => {
  beforeEach(async () => {
    await cleanDatabase();
    cacheService.flush();
  });

  afterEach(() => {
    cacheService.flush();
  });

  describe('getAllRaces', () => {
    it('should return empty array when no races exist', async () => {
      const result = await raceService.getAllRaces({});

      expect(result.races).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    it('should return all races with default pagination', async () => {
      const season = await mockSeason.create({ year: 2024 });
      const circuit = await mockCircuit.create();

      for (let i = 1; i <= 5; i++) {
        await mockRace.create(season.id, circuit.id, { round: i });
      }

      const result = await raceService.getAllRaces({});

      expect(result.races).toHaveLength(5);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(result.meta.total).toBe(5);
    });

    it('should paginate races correctly', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();

      // Create 25 races with valid dates and unique rounds
      for (let i = 1; i <= 25; i++) {
        const month = ((i - 1) % 12) + 1; // 1-12
        const day = Math.floor((i - 1) / 12) + 1; // 1-3
        await mockRace.create(season.id, circuit.id, {
          round: i,
          date: new Date(
            `2024-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          ),
        });
      }

      // Page 1
      const page1 = await raceService.getAllRaces({ page: 1, limit: 10 });
      expect(page1.races).toHaveLength(10);
      expect(page1.meta.totalPages).toBe(3);
      expect(page1.meta.hasNext).toBe(true);

      // Page 3 (last)
      const page3 = await raceService.getAllRaces({ page: 3, limit: 10 });
      expect(page3.races).toHaveLength(5);
      expect(page3.meta.hasNext).toBe(false);
    });

    it('should sort races by date descending (most recent first)', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();

      await mockRace.create(season.id, circuit.id, {
        round: 1,
        name: 'Race 1',
        date: new Date('2024-03-01'),
      });
      await mockRace.create(season.id, circuit.id, {
        round: 2,
        name: 'Race 2',
        date: new Date('2024-05-01'),
      });
      await mockRace.create(season.id, circuit.id, {
        round: 3,
        name: 'Race 3',
        date: new Date('2024-01-01'),
      });

      const result = await raceService.getAllRaces({});

      // Most recent first
      expect(result.races[0].name).toBe('Race 2');
      expect(result.races[1].name).toBe('Race 1');
      expect(result.races[2].name).toBe('Race 3');
    });

    it('should filter by season year', async () => {
      const season2023 = await mockSeason.create({ year: 2023 });
      const season2024 = await mockSeason.create({ year: 2024 });
      const circuit = await mockCircuit.create();

      await mockRace.create(season2023.id, circuit.id, { name: '2023 Race' });
      await mockRace.create(season2024.id, circuit.id, { name: '2024 Race' });

      const result = await raceService.getAllRaces({ season: 2024 });

      expect(result.races).toHaveLength(1);
      expect(result.races[0].name).toBe('2024 Race');
      expect(result.races[0].season).toBe(2024);
    });

    it('should return empty array for non-existent season', async () => {
      const result = await raceService.getAllRaces({ season: 1949 });

      expect(result.races).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('should filter by circuit reference', async () => {
      const season = await mockSeason.create();
      const monaco = await mockCircuit.create({
        circuitRef: 'monaco',
        name: 'Monaco',
      });
      const silverstone = await mockCircuit.create({
        circuitRef: 'silverstone',
        name: 'Silverstone',
      });

      await mockRace.create(season.id, monaco.id, {
        round: 1,
        name: 'Monaco GP',
      });
      await mockRace.create(season.id, silverstone.id, {
        round: 2,
        name: 'British GP',
      });

      const result = await raceService.getAllRaces({ circuit: 'monaco' });

      expect(result.races).toHaveLength(1);
      expect(result.races[0].name).toBe('Monaco GP');
      expect(result.races[0].circuit.circuitRef).toBe('monaco');
    });

    it('should return empty array for non-existent circuit', async () => {
      const result = await raceService.getAllRaces({ circuit: 'nonexistent' });

      expect(result.races).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('should combine season and circuit filters', async () => {
      const season2023 = await mockSeason.create({ year: 2023 });
      const season2024 = await mockSeason.create({ year: 2024 });
      const monaco = await mockCircuit.create({ circuitRef: 'monaco' });
      const silverstone = await mockCircuit.create({
        circuitRef: 'silverstone',
      });

      await mockRace.create(season2023.id, monaco.id, {
        round: 1,
        name: '2023 Monaco',
      });
      await mockRace.create(season2024.id, monaco.id, {
        round: 1,
        name: '2024 Monaco',
      });
      await mockRace.create(season2024.id, silverstone.id, {
        round: 2,
        name: '2024 Silverstone',
      });

      const result = await raceService.getAllRaces({
        season: 2024,
        circuit: 'monaco',
      });

      expect(result.races).toHaveLength(1);
      expect(result.races[0].name).toBe('2024 Monaco');
    });

    it('should include circuit information in response', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create({
        name: 'Monaco',
        location: 'Monte Carlo',
        country: 'Monaco',
      });

      await mockRace.create(season.id, circuit.id);

      const result = await raceService.getAllRaces({});

      expect(result.races[0].circuit).toBeDefined();
      expect(result.races[0].circuit.name).toBe('Monaco');
      expect(result.races[0].circuit.location).toBe('Monte Carlo');
    });

    it('should handle races with time', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();

      await mockRace.create(season.id, circuit.id, {
        time: new Date('1970-01-01T14:00:00Z'),
      });

      const result = await raceService.getAllRaces({});

      expect(result.races[0].time).toBe('14:00:00');
    });

    it('should handle races without time', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();

      await mockRace.create(season.id, circuit.id, {
        time: null,
      });

      const result = await raceService.getAllRaces({});

      expect(result.races[0].time).toBeNull();
    });
  });

  describe('getRaceById', () => {
    it('should return race with basic info', async () => {
      const season = await mockSeason.create({ year: 2024 });
      const circuit = await mockCircuit.create({ name: 'Monaco' });
      const created = await mockRace.create(season.id, circuit.id, {
        name: 'Monaco Grand Prix',
        round: 8,
      });

      const race = await raceService.getRaceById(created.id);

      expect(race).toBeDefined();
      expect(race?.id).toBe(created.id);
      expect(race?.name).toBe('Monaco Grand Prix');
      expect(race?.season).toBe(2024);
      expect(race?.round).toBe(8);
      expect(race?.circuit.name).toBe('Monaco');
    });

    it('should return null for non-existent race', async () => {
      const race = await raceService.getRaceById(99999);

      expect(race).toBeNull();
    });

    it('should calculate statistics - no results', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const created = await mockRace.create(season.id, circuit.id);

      const race = await raceService.getRaceById(created.id);

      expect(race?.stats).toEqual({
        totalDrivers: 0,
        finishers: 0,
        dnfs: 0,
      });
    });

    it('should calculate statistics - with results', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);
      const team = await mockTeam.create();
      const status = await mockStatus.create();

      // Create 20 drivers, 15 finish, 5 DNF
      const drivers = await mockDriver.createBatch(20);
      for (let i = 0; i < 20; i++) {
        await mockRaceResult.create(
          race.id,
          drivers[i].id,
          team.id,
          status.id,
          {
            position: i < 15 ? i + 1 : null,
            positionText: i < 15 ? String(i + 1) : 'R',
          }
        );
      }

      const result = await raceService.getRaceById(race.id);

      expect(result?.stats).toEqual({
        totalDrivers: 20,
        finishers: 15,
        dnfs: 5,
      });
    });

    it('should cache race details', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const created = await mockRace.create(season.id, circuit.id);

      // First call
      await raceService.getRaceById(created.id);

      // Verify cache hit on second call
      const cacheStats1 = cacheService.getStats();
      const hits1 = cacheStats1.hits;

      await raceService.getRaceById(created.id);

      const cacheStats2 = cacheService.getStats();
      expect(cacheStats2.hits).toBeGreaterThan(hits1);
    });

    it('should format date as ISO string', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const created = await mockRace.create(season.id, circuit.id, {
        date: new Date('2024-05-26'),
      });

      const race = await raceService.getRaceById(created.id);

      expect(race?.date).toBe('2024-05-26');
      expect(typeof race?.date).toBe('string');
    });
  });

  describe('getRacesBySeason', () => {
    it('should return all races for a season', async () => {
      const season = await mockSeason.create({ year: 2024 });
      const circuits = await mockCircuit.createBatch(3);

      await mockRace.create(season.id, circuits[0].id, { round: 1 });
      await mockRace.create(season.id, circuits[1].id, { round: 2 });
      await mockRace.create(season.id, circuits[2].id, { round: 3 });

      const result = await raceService.getRacesBySeason(2024);

      expect(result).toBeDefined();
      expect(result?.races).toHaveLength(3);
      expect(result?.season.year).toBe(2024);
    });

    it('should return null for non-existent season', async () => {
      const result = await raceService.getRacesBySeason(1949);

      expect(result).toBeNull();
    });

    it('should sort races by round ascending', async () => {
      const season = await mockSeason.create({ year: 2024 });
      const circuit = await mockCircuit.create();

      // Create races in random order
      await mockRace.create(season.id, circuit.id, {
        round: 3,
        name: 'Round 3',
      });
      await mockRace.create(season.id, circuit.id, {
        round: 1,
        name: 'Round 1',
      });
      await mockRace.create(season.id, circuit.id, {
        round: 2,
        name: 'Round 2',
      });

      const result = await raceService.getRacesBySeason(2024);

      expect(result?.races[0].round).toBe(1);
      expect(result?.races[1].round).toBe(2);
      expect(result?.races[2].round).toBe(3);
    });

    it('should return empty array for season with no races', async () => {
      await mockSeason.create({ year: 2024 });

      const result = await raceService.getRacesBySeason(2024);

      expect(result).toBeDefined();
      expect(result?.races).toEqual([]);
    });

    it('should include circuit information', async () => {
      const season = await mockSeason.create({ year: 2024 });
      const circuit = await mockCircuit.create({
        name: 'Silverstone',
        country: 'UK',
      });

      await mockRace.create(season.id, circuit.id);

      const result = await raceService.getRacesBySeason(2024);

      expect(result?.races[0].circuit.name).toBe('Silverstone');
      expect(result?.races[0].circuit.country).toBe('UK');
    });
  });

  describe('getRaceResults', () => {
    it('should return null for non-existent race', async () => {
      const results = await raceService.getRaceResults(99999);

      expect(results).toBeNull();
    });

    it('should return empty array for race with no results', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);

      const results = await raceService.getRaceResults(race.id);

      expect(results).toEqual([]);
    });

    it('should return race results sorted by position', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);
      const team = await mockTeam.create();
      const status = await mockStatus.create();

      const drivers = await mockDriver.createBatch(3);

      // Create results in random order
      await mockRaceResult.create(race.id, drivers[2].id, team.id, status.id, {
        position: 3,
        positionText: '3',
      });
      await mockRaceResult.create(race.id, drivers[0].id, team.id, status.id, {
        position: 1,
        positionText: '1',
      });
      await mockRaceResult.create(race.id, drivers[1].id, team.id, status.id, {
        position: 2,
        positionText: '2',
      });

      const results = await raceService.getRaceResults(race.id);

      expect(results).toHaveLength(3);
      expect(results![0].position).toBe(1);
      expect(results![1].position).toBe(2);
      expect(results![2].position).toBe(3);
    });

    it('should include driver information', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);
      const driver = await mockDriver.create({
        forename: 'Lewis',
        surname: 'Hamilton',
        code: 'HAM',
        driverRef: 'hamilton',
      });
      const team = await mockTeam.create();
      const status = await mockStatus.create();

      await mockRaceResult.create(race.id, driver.id, team.id, status.id);

      const results = await raceService.getRaceResults(race.id);

      expect(results![0].driver.forename).toBe('Lewis');
      expect(results![0].driver.surname).toBe('Hamilton');
      expect(results![0].driver.code).toBe('HAM');
      expect(results![0].driver.driverRef).toBe('hamilton');
    });

    it('should include team information', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);
      const driver = await mockDriver.create();
      const team = await mockTeam.create({
        name: 'Mercedes',
        teamRef: 'mercedes',
      });
      const status = await mockStatus.create();

      await mockRaceResult.create(race.id, driver.id, team.id, status.id);

      const results = await raceService.getRaceResults(race.id);

      expect(results![0].team.name).toBe('Mercedes');
      expect(results![0].team.teamRef).toBe('mercedes');
    });

    it('should include status information', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);
      const driver = await mockDriver.create();
      const team = await mockTeam.create();
      const status = await mockStatus.create({ status: 'Finished' });

      await mockRaceResult.create(race.id, driver.id, team.id, status.id);

      const results = await raceService.getRaceResults(race.id);

      expect(results![0].status).toBe('Finished');
    });

    it('should handle DNF results with null position', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);
      const driver = await mockDriver.create();
      const team = await mockTeam.create();
      const status = await mockStatus.create({ status: 'Engine' });

      await mockRaceResult.create(race.id, driver.id, team.id, status.id, {
        position: null,
        positionText: 'R',
      });

      const results = await raceService.getRaceResults(race.id);

      expect(results![0].position).toBeNull();
      expect(results![0].positionText).toBe('R');
      expect(results![0].status).toBe('Engine');
    });

    it('should cache race results', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);

      // First call
      await raceService.getRaceResults(race.id);

      const hits1 = cacheService.getStats().hits;

      // Second call - should hit cache
      await raceService.getRaceResults(race.id);

      const hits2 = cacheService.getStats().hits;
      expect(hits2).toBeGreaterThan(hits1);
    });
  });

  describe('getQualifyingResults', () => {
    it('should return null for non-existent race', async () => {
      const results = await raceService.getQualifyingResults(99999);

      expect(results).toBeNull();
    });

    it('should return empty array for race with no qualifying', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);

      const results = await raceService.getQualifyingResults(race.id);

      expect(results).toEqual([]);
    });

    it('should return qualifying results sorted by position', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);
      const team = await mockTeam.create();

      const drivers = await mockDriver.createBatch(3);

      // Create in random order
      await mockQualifyingResult.create(race.id, drivers[2].id, team.id, {
        position: 3,
      });
      await mockQualifyingResult.create(race.id, drivers[0].id, team.id, {
        position: 1,
      });
      await mockQualifyingResult.create(race.id, drivers[1].id, team.id, {
        position: 2,
      });

      const results = await raceService.getQualifyingResults(race.id);

      expect(results).toHaveLength(3);
      expect(results![0].position).toBe(1);
      expect(results![1].position).toBe(2);
      expect(results![2].position).toBe(3);
    });

    it('should include Q1, Q2, Q3 times', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);
      const driver = await mockDriver.create();
      const team = await mockTeam.create();

      await mockQualifyingResult.create(race.id, driver.id, team.id, {
        q1Time: '1:20.123',
        q2Time: '1:19.456',
        q3Time: '1:18.789',
      });

      const results = await raceService.getQualifyingResults(race.id);

      expect(results![0].q1Time).toBe('1:20.123');
      expect(results![0].q2Time).toBe('1:19.456');
      expect(results![0].q3Time).toBe('1:18.789');
    });

    it('should handle drivers eliminated in Q1', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);
      const driver = await mockDriver.create();
      const team = await mockTeam.create();

      await mockQualifyingResult.create(race.id, driver.id, team.id, {
        position: 16,
        q1Time: '1:20.123',
        q2Time: null,
        q3Time: null,
      });

      const results = await raceService.getQualifyingResults(race.id);

      expect(results![0].q1Time).toBe('1:20.123');
      expect(results![0].q2Time).toBeNull();
      expect(results![0].q3Time).toBeNull();
    });

    it('should cache qualifying results', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);

      // First call
      await raceService.getQualifyingResults(race.id);

      const hits1 = cacheService.getStats().hits;

      // Second call
      await raceService.getQualifyingResults(race.id);

      const hits2 = cacheService.getStats().hits;
      expect(hits2).toBeGreaterThan(hits1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle race with many drivers', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);
      const team = await mockTeam.create();
      const status = await mockStatus.create();

      // 30 drivers (e.g., Indy 500 in early years)
      const drivers = await mockDriver.createBatch(30);
      for (let i = 0; i < 30; i++) {
        await mockRaceResult.create(race.id, drivers[i].id, team.id, status.id);
      }

      const results = await raceService.getRaceResults(race.id);

      expect(results).toHaveLength(30);
    });

    it('should handle race at same circuit in same season', async () => {
      const season = await mockSeason.create({ year: 2024 });
      const circuit = await mockCircuit.create({ circuitRef: 'red_bull_ring' });

      // Two races (regular + sprint race)
      await mockRace.create(season.id, circuit.id, {
        round: 1,
        name: 'Austrian Grand Prix',
      });
      await mockRace.create(season.id, circuit.id, {
        round: 2,
        name: 'Austrian Sprint',
      });

      const result = await raceService.getRacesBySeason(2024);

      expect(result?.races).toHaveLength(2);
    });

    it('should handle special characters in race names', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();

      await mockRace.create(season.id, circuit.id, {
        name: "Grand Prix de l'Azerbaïdjan",
      });

      const result = await raceService.getAllRaces({});

      expect(result.races[0].name).toBe("Grand Prix de l'Azerbaïdjan");
    });

    it('should handle race results with same position (classified)', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);
      const team = await mockTeam.create();
      const status = await mockStatus.create();

      const drivers = await mockDriver.createBatch(2);

      // Both classified in same position (rare, but possible)
      await mockRaceResult.create(race.id, drivers[0].id, team.id, status.id, {
        position: 1,
        positionText: '1',
      });
      await mockRaceResult.create(race.id, drivers[1].id, team.id, status.id, {
        position: 1,
        positionText: '1',
      });

      const results = await raceService.getRaceResults(race.id);

      expect(results).toHaveLength(2);
      expect(results![0].position).toBe(1);
      expect(results![1].position).toBe(1);
    });

    it('should handle invalid season year', async () => {
      const result = await raceService.getAllRaces({ season: -1 });
      expect(result.races).toEqual([]);
    });

    it('should handle extremely large page numbers', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      await mockRace.create(season.id, circuit.id);

      const result = await raceService.getAllRaces({ page: 999999 });
      expect(result.races).toEqual([]);
      expect(result.meta.hasNext).toBe(false);
    });
  });
});
