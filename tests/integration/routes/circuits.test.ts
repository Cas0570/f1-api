import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { v1Routes } from '../../../src/routes/v1/index';
import { cacheService } from '../../../src/services/cacheService';
import {
  cleanDatabase,
  mockCircuit,
  mockRace,
  mockSeason,
} from '../../helpers/testSetup';

const prisma = new PrismaClient();
let app: FastifyInstance;

describe('Circuit Routes', () => {
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

  describe('GET /api/v1/circuits', () => {
    it('should return empty array when no circuits exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/circuits',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(body.data).toEqual([]);
      expect(body.meta.total).toBe(0);
    });

    it('should return all circuits with pagination', async () => {
      await mockCircuit.createBatch(5);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/circuits',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(body.data).toHaveLength(5);
      expect(body.meta.total).toBe(5);
      expect(body.meta.page).toBe(1);
      expect(body.meta.limit).toBe(20);
    });

    it('should paginate circuits correctly', async () => {
      await mockCircuit.createBatch(25);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/circuits?page=2&limit=10',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(10);
      expect(body.meta.page).toBe(2);
      expect(body.meta.hasNext).toBe(true);
      expect(body.meta.hasPrev).toBe(true);
    });

    it('should filter by country', async () => {
      await mockCircuit.create({
        country: 'Italy',
        circuitRef: 'monza',
        name: 'Monza',
      });
      await mockCircuit.create({
        country: 'Italy',
        circuitRef: 'imola',
        name: 'Imola',
      });
      await mockCircuit.create({
        country: 'UK',
        circuitRef: 'silverstone',
        name: 'Silverstone',
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/circuits?country=Italy',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(2);
      body.data.forEach((circuit: any) => {
        expect(circuit.country).toBe('Italy');
      });
    });

    it('should search by name', async () => {
      await mockCircuit.create({
        name: 'Circuit de Monaco',
        circuitRef: 'monaco',
      });
      await mockCircuit.create({
        name: 'Silverstone Circuit',
        circuitRef: 'silverstone',
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/circuits?search=Monaco',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].name).toContain('Monaco');
    });

    it('should return 400 for invalid page parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/circuits?page=invalid',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('error');
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should sort circuits alphabetically by name', async () => {
      await mockCircuit.create({ name: 'Silverstone', circuitRef: 'silver' });
      await mockCircuit.create({ name: 'Monaco', circuitRef: 'monaco' });
      await mockCircuit.create({ name: 'Spa', circuitRef: 'spa' });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/circuits',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data[0].name).toBe('Monaco');
      expect(body.data[1].name).toBe('Silverstone');
      expect(body.data[2].name).toBe('Spa');
    });
  });

  describe('GET /api/v1/circuits/:id', () => {
    it('should return circuit by ID', async () => {
      const circuit = await mockCircuit.create({
        name: 'Circuit de Monaco',
        circuitRef: 'monaco',
        location: 'Monte Carlo',
        country: 'Monaco',
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/circuits/${circuit.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(body.data.id).toBe(circuit.id);
      expect(body.data.name).toBe('Circuit de Monaco');
      expect(body.data.stats).toBeDefined();
    });

    it('should return 404 for non-existent circuit', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/circuits/99999',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('error');
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/circuits/invalid',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return circuit with statistics', async () => {
      const circuit = await mockCircuit.create();
      const season = await mockSeason.create();

      await mockRace.create(season.id, circuit.id, { name: 'Test GP' });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/circuits/${circuit.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.stats.totalRaces).toBe(1);
    });
  });

  describe('GET /api/v1/circuits/ref/:ref', () => {
    it('should return circuit by reference', async () => {
      await mockCircuit.create({
        circuitRef: 'monaco',
        name: 'Circuit de Monaco',
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/circuits/ref/monaco',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(body.data.circuitRef).toBe('monaco');
      expect(body.data.name).toBe('Circuit de Monaco');
    });

    it('should return 404 for non-existent reference', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/circuits/ref/nonexistent',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/v1/circuits/countries', () => {
    it('should return empty array when no circuits exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/circuits/countries',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(body.data).toEqual([]);
    });

    it('should return unique countries sorted', async () => {
      await mockCircuit.create({ country: 'Italy', circuitRef: 'c1' });
      await mockCircuit.create({ country: 'UK', circuitRef: 'c2' });
      await mockCircuit.create({ country: 'Italy', circuitRef: 'c3' }); // Duplicate

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/circuits/countries',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(2);
      expect(body.data).toContain('Italy');
      expect(body.data).toContain('UK');
    });
  });
});
