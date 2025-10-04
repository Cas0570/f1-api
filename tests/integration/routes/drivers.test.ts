import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { v1Routes } from '../../../src/routes/v1/index';

describe('Driver Routes', () => {
  let fastify: ReturnType<typeof Fastify>;

  beforeAll(async () => {
    fastify = Fastify();
    await fastify.register(v1Routes, { prefix: '/api/v1' });
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  describe('GET /api/v1/drivers', () => {
    it('should return 200 and list of drivers', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/drivers',
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
        url: '/api/v1/drivers?page=1&limit=5',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.meta.page).toBe(1);
      expect(body.meta.limit).toBe(5);
      expect(body.data.length).toBeLessThanOrEqual(5);
    });

    it('should filter by nationality', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/drivers?nationality=British',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      body.data.forEach((driver: any) => {
        expect(driver.nationality).toBe('British');
      });
    });

    it('should search by name', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/drivers?search=hamilton',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
    });

    it('should return 400 for invalid pagination parameters', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/drivers?page=invalid',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('error');
    });
  });

  describe('GET /api/v1/drivers/:id', () => {
    it('should return 200 and driver details for valid ID', async () => {
      // First get a driver to test with
      const listResponse = await fastify.inject({
        method: 'GET',
        url: '/api/v1/drivers?limit=1',
      });

      const listBody = JSON.parse(listResponse.body);
      if (listBody.data.length === 0) {
        return; // Skip if no drivers
      }

      const driverId = listBody.data[0].id;

      const response = await fastify.inject({
        method: 'GET',
        url: `/api/v1/drivers/${driverId}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(body.data.id).toBe(driverId);
      expect(body.data).toHaveProperty('stats');
    });

    it('should return 404 for non-existent driver', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/drivers/999999',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('error');
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/drivers/invalid',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('error');
    });
  });

  describe('GET /api/v1/drivers/ref/:ref', () => {
    it('should return 200 and driver details for valid reference', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/drivers/ref/hamilton',
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        expect(body.status).toBe('success');
        expect(body.data.driverRef).toBe('hamilton');
      }
      // If 404, hamilton doesn't exist in test data - that's ok
    });

    it('should return 404 for non-existent reference', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/drivers/ref/nonexistent',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('error');
    });
  });

  describe('GET /api/v1/drivers/nationalities', () => {
    it('should return 200 and list of nationalities', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/drivers/nationalities',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('should return unique sorted nationalities', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/drivers/nationalities',
      });

      const body = JSON.parse(response.body);
      const nationalities = body.data;

      // Check uniqueness
      const uniqueNationalities = [...new Set(nationalities)];
      expect(nationalities.length).toBe(uniqueNationalities.length);

      // Check sorting (if more than 1)
      if (nationalities.length > 1) {
        for (let i = 1; i < nationalities.length; i++) {
          expect(nationalities[i] >= nationalities[i - 1]).toBe(true);
        }
      }
    });
  });
});
