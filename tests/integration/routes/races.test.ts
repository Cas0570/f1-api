import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { v1Routes } from '../../../src/routes/v1/index';
import { cacheService } from '../../../src/services/cacheService';
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

const prisma = new PrismaClient();
let app: FastifyInstance;

describe('Race Routes', () => {
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

  describe('GET /api/v1/races', () => {
    it('should return empty array when no races exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/races',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(body.data).toEqual([]);
      expect(body.meta.total).toBe(0);
    });

    it('should return all races with pagination', async () => {
      const season = await mockSeason.create({ year: 2024 });
      const circuit = await mockCircuit.create();

      for (let i = 1; i <= 5; i++) {
        await mockRace.create(season.id, circuit.id, { round: i });
      }

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/races',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(body.data).toHaveLength(5);
      expect(body.meta.total).toBe(5);
      expect(body.meta.page).toBe(1);
      expect(body.meta.limit).toBe(20);
    });

    it('should paginate races correctly', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();

      // Create 25 races with unique dates
      for (let i = 1; i <= 25; i++) {
        const month = ((i - 1) % 12) + 1;
        const day = Math.floor((i - 1) / 12) + 1;
        await mockRace.create(season.id, circuit.id, {
          round: i,
          date: new Date(
            `2024-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          ),
        });
      }

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/races?page=2&limit=10',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(10);
      expect(body.meta.page).toBe(2);
      expect(body.meta.hasNext).toBe(true);
      expect(body.meta.hasPrev).toBe(true);
    });

    it('should filter by season', async () => {
      const season2023 = await mockSeason.create({ year: 2023 });
      const season2024 = await mockSeason.create({ year: 2024 });
      const circuit = await mockCircuit.create();

      await mockRace.create(season2023.id, circuit.id, {
        name: '2023 Race',
      });
      await mockRace.create(season2024.id, circuit.id, {
        name: '2024 Race',
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/races?season=2024',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].season).toBe(2024);
    });

    it('should return empty array for non-existent season', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/races?season=1949',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toEqual([]);
    });

    it('should filter by circuit', async () => {
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

      const result = await app.inject({
        method: 'GET',
        url: '/api/v1/races?circuit=monaco',
      });

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].circuit.circuitRef).toBe('monaco');
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

      const result = await app.inject({
        method: 'GET',
        url: '/api/v1/races?season=2024&circuit=monaco',
      });

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].name).toBe('2024 Monaco');
    });

    it('should return 400 for invalid page parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/races?page=invalid',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('error');
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should sort races by date descending', async () => {
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
        date: new Date('2024-06-01'),
      });
      await mockRace.create(season.id, circuit.id, {
        round: 3,
        name: 'Race 3',
        date: new Date('2024-01-01'),
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/races',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data[0].name).toBe('Race 2');
      expect(body.data[1].name).toBe('Race 1');
      expect(body.data[2].name).toBe('Race 3');
    });

    it('should include circuit information', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create({
        name: 'Monaco',
        location: 'Monte Carlo',
        country: 'Monaco',
      });

      await mockRace.create(season.id, circuit.id);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/races',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data[0].circuit).toBeDefined();
      expect(body.data[0].circuit.name).toBe('Monaco');
      expect(body.data[0].circuit.location).toBe('Monte Carlo');
    });
  });

  describe('GET /api/v1/races/season/:year', () => {
    it('should return all races for a season', async () => {
      const season = await mockSeason.create({ year: 2024 });
      const circuits = await mockCircuit.createBatch(3);

      await mockRace.create(season.id, circuits[0].id, { round: 1 });
      await mockRace.create(season.id, circuits[1].id, { round: 2 });
      await mockRace.create(season.id, circuits[2].id, { round: 3 });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/races/season/2024',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(body.data).toHaveLength(3);
      expect(body.meta.season.year).toBe(2024);
    });

    it('should return 404 for non-existent season', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/races/season/1949',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('error');
      expect(body.error.code).toBe('INVALID_YEAR');
    });

    it('should return 400 for invalid year', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/races/season/invalid',
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for year before 1950', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/races/season/1949',
      });

      expect(response.statusCode).toBe(400);
    });

    it('should sort races by round ascending', async () => {
      const season = await mockSeason.create({ year: 2024 });
      const circuit = await mockCircuit.create();

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

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/races/season/2024',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data[0].round).toBe(1);
      expect(body.data[1].round).toBe(2);
      expect(body.data[2].round).toBe(3);
    });

    it('should return empty array for season with no races', async () => {
      await mockSeason.create({ year: 2025 });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/races/season/2025',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toEqual([]);
    });

    it('should include season metadata', async () => {
      const season = await mockSeason.create({ year: 2024 });
      const circuit = await mockCircuit.create();

      await mockRace.create(season.id, circuit.id);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/races/season/2024',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.meta.season.year).toBe(2024);
      expect(body.meta.totalRaces).toBe(1);
    });
  });

  describe('GET /api/v1/races/:id', () => {
    it('should return race by ID', async () => {
      const season = await mockSeason.create({ year: 2024 });
      const circuit = await mockCircuit.create({ name: 'Monaco' });
      const created = await mockRace.create(season.id, circuit.id, {
        name: 'Monaco Grand Prix',
        round: 8,
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/races/${created.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(body.data.id).toBe(created.id);
      expect(body.data.name).toBe('Monaco Grand Prix');
      expect(body.data.stats).toBeDefined();
    });

    it('should return 404 for non-existent race', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/races/99999',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('error');
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/races/invalid',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should include statistics', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);
      const team = await mockTeam.create();
      const status = await mockStatus.create();

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

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/races/${race.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.stats.totalDrivers).toBe(20);
      expect(body.data.stats.finishers).toBe(15);
      expect(body.data.stats.dnfs).toBe(5);
    });

    it('should handle race with time', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const created = await mockRace.create(season.id, circuit.id, {
        time: new Date('1970-01-01T14:00:00Z'),
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/races/${created.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.time).toBe('14:00:00');
    });

    it('should handle race without time', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const created = await mockRace.create(season.id, circuit.id, {
        time: null,
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/races/${created.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.time).toBeNull();
    });
  });

  describe('GET /api/v1/races/:id/results', () => {
    it('should return race results sorted by position', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);
      const team = await mockTeam.create();
      const status = await mockStatus.create();

      const drivers = await mockDriver.createBatch(3);

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

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/races/${race.id}/results`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(body.data).toHaveLength(3);
      expect(body.data[0].position).toBe(1);
      expect(body.data[1].position).toBe(2);
      expect(body.data[2].position).toBe(3);
    });

    it('should return 404 for non-existent race', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/races/99999/results',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return empty array for race with no results', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/races/${race.id}/results`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toEqual([]);
    });

    it('should include driver information', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);
      const driver = await mockDriver.create({
        forename: 'Lewis',
        surname: 'Hamilton',
        code: 'HAM',
      });
      const team = await mockTeam.create();
      const status = await mockStatus.create();

      await mockRaceResult.create(race.id, driver.id, team.id, status.id);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/races/${race.id}/results`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data[0].driver.forename).toBe('Lewis');
      expect(body.data[0].driver.surname).toBe('Hamilton');
      expect(body.data[0].driver.code).toBe('HAM');
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

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/races/${race.id}/results`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data[0].team.name).toBe('Mercedes');
      expect(body.data[0].team.teamRef).toBe('mercedes');
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

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/races/${race.id}/results`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data[0].position).toBeNull();
      expect(body.data[0].positionText).toBe('R');
      expect(body.data[0].status).toBe('Engine');
    });
  });

  describe('GET /api/v1/races/:id/qualifying', () => {
    it('should return qualifying results sorted by position', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);
      const team = await mockTeam.create();

      const drivers = await mockDriver.createBatch(3);

      await mockQualifyingResult.create(race.id, drivers[2].id, team.id, {
        position: 3,
      });
      await mockQualifyingResult.create(race.id, drivers[0].id, team.id, {
        position: 1,
      });
      await mockQualifyingResult.create(race.id, drivers[1].id, team.id, {
        position: 2,
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/races/${race.id}/qualifying`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(body.data).toHaveLength(3);
      expect(body.data[0].position).toBe(1);
      expect(body.data[1].position).toBe(2);
      expect(body.data[2].position).toBe(3);
    });

    it('should return 404 for non-existent race', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/races/99999/qualifying',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return empty array for race with no qualifying', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/races/${race.id}/qualifying`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toEqual([]);
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

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/races/${race.id}/qualifying`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data[0].q1Time).toBe('1:20.123');
      expect(body.data[0].q2Time).toBe('1:19.456');
      expect(body.data[0].q3Time).toBe('1:18.789');
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

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/races/${race.id}/qualifying`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data[0].q1Time).toBe('1:20.123');
      expect(body.data[0].q2Time).toBeNull();
      expect(body.data[0].q3Time).toBeNull();
    });

    it('should include driver and team information', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);
      const driver = await mockDriver.create({
        forename: 'Lewis',
        surname: 'Hamilton',
        code: 'HAM',
      });
      const team = await mockTeam.create({
        name: 'Mercedes',
        teamRef: 'mercedes',
      });

      await mockQualifyingResult.create(race.id, driver.id, team.id, {
        position: 1,
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/races/${race.id}/qualifying`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data[0].driver.forename).toBe('Lewis');
      expect(body.data[0].driver.surname).toBe('Hamilton');
      expect(body.data[0].team.name).toBe('Mercedes');
    });
  });

  describe('Edge Cases', () => {
    it('should handle race with many drivers', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);
      const team = await mockTeam.create();
      const status = await mockStatus.create();

      const drivers = await mockDriver.createBatch(30);
      for (let i = 0; i < 30; i++) {
        await mockRaceResult.create(race.id, drivers[i].id, team.id, status.id);
      }

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/races/${race.id}/results`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(30);
    });

    it('should handle special characters in race names', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();

      await mockRace.create(season.id, circuit.id, {
        name: "Grand Prix de l'Azerbaïdjan",
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/races',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data[0].name).toBe("Grand Prix de l'Azerbaïdjan");
    });
  });
});
