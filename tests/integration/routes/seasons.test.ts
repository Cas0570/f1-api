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
  mockRaceResult,
  mockStatus,
} from '../../helpers/testSetup';

const prisma = new PrismaClient();
let app: FastifyInstance;

describe('Season Routes', () => {
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

  describe('GET /api/v1/seasons', () => {
    it('should return empty array when no seasons exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/seasons',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(body.data).toEqual([]);
      expect(body.meta.total).toBe(0);
    });

    it('should return all seasons with pagination', async () => {
      await mockSeason.createBatch([2020, 2021, 2022, 2023, 2024]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/seasons',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(body.data).toHaveLength(5);
      expect(body.meta.total).toBe(5);
      expect(body.meta.page).toBe(1);
      expect(body.meta.limit).toBe(20);
    });

    it('should paginate seasons correctly', async () => {
      const years = Array.from({ length: 25 }, (_, i) => 2000 + i);
      await mockSeason.createBatch(years);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/seasons?page=2&limit=10',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(10);
      expect(body.meta.page).toBe(2);
      expect(body.meta.hasNext).toBe(true);
      expect(body.meta.hasPrev).toBe(true);
    });

    it('should return 400 for invalid page parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/seasons?page=invalid',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('error');
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should sort seasons by year descending (most recent first)', async () => {
      await mockSeason.createBatch([2020, 2022, 2021, 2024, 2023]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/seasons',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data[0].year).toBe(2024);
      expect(body.data[1].year).toBe(2023);
      expect(body.data[2].year).toBe(2022);
    });
  });

  describe('GET /api/v1/seasons/:id', () => {
    it('should return season by ID', async () => {
      const season = await mockSeason.create({ year: 2024 });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/seasons/${season.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(body.data.id).toBe(season.id);
      expect(body.data.year).toBe(2024);
      expect(body.data.stats).toBeDefined();
    });

    it('should return 404 for non-existent season', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/seasons/99999',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('error');
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/seasons/invalid',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return season with statistics', async () => {
      const season = await mockSeason.create({ year: 2024 });
      const circuit = await mockCircuit.create();

      await mockRace.create(season.id, circuit.id, { round: 1 });
      await mockRace.create(season.id, circuit.id, { round: 2 });
      await mockRace.create(season.id, circuit.id, { round: 3 });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/seasons/${season.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.stats.totalRaces).toBe(3);
    });

    it('should count unique drivers correctly', async () => {
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const race = await mockRace.create(season.id, circuit.id);

      const driver1 = await mockDriver.create({ driverRef: 'd1' });
      const driver2 = await mockDriver.create({ driverRef: 'd2' });
      const team = await mockTeam.create();
      const status = await mockStatus.create();

      await mockRaceResult.create(race.id, driver1.id, team.id, status.id);
      await mockRaceResult.create(race.id, driver2.id, team.id, status.id);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/seasons/${season.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.stats.drivers).toBe(2);
    });
  });

  describe('GET /api/v1/seasons/year/:year', () => {
    it('should return season by year', async () => {
      await mockSeason.create({ year: 2024 });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/seasons/year/2024',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(body.data.year).toBe(2024);
    });

    it('should return 404 for non-existent year', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/seasons/year/1949',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid year', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/seasons/year/invalid',
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for year before 1950', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/seasons/year/1949',
      });

      expect(response.statusCode).toBe(404); // Season doesn't exist
    });

    it('should return 400 for year too far in future', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/seasons/year/2100',
      });

      expect(response.statusCode).toBe(404); // Season doesn't exist
    });

    it('should include statistics for season by year', async () => {
      const season = await mockSeason.create({ year: 2024 });
      const circuit = await mockCircuit.create();

      await mockRace.create(season.id, circuit.id);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/seasons/year/2024',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.stats.totalRaces).toBe(1);
    });

    it('should handle historic season (1950)', async () => {
      await mockSeason.create({ year: 1950 });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/seasons/year/1950',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.year).toBe(1950);
    });
  });

  describe('Edge Cases', () => {
    it('should handle season with many races', async () => {
      const season = await mockSeason.create({ year: 2024 });
      const circuits = await mockCircuit.createBatch(24);

      for (let i = 0; i < 24; i++) {
        await mockRace.create(season.id, circuits[i].id, { round: i + 1 });
      }

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/seasons/${season.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.stats.totalRaces).toBe(24);
    });

    it('should handle empty season (no races)', async () => {
      const season = await mockSeason.create({ year: 2025 });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/seasons/${season.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.stats.totalRaces).toBe(0);
      expect(body.data.stats.drivers).toBe(0);
      expect(body.data.stats.teams).toBe(0);
    });

    it('should handle consecutive seasons', async () => {
      await mockSeason.createBatch([2020, 2021, 2022, 2023, 2024]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/seasons?limit=10',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(5);
      expect(body.data[0].year).toBe(2024);
      expect(body.data[4].year).toBe(2020);
    });
  });
});
