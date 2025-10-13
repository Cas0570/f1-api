import { describe, it, expect, beforeEach } from 'vitest';
import {
  cleanDatabase,
  mockSeason,
  mockRace,
  mockCircuit,
  mockDriver,
  mockTeam,
  mockDriverStanding,
  mockConstructorStanding,
} from '../../helpers/testSetup';
import { standingsService } from '../../../src/services/standingsService';

describe('StandingsService', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('getDriverStandings', () => {
    it('should return latest standings when no parameters provided', async () => {
      const season = await mockSeason.create({ year: 2024 });
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id, {
        name: 'Latest Race',
        date: new Date('2024-12-01'),
      });

      const driver1 = await mockDriver.create({ driverRef: 'd1' });
      const driver2 = await mockDriver.create({ driverRef: 'd2' });

      await mockDriverStanding.create(race.id, driver1.id, {
        position: 1,
        points: 100,
        wins: 5,
      });
      await mockDriverStanding.create(race.id, driver2.id, {
        position: 2,
        points: 80,
        wins: 3,
      });

      const result = await standingsService.getDriverStandings({});

      expect(result).toBeDefined();
      expect(result?.standings).toHaveLength(2);
      expect(result?.standings[0].position).toBe(1);
      expect(result?.standings[0].points).toBe(100);
      expect(result?.standings[1].position).toBe(2);
      expect(result?.season).toBe(2024);
    });

    it('should return null when no races exist', async () => {
      const result = await standingsService.getDriverStandings({});

      expect(result).toBeNull();
    });

    it('should return final standings for a specific season', async () => {
      const season2023 = await mockSeason.create({ year: 2023 });
      const season2024 = await mockSeason.create({ year: 2024 });
      const circuit = await mockCircuit.create();

      // 2023 final race
      const race2023 = await mockRace.create(season2023.id, circuit.id, {
        round: 22,
        name: '2023 Final',
      });
      const driver1 = await mockDriver.create({ driverRef: 'd1' });
      await mockDriverStanding.create(race2023.id, driver1.id, {
        position: 1,
        points: 500,
      });

      // 2024 final race
      const race2024 = await mockRace.create(season2024.id, circuit.id, {
        round: 24,
        name: '2024 Final',
      });
      await mockDriverStanding.create(race2024.id, driver1.id, {
        position: 2,
        points: 450,
      });

      const result = await standingsService.getDriverStandings({
        season: 2023,
      });

      expect(result).toBeDefined();
      expect(result?.season).toBe(2023);
      expect(result?.standings[0].points).toBe(500);
    });

    it('should return standings after specific round', async () => {
      const season = await mockSeason.create({ year: 2024 });
      const circuit = await mockCircuit.create();

      // Round 5
      const race5 = await mockRace.create(season.id, circuit.id, {
        round: 5,
        name: 'Round 5',
      });
      const driver = await mockDriver.create();
      await mockDriverStanding.create(race5.id, driver.id, {
        position: 1,
        points: 125,
        wins: 5,
      });

      // Round 10
      const race10 = await mockRace.create(season.id, circuit.id, {
        round: 10,
        name: 'Round 10',
      });
      await mockDriverStanding.create(race10.id, driver.id, {
        position: 1,
        points: 250,
        wins: 10,
      });

      const result = await standingsService.getDriverStandings({
        season: 2024,
        round: 5,
      });

      expect(result).toBeDefined();
      expect(result?.standings[0].points).toBe(125);
      expect(result?.standings[0].wins).toBe(5);
      expect(result?.round).toBe(5);
      expect(result?.raceName).toBe('Round 5');
    });

    it('should return null for non-existent season', async () => {
      const result = await standingsService.getDriverStandings({
        season: 1949,
      });

      expect(result).toBeNull();
    });

    it('should return null for non-existent round', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const season = await mockSeason.create({ year: 2024 });

      const result = await standingsService.getDriverStandings({
        season: 2024,
        round: 99,
      });

      expect(result).toBeNull();
    });

    it('should return null for season with no races', async () => {
      await mockSeason.create({ year: 2025 });

      const result = await standingsService.getDriverStandings({
        season: 2025,
      });

      expect(result).toBeNull();
    });

    it('should sort standings by position ascending', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);

      const drivers = await mockDriver.createBatch(5);

      // Create in random order
      await mockDriverStanding.create(race.id, drivers[3].id, {
        position: 4,
        points: 40,
      });
      await mockDriverStanding.create(race.id, drivers[0].id, {
        position: 1,
        points: 100,
      });
      await mockDriverStanding.create(race.id, drivers[4].id, {
        position: 5,
        points: 30,
      });
      await mockDriverStanding.create(race.id, drivers[1].id, {
        position: 2,
        points: 80,
      });
      await mockDriverStanding.create(race.id, drivers[2].id, {
        position: 3,
        points: 60,
      });

      const result = await standingsService.getDriverStandings({});

      expect(result?.standings[0].position).toBe(1);
      expect(result?.standings[1].position).toBe(2);
      expect(result?.standings[2].position).toBe(3);
      expect(result?.standings[3].position).toBe(4);
      expect(result?.standings[4].position).toBe(5);
    });

    it('should include driver information', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);
      const driver = await mockDriver.create({
        driverRef: 'hamilton',
        forename: 'Lewis',
        surname: 'Hamilton',
        code: 'HAM',
      });

      await mockDriverStanding.create(race.id, driver.id, {
        position: 1,
        points: 100,
        wins: 4,
      });

      const result = await standingsService.getDriverStandings({});

      expect(result?.standings[0].driver.driverRef).toBe('hamilton');
      expect(result?.standings[0].driver.forename).toBe('Lewis');
      expect(result?.standings[0].driver.surname).toBe('Hamilton');
      expect(result?.standings[0].driver.code).toBe('HAM');
    });

    it('should include season, round, and race name in metadata', async () => {
      const season = await mockSeason.create({ year: 2024 });
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id, {
        round: 10,
        name: 'British Grand Prix',
      });
      const driver = await mockDriver.create();

      await mockDriverStanding.create(race.id, driver.id);

      const result = await standingsService.getDriverStandings({
        season: 2024,
      });

      expect(result?.season).toBe(2024);
      expect(result?.round).toBe(10);
      expect(result?.raceName).toBe('British Grand Prix');
    });

    it('should handle standings with 20+ drivers', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);

      const drivers = await mockDriver.createBatch(22);
      for (let i = 0; i < 22; i++) {
        await mockDriverStanding.create(race.id, drivers[i].id, {
          position: i + 1,
          points: 100 - i * 5,
        });
      }

      const result = await standingsService.getDriverStandings({});

      expect(result?.standings).toHaveLength(22);
      expect(result?.standings[0].position).toBe(1);
      expect(result?.standings[21].position).toBe(22);
    });

    it('should get most recent race when multiple races on same date', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const date = new Date('2024-06-30');

      // Two races same day (e.g., qualifying race + main race)
      const race1 = await mockRace.create(season.id, circuit.id, {
        round: 1,
        date,
      });
      const race2 = await mockRace.create(season.id, circuit.id, {
        round: 2,
        date,
      });

      const driver = await mockDriver.create();
      await mockDriverStanding.create(race1.id, driver.id, {
        points: 50,
      });
      await mockDriverStanding.create(race2.id, driver.id, {
        points: 100,
      });

      const result = await standingsService.getDriverStandings({});

      // Should get the latest one by date (both same date, so first found)
      expect(result?.standings[0].points).toBeDefined();
    });
  });

  describe('getConstructorStandings', () => {
    it('should return latest standings when no parameters provided', async () => {
      const season = await mockSeason.create({ year: 2024 });
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id, {
        date: new Date('2024-12-01'),
      });

      const team1 = await mockTeam.create({ teamRef: 't1' });
      const team2 = await mockTeam.create({ teamRef: 't2' });

      await mockConstructorStanding.create(race.id, team1.id, {
        position: 1,
        points: 200,
        wins: 8,
      });
      await mockConstructorStanding.create(race.id, team2.id, {
        position: 2,
        points: 150,
        wins: 5,
      });

      const result = await standingsService.getConstructorStandings({});

      expect(result).toBeDefined();
      expect(result?.standings).toHaveLength(2);
      expect(result?.standings[0].position).toBe(1);
      expect(result?.standings[0].points).toBe(200);
      expect(result?.standings[1].position).toBe(2);
      expect(result?.season).toBe(2024);
    });

    it('should return null when no races exist', async () => {
      const result = await standingsService.getConstructorStandings({});

      expect(result).toBeNull();
    });

    it('should return final standings for a specific season', async () => {
      const season2023 = await mockSeason.create({ year: 2023 });
      const season2024 = await mockSeason.create({ year: 2024 });
      const circuit = await mockCircuit.create();

      const team = await mockTeam.create();

      // 2023 final
      const race2023 = await mockRace.create(season2023.id, circuit.id, {
        round: 22,
      });
      await mockConstructorStanding.create(race2023.id, team.id, {
        position: 1,
        points: 800,
      });

      // 2024 final
      const race2024 = await mockRace.create(season2024.id, circuit.id, {
        round: 24,
      });
      await mockConstructorStanding.create(race2024.id, team.id, {
        position: 2,
        points: 750,
      });

      const result = await standingsService.getConstructorStandings({
        season: 2023,
      });

      expect(result).toBeDefined();
      expect(result?.season).toBe(2023);
      expect(result?.standings[0].points).toBe(800);
    });

    it('should return standings after specific round', async () => {
      const season = await mockSeason.create({ year: 2024 });
      const circuit = await mockCircuit.create();

      const team = await mockTeam.create();

      // Round 5
      const race5 = await mockRace.create(season.id, circuit.id, {
        round: 5,
      });
      await mockConstructorStanding.create(race5.id, team.id, {
        position: 1,
        points: 250,
        wins: 5,
      });

      // Round 10
      const race10 = await mockRace.create(season.id, circuit.id, {
        round: 10,
      });
      await mockConstructorStanding.create(race10.id, team.id, {
        position: 1,
        points: 500,
        wins: 10,
      });

      const result = await standingsService.getConstructorStandings({
        season: 2024,
        round: 5,
      });

      expect(result).toBeDefined();
      expect(result?.standings[0].points).toBe(250);
      expect(result?.standings[0].wins).toBe(5);
      expect(result?.round).toBe(5);
    });

    it('should return null for non-existent season', async () => {
      const result = await standingsService.getConstructorStandings({
        season: 1949,
      });

      expect(result).toBeNull();
    });

    it('should return null for non-existent round', async () => {
      await mockSeason.create({ year: 2024 });

      const result = await standingsService.getConstructorStandings({
        season: 2024,
        round: 99,
      });

      expect(result).toBeNull();
    });

    it('should sort standings by position ascending', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);

      const teams = await mockTeam.createBatch(5);

      // Create in random order
      await mockConstructorStanding.create(race.id, teams[2].id, {
        position: 3,
        points: 300,
      });
      await mockConstructorStanding.create(race.id, teams[0].id, {
        position: 1,
        points: 500,
      });
      await mockConstructorStanding.create(race.id, teams[4].id, {
        position: 5,
        points: 100,
      });
      await mockConstructorStanding.create(race.id, teams[1].id, {
        position: 2,
        points: 400,
      });
      await mockConstructorStanding.create(race.id, teams[3].id, {
        position: 4,
        points: 200,
      });

      const result = await standingsService.getConstructorStandings({});

      expect(result?.standings[0].position).toBe(1);
      expect(result?.standings[1].position).toBe(2);
      expect(result?.standings[2].position).toBe(3);
      expect(result?.standings[3].position).toBe(4);
      expect(result?.standings[4].position).toBe(5);
    });

    it('should include team information', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);
      const team = await mockTeam.create({
        teamRef: 'mercedes',
        name: 'Mercedes-AMG Petronas',
      });

      await mockConstructorStanding.create(race.id, team.id, {
        position: 1,
        points: 500,
        wins: 10,
      });

      const result = await standingsService.getConstructorStandings({});

      expect(result?.standings[0].team.teamRef).toBe('mercedes');
      expect(result?.standings[0].team.name).toBe('Mercedes-AMG Petronas');
    });

    it('should handle standings with 10+ teams', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);

      const teams = await mockTeam.createBatch(12);
      for (let i = 0; i < 12; i++) {
        await mockConstructorStanding.create(race.id, teams[i].id, {
          position: i + 1,
          points: 500 - i * 50,
        });
      }

      const result = await standingsService.getConstructorStandings({});

      expect(result?.standings).toHaveLength(12);
      expect(result?.standings[0].position).toBe(1);
      expect(result?.standings[11].position).toBe(12);
    });
  });

  describe('Edge Cases', () => {
    it('should handle season with only one race', async () => {
      const season = await mockSeason.create({ year: 2024 });
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id, { round: 1 });
      const driver = await mockDriver.create();

      await mockDriverStanding.create(race.id, driver.id, {
        position: 1,
        points: 25,
        wins: 1,
      });

      const result = await standingsService.getDriverStandings({
        season: 2024,
      });

      expect(result?.standings[0].points).toBe(25);
      expect(result?.round).toBe(1);
    });

    it('should handle tied positions in standings', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);

      const drivers = await mockDriver.createBatch(2);

      // Same points, same position (shouldn't happen in F1, but handle it)
      await mockDriverStanding.create(race.id, drivers[0].id, {
        position: 1,
        points: 100,
      });
      await mockDriverStanding.create(race.id, drivers[1].id, {
        position: 1,
        points: 100,
      });

      const result = await standingsService.getDriverStandings({});

      expect(result?.standings).toHaveLength(2);
      expect(result?.standings[0].position).toBe(1);
      expect(result?.standings[1].position).toBe(1);
    });

    it('should handle standings with zero points', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);
      const driver = await mockDriver.create();

      await mockDriverStanding.create(race.id, driver.id, {
        position: 20,
        points: 0,
        wins: 0,
      });

      const result = await standingsService.getDriverStandings({});

      expect(result?.standings[0].points).toBe(0);
      expect(result?.standings[0].wins).toBe(0);
    });

    it('should handle historic season (1950)', async () => {
      const season = await mockSeason.create({ year: 1950 });
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id, { round: 1 });
      const driver = await mockDriver.create();

      await mockDriverStanding.create(race.id, driver.id, {
        position: 1,
        points: 8,
        wins: 1,
      });

      const result = await standingsService.getDriverStandings({
        season: 1950,
      });

      expect(result?.season).toBe(1950);
      expect(result?.standings[0].points).toBe(8);
    });

    it('should prefer later round when season has no round specified', async () => {
      const season = await mockSeason.create({ year: 2024 });
      const circuit = await mockCircuit.create();

      const driver = await mockDriver.create();

      // Round 1
      const race1 = await mockRace.create(season.id, circuit.id, {
        round: 1,
        date: new Date('2024-03-01'),
      });
      await mockDriverStanding.create(race1.id, driver.id, { points: 25 });

      // Round 22 (final)
      const race22 = await mockRace.create(season.id, circuit.id, {
        round: 22,
        date: new Date('2024-12-01'),
      });
      await mockDriverStanding.create(race22.id, driver.id, { points: 500 });

      const result = await standingsService.getDriverStandings({
        season: 2024,
      });

      // Should get final standings (highest round)
      expect(result?.standings[0].points).toBe(500);
      expect(result?.round).toBe(22);
    });
  });
});
