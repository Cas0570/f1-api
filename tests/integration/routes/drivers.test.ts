import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { v1Routes } from '../../../src/routes/v1/index';
import { cacheService } from '../../../src/services/cacheService';
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
} from '../../helpers/testSetup';

const prisma = new PrismaClient();
let app: FastifyInstance;

describe('Driver Routes', () => {
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
    cacheService.flush(); // Clear cache before each test
  });

  describe('GET /api/v1/drivers', () => {
    it('should return empty array when no drivers exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/drivers',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(body.data).toEqual([]);
      expect(body.meta.total).toBe(0);
    });

    it('should return all drivers with pagination', async () => {
      await mockDriver.createBatch(5);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/drivers',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(body.data).toHaveLength(5);
      expect(body.meta.total).toBe(5);
      expect(body.meta.page).toBe(1);
      expect(body.meta.limit).toBe(20);
    });

    it('should paginate drivers correctly', async () => {
      await mockDriver.createBatch(25);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/drivers?page=2&limit=10',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(10);
      expect(body.meta.page).toBe(2);
      expect(body.meta.hasNext).toBe(true);
      expect(body.meta.hasPrev).toBe(true);
    });

    it('should filter by nationality', async () => {
      await mockDriver.create({ nationality: 'British', driverRef: 'brit1' });
      await mockDriver.create({ nationality: 'British', driverRef: 'brit2' });
      await mockDriver.create({ nationality: 'German', driverRef: 'ger1' });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/drivers?nationality=British',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(2);
      body.data.forEach((driver: any) => {
        expect(driver.nationality).toBe('British');
      });
    });

    it('should search by name', async () => {
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

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/drivers?search=Hamilton',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].surname).toBe('Hamilton');
    });

    it('should return 400 for invalid page parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/drivers?page=invalid',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('error');
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid limit parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/drivers?limit=abc',
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/v1/drivers/:id', () => {
    it('should return driver by ID', async () => {
      const driver = await mockDriver.create({
        forename: 'Lewis',
        surname: 'Hamilton',
        code: 'HAM',
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/drivers/${driver.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(body.data.id).toBe(driver.id);
      expect(body.data.forename).toBe('Lewis');
      expect(body.data.surname).toBe('Hamilton');
      expect(body.data.stats).toBeDefined();
    });

    it('should return 404 for non-existent driver', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/drivers/99999',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('error');
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/drivers/invalid',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return driver with statistics', async () => {
      const driver = await mockDriver.create();
      const team = await mockTeam.create();
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const status = await mockStatus.create();

      // Create a win
      const race = await mockRace.create(season.id, circuit.id);
      await mockRaceResult.create(race.id, driver.id, team.id, status.id, {
        position: 1,
        points: 25,
      });

      // Create a pole
      await mockQualifyingResult.create(race.id, driver.id, team.id, {
        position: 1,
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/drivers/${driver.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.stats.races).toBe(1);
      expect(body.data.stats.wins).toBe(1);
      expect(body.data.stats.poles).toBe(1);
    });
  });

  describe('GET /api/v1/drivers/ref/:ref', () => {
    it('should return driver by reference', async () => {
      await mockDriver.create({
        driverRef: 'hamilton',
        forename: 'Lewis',
        surname: 'Hamilton',
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/drivers/ref/hamilton',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(body.data.driverRef).toBe('hamilton');
      expect(body.data.forename).toBe('Lewis');
    });

    it('should return 404 for non-existent reference', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/drivers/ref/nonexistent',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for empty reference', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/drivers/ref/',
      });

      // Empty ref returns 400 from validation
      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/v1/drivers/nationalities', () => {
    it('should return empty array when no drivers exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/drivers/nationalities',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(body.data).toEqual([]);
    });

    it('should return unique nationalities sorted', async () => {
      await mockDriver.create({ nationality: 'British', driverRef: 'd1' });
      await mockDriver.create({ nationality: 'German', driverRef: 'd2' });
      await mockDriver.create({ nationality: 'British', driverRef: 'd3' }); // Duplicate

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/drivers/nationalities',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(2);
      expect(body.data).toContain('British');
      expect(body.data).toContain('German');
    });
  });
});
