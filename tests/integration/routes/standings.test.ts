import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { v1Routes } from '../../../src/routes/v1/index';
import { cacheService } from '../../../src/services/cacheService';
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

const prisma = new PrismaClient();
let app: FastifyInstance;

describe('Standings Routes', () => {
  beforeAll(async () => {
    app = Fastify();
    await app.register(v1Routes, { prefix: '/api/v1' });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanDatabase();
    cacheService.flush();
  });

  describe('GET /api/v1/standings/drivers', () => {
    it('should return latest driver standings', async () => {
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

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(body.data).toHaveLength(2);
      expect(body.data[0].position).toBe(1);
      expect(body.data[0].points).toBe(100);
      expect(body.data[1].position).toBe(2);
      expect(body.meta.season).toBe(2024);
    });

    it('should return 404 when no standings exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('error');
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return final standings for specific season', async () => {
      const season2023 = await mockSeason.create({ year: 2023 });
      const season2024 = await mockSeason.create({ year: 2024 });
      const circuit = await mockCircuit.create();

      // 2023 final race
      const race2023 = await mockRace.create(season2023.id, circuit.id, {
        round: 22,
        name: '2023 Final',
        date: new Date('2023-12-01'),
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
        date: new Date('2024-12-01'),
      });
      await mockDriverStanding.create(race2024.id, driver1.id, {
        position: 2,
        points: 450,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers?season=2023',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.meta.season).toBe(2023);
      expect(body.data[0].points).toBe(500);
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

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers?season=2024&round=5',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data[0].points).toBe(125);
      expect(body.data[0].wins).toBe(5);
      expect(body.meta.round).toBe(5);
      expect(body.meta.raceName).toBe('Round 5');
    });

    it('should return 404 for non-existent season', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers?season=1949',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return 404 for non-existent round', async () => {
      await mockSeason.create({ year: 2024 });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers?season=2024&round=99',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 when round provided without season', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers?round=5',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid season parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers?season=invalid',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid round parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers?season=2024&round=invalid',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
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

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data[0].position).toBe(1);
      expect(body.data[1].position).toBe(2);
      expect(body.data[2].position).toBe(3);
      expect(body.data[3].position).toBe(4);
      expect(body.data[4].position).toBe(5);
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

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data[0].driver.driverRef).toBe('hamilton');
      expect(body.data[0].driver.forename).toBe('Lewis');
      expect(body.data[0].driver.surname).toBe('Hamilton');
      expect(body.data[0].driver.code).toBe('HAM');
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

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers?season=2024',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.meta.season).toBe(2024);
      expect(body.meta.round).toBe(10);
      expect(body.meta.raceName).toBe('British Grand Prix');
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

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(22);
      expect(body.data[0].position).toBe(1);
      expect(body.data[21].position).toBe(22);
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

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data[0].points).toBe(0);
      expect(body.data[0].wins).toBe(0);
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

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers?season=1950',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.meta.season).toBe(1950);
      expect(body.data[0].points).toBe(8);
    });
  });

  describe('GET /api/v1/standings/constructors', () => {
    it('should return latest constructor standings', async () => {
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

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/standings/constructors',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(body.data).toHaveLength(2);
      expect(body.data[0].position).toBe(1);
      expect(body.data[0].points).toBe(200);
      expect(body.data[1].position).toBe(2);
      expect(body.meta.season).toBe(2024);
    });

    it('should return 404 when no standings exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/standings/constructors',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return final standings for specific season', async () => {
      const season2023 = await mockSeason.create({ year: 2023 });
      const season2024 = await mockSeason.create({ year: 2024 });
      const circuit = await mockCircuit.create();

      const team = await mockTeam.create();

      // 2023 final
      const race2023 = await mockRace.create(season2023.id, circuit.id, {
        round: 22,
        date: new Date('2023-12-01'),
      });
      await mockConstructorStanding.create(race2023.id, team.id, {
        position: 1,
        points: 800,
      });

      // 2024 final
      const race2024 = await mockRace.create(season2024.id, circuit.id, {
        round: 24,
        date: new Date('2024-12-01'),
      });
      await mockConstructorStanding.create(race2024.id, team.id, {
        position: 2,
        points: 750,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/standings/constructors?season=2023',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.meta.season).toBe(2023);
      expect(body.data[0].points).toBe(800);
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

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/standings/constructors?season=2024&round=5',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data[0].points).toBe(250);
      expect(body.data[0].wins).toBe(5);
      expect(body.meta.round).toBe(5);
    });

    it('should return 404 for non-existent season', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/standings/constructors?season=1949',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return 404 for non-existent round', async () => {
      await mockSeason.create({ year: 2024 });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/standings/constructors?season=2024&round=99',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 when round provided without season', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/standings/constructors?round=5',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
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

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/standings/constructors',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data[0].position).toBe(1);
      expect(body.data[1].position).toBe(2);
      expect(body.data[2].position).toBe(3);
      expect(body.data[3].position).toBe(4);
      expect(body.data[4].position).toBe(5);
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

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/standings/constructors',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data[0].team.teamRef).toBe('mercedes');
      expect(body.data[0].team.name).toBe('Mercedes-AMG Petronas');
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

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/standings/constructors',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(12);
      expect(body.data[0].position).toBe(1);
      expect(body.data[11].position).toBe(12);
    });

    it('should handle standings with zero points', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);
      const team = await mockTeam.create();

      await mockConstructorStanding.create(race.id, team.id, {
        position: 10,
        points: 0,
        wins: 0,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/standings/constructors',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data[0].points).toBe(0);
      expect(body.data[0].wins).toBe(0);
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

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers?season=2024',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data[0].points).toBe(25);
      expect(body.meta.round).toBe(1);
    });

    it('should handle tied positions in driver standings', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);

      const drivers = await mockDriver.createBatch(2);

      await mockDriverStanding.create(race.id, drivers[0].id, {
        position: 1,
        points: 100,
      });
      await mockDriverStanding.create(race.id, drivers[1].id, {
        position: 1,
        points: 100,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(2);
      expect(body.data[0].position).toBe(1);
      expect(body.data[1].position).toBe(1);
    });

    it('should handle tied positions in constructor standings', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);

      const teams = await mockTeam.createBatch(2);

      await mockConstructorStanding.create(race.id, teams[0].id, {
        position: 1,
        points: 200,
      });
      await mockConstructorStanding.create(race.id, teams[1].id, {
        position: 1,
        points: 200,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/standings/constructors',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(2);
      expect(body.data[0].position).toBe(1);
      expect(body.data[1].position).toBe(1);
    });

    it('should get latest standings across all seasons when no params', async () => {
      const season2023 = await mockSeason.create({ year: 2023 });
      const season2024 = await mockSeason.create({ year: 2024 });
      const circuit = await mockCircuit.create();

      const driver = await mockDriver.create();

      // 2023 race (earlier date)
      const race2023 = await mockRace.create(season2023.id, circuit.id, {
        date: new Date('2023-12-01'),
      });
      await mockDriverStanding.create(race2023.id, driver.id, { points: 100 });

      // 2024 race (later date)
      const race2024 = await mockRace.create(season2024.id, circuit.id, {
        date: new Date('2024-12-01'),
      });
      await mockDriverStanding.create(race2024.id, driver.id, { points: 200 });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      // Should get the most recent one (2024)
      expect(body.data[0].points).toBe(200);
      expect(body.meta.season).toBe(2024);
    });
  });
});
