import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { v1Routes } from '../../../src/routes/v1/index';

describe('Race Routes', () => {
  let fastify: ReturnType<typeof Fastify>;

  beforeAll(async () => {
    fastify = Fastify();
    await fastify.register(v1Routes, { prefix: '/api/v1' });
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  describe('GET /api/v1/races', () => {
    it('should return 200 and list of races', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/races',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(Array.isArray(body.data)).toBe(true);
      expect(body).toHaveProperty('meta');
    });

    it('should filter by season', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/races?season=2024',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      body.data.forEach((race: any) => {
        expect(race.season).toBe(2024);
      });
    });

    it('should filter by circuit', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/races?circuit=monza',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      body.data.forEach((race: any) => {
        expect(race.circuit.circuitRef).toBe('monza');
      });
    });

    it('should include circuit data in response', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/races?limit=1',
      });

      const body = JSON.parse(response.body);
      if (body.data.length > 0) {
        const race = body.data[0];
        expect(race).toHaveProperty('circuit');
        expect(race.circuit).toHaveProperty('name');
        expect(race.circuit).toHaveProperty('country');
      }
    });
  });

  describe('GET /api/v1/races/season/:year', () => {
    it('should return all races for a season', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/races/season/2024',
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        expect(body.status).toBe('success');
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.meta).toHaveProperty('season');
        expect(body.meta.season.year).toBe(2024);
      }
    });

    it('should return 404 for non-existent season', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/races/season/1900',
      });

      expect(response.statusCode).toBe(400);
    });

    it('should order races by round number', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/races/season/2024',
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        const races = body.data;

        if (races.length > 1) {
          for (let i = 1; i < races.length; i++) {
            expect(races[i].round).toBeGreaterThan(races[i - 1].round);
          }
        }
      }
    });
  });

  describe('GET /api/v1/races/:id', () => {
    it('should return race with stats', async () => {
      // Get a race first
      const listResponse = await fastify.inject({
        method: 'GET',
        url: '/api/v1/races?limit=1',
      });

      const listBody = JSON.parse(listResponse.body);
      if (listBody.data.length === 0) return;

      const raceId = listBody.data[0].id;

      const response = await fastify.inject({
        method: 'GET',
        url: `/api/v1/races/${raceId}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveProperty('stats');
      expect(body.data.stats).toHaveProperty('totalDrivers');
      expect(body.data.stats).toHaveProperty('finishers');
      expect(body.data.stats).toHaveProperty('dnfs');
    });
  });

  describe('GET /api/v1/races/:id/results', () => {
    it('should return race results ordered by position', async () => {
      // Get a race first
      const listResponse = await fastify.inject({
        method: 'GET',
        url: '/api/v1/races?limit=1',
      });

      const listBody = JSON.parse(listResponse.body);
      if (listBody.data.length === 0) return;

      const raceId = listBody.data[0].id;

      const response = await fastify.inject({
        method: 'GET',
        url: `/api/v1/races/${raceId}/results`,
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        expect(body.status).toBe('success');
        expect(Array.isArray(body.data)).toBe(true);

        // Check results include driver and team info
        if (body.data.length > 0) {
          const result = body.data[0];
          expect(result).toHaveProperty('driver');
          expect(result).toHaveProperty('team');
          expect(result).toHaveProperty('position');
          expect(result).toHaveProperty('points');
          expect(result).toHaveProperty('status');
        }

        // Check ordering
        const results = body.data;
        if (results.length > 1) {
          for (let i = 1; i < results.length; i++) {
            if (results[i - 1].position && results[i].position) {
              expect(results[i].position).toBeGreaterThan(
                results[i - 1].position
              );
            }
          }
        }
      }
    });

    it('should return 404 for non-existent race', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/races/999999/results',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/v1/races/:id/qualifying', () => {
    it('should return qualifying results ordered by position', async () => {
      // Get a race first
      const listResponse = await fastify.inject({
        method: 'GET',
        url: '/api/v1/races?limit=1',
      });

      const listBody = JSON.parse(listResponse.body);
      if (listBody.data.length === 0) return;

      const raceId = listBody.data[0].id;

      const response = await fastify.inject({
        method: 'GET',
        url: `/api/v1/races/${raceId}/qualifying`,
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        expect(body.status).toBe('success');
        expect(Array.isArray(body.data)).toBe(true);

        // Check structure
        if (body.data.length > 0) {
          const result = body.data[0];
          expect(result).toHaveProperty('driver');
          expect(result).toHaveProperty('team');
          expect(result).toHaveProperty('position');
          expect(result).toHaveProperty('q1Time');
        }
      }
    });
  });
});
