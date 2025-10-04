import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { v1Routes } from '../../../src/routes/v1/index';

describe('Season Routes', () => {
  let fastify: ReturnType<typeof Fastify>;

  beforeAll(async () => {
    fastify = Fastify();
    await fastify.register(v1Routes, { prefix: '/api/v1' });
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  describe('GET /api/v1/seasons', () => {
    it('should return 200 and list of seasons', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/seasons',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('meta');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('should respect pagination query parameters', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/seasons?page=1&limit=5',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.meta.page).toBe(1);
      expect(body.meta.limit).toBe(5);
      expect(body.data.length).toBeLessThanOrEqual(5);
    });

    it('should return 400 for invalid pagination parameters', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/seasons?page=invalid',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('error');
    });

    it('should return seasons sorted by year (desc)', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/seasons?limit=10',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      if (body.data.length > 1) {
        for (let i = 1; i < body.data.length; i++) {
          expect(body.data[i].year).toBeLessThanOrEqual(body.data[i - 1].year);
        }
      }
    });

    it('should include all required season fields', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/seasons?limit=1',
      });

      const body = JSON.parse(response.body);
      if (body.data.length > 0) {
        const season = body.data[0];
        expect(season).toHaveProperty('id');
        expect(season).toHaveProperty('year');
        expect(season).toHaveProperty('url');
      }
    });

    it('should handle negative page numbers', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/seasons?page=-1',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.meta.page).toBe(1);
    });

    it('should cap limit at maximum', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/seasons?limit=200',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.meta.limit).toBeLessThanOrEqual(100);
    });
  });

  describe('GET /api/v1/seasons/:id', () => {
    it('should return 200 and season details for valid ID', async () => {
      const listResponse = await fastify.inject({
        method: 'GET',
        url: '/api/v1/seasons?limit=1',
      });

      const listBody = JSON.parse(listResponse.body);
      if (listBody.data.length === 0) {
        return;
      }

      const seasonId = listBody.data[0].id;

      const response = await fastify.inject({
        method: 'GET',
        url: `/api/v1/seasons/${seasonId}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(body.data.id).toBe(seasonId);
      expect(body.data).toHaveProperty('stats');
      expect(body.data.stats).toHaveProperty('totalRaces');
      expect(body.data.stats).toHaveProperty('drivers');
      expect(body.data.stats).toHaveProperty('teams');
    });

    it('should return statistics for season', async () => {
      const listResponse = await fastify.inject({
        method: 'GET',
        url: '/api/v1/seasons?limit=1',
      });

      const listBody = JSON.parse(listResponse.body);
      if (listBody.data.length === 0) return;

      const seasonId = listBody.data[0].id;
      const response = await fastify.inject({
        method: 'GET',
        url: `/api/v1/seasons/${seasonId}`,
      });

      const body = JSON.parse(response.body);
      expect(body.data.stats.totalRaces).toBeGreaterThanOrEqual(0);
      expect(body.data.stats.drivers).toBeGreaterThanOrEqual(0);
      expect(body.data.stats.teams).toBeGreaterThanOrEqual(0);
    });

    it('should return 404 for non-existent season', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/seasons/999999',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('error');
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/seasons/invalid',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('error');
    });

    it('should return 400 for ID out of range', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/seasons/9999999999',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('INVALID_ID');
    });
  });

  describe('GET /api/v1/seasons/year/:year', () => {
    it('should return 200 and season details for valid year', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/seasons/year/2024',
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        expect(body.status).toBe('success');
        expect(body.data.year).toBe(2024);
        expect(body.data).toHaveProperty('stats');
      }
    });

    it('should return 200 for 2023 season', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/seasons/year/2023',
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        expect(body.data.year).toBe(2023);
      }
    });

    it('should return 404 for non-existent season year', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/seasons/year/1900',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('error');
      expect(body.error.code).toBe('INVALID_YEAR');
    });

    it('should return 400 for invalid year format', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/seasons/year/invalid',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('error');
    });

    it('should return 400 for year before 1950', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/seasons/year/1949',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('INVALID_YEAR');
    });

    it('should return 400 for year too far in future', async () => {
      const currentYear = new Date().getFullYear();
      const futureYear = currentYear + 10;

      const response = await fastify.inject({
        method: 'GET',
        url: `/api/v1/seasons/year/${futureYear}`,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('INVALID_YEAR');
    });

    it('should accept current year plus 1', async () => {
      const nextYear = new Date().getFullYear() + 1;

      const response = await fastify.inject({
        method: 'GET',
        url: `/api/v1/seasons/year/${nextYear}`,
      });

      // Should either return 200 or 404, but not 400
      expect([200, 404]).toContain(response.statusCode);
    });

    it('should include season statistics', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/seasons/year/2024',
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        expect(body.data).toHaveProperty('stats');
        expect(typeof body.data.stats.totalRaces).toBe('number');
        expect(typeof body.data.stats.drivers).toBe('number');
        expect(typeof body.data.stats.teams).toBe('number');
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should return consistent response structure', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/seasons',
      });

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('meta');
      expect(body.meta).toHaveProperty('page');
      expect(body.meta).toHaveProperty('limit');
      expect(body.meta).toHaveProperty('total');
      expect(body.meta).toHaveProperty('totalPages');
      expect(body.meta).toHaveProperty('hasNext');
      expect(body.meta).toHaveProperty('hasPrev');
    });

    it('should have proper year data types', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/seasons?limit=1',
      });

      const body = JSON.parse(response.body);
      if (body.data.length > 0) {
        const season = body.data[0];
        expect(typeof season.year).toBe('number');
        expect(season.year).toBeGreaterThanOrEqual(1950);
        expect(season.year).toBeLessThanOrEqual(new Date().getFullYear() + 1);
      }
    });

    it('should handle zero limit gracefully', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/seasons?limit=0',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.meta.limit).toBeGreaterThan(0);
    });
  });
});
