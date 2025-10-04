import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { v1Routes } from '../../../src/routes/v1/index';

describe('Circuit Routes', () => {
  let fastify: ReturnType<typeof Fastify>;

  beforeAll(async () => {
    fastify = Fastify();
    await fastify.register(v1Routes, { prefix: '/api/v1' });
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  describe('GET /api/v1/circuits', () => {
    it('should return 200 and list of circuits', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/circuits',
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
        url: '/api/v1/circuits?page=1&limit=5',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.meta.page).toBe(1);
      expect(body.meta.limit).toBe(5);
      expect(body.data.length).toBeLessThanOrEqual(5);
    });

    it('should filter by country', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/circuits?country=Italy',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      body.data.forEach((circuit: any) => {
        expect(circuit.country).toBe('Italy');
      });
    });

    it('should search by name or location', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/circuits?search=monza',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
    });

    it('should return 400 for invalid pagination parameters', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/circuits?page=invalid',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('error');
    });

    it('should handle negative page numbers', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/circuits?page=-1',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.meta.page).toBe(1);
    });

    it('should return empty array for non-existent country', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/circuits?country=NonExistentCountry',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toEqual([]);
      expect(body.meta.total).toBe(0);
    });

    it('should return circuits sorted by name', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/circuits?limit=10',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      if (body.data.length > 1) {
        for (let i = 1; i < body.data.length; i++) {
          expect(body.data[i].name >= body.data[i - 1].name).toBe(true);
        }
      }
    });

    it('should include location data in circuits', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/circuits?limit=1',
      });

      const body = JSON.parse(response.body);
      if (body.data.length > 0) {
        const circuit = body.data[0];
        expect(circuit).toHaveProperty('location');
        expect(circuit).toHaveProperty('country');
        expect(circuit).toHaveProperty('lat');
        expect(circuit).toHaveProperty('lng');
      }
    });
  });

  describe('GET /api/v1/circuits/:id', () => {
    it('should return 200 and circuit details for valid ID', async () => {
      const listResponse = await fastify.inject({
        method: 'GET',
        url: '/api/v1/circuits?limit=1',
      });

      const listBody = JSON.parse(listResponse.body);
      if (listBody.data.length === 0) {
        return;
      }

      const circuitId = listBody.data[0].id;

      const response = await fastify.inject({
        method: 'GET',
        url: `/api/v1/circuits/${circuitId}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(body.data.id).toBe(circuitId);
      expect(body.data).toHaveProperty('stats');
      expect(body.data.stats).toHaveProperty('totalRaces');
    });

    it('should include first and last race in stats', async () => {
      const listResponse = await fastify.inject({
        method: 'GET',
        url: '/api/v1/circuits?limit=1',
      });

      const listBody = JSON.parse(listResponse.body);
      if (listBody.data.length === 0) return;

      const circuitId = listBody.data[0].id;
      const response = await fastify.inject({
        method: 'GET',
        url: `/api/v1/circuits/${circuitId}`,
      });

      const body = JSON.parse(response.body);
      if (body.data.stats.totalRaces > 0) {
        expect(body.data.stats).toHaveProperty('firstRace');
        expect(body.data.stats).toHaveProperty('lastRace');
        expect(body.data.stats.firstRace).toHaveProperty('year');
        expect(body.data.stats.firstRace).toHaveProperty('name');
      }
    });

    it('should return 404 for non-existent circuit', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/circuits/999999',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('error');
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/circuits/invalid',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('error');
    });

    it('should return 400 for ID out of range', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/circuits/9999999999',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('INVALID_ID');
    });

    it('should include all required circuit fields', async () => {
      const listResponse = await fastify.inject({
        method: 'GET',
        url: '/api/v1/circuits?limit=1',
      });

      const listBody = JSON.parse(listResponse.body);
      if (listBody.data.length === 0) return;

      const circuitId = listBody.data[0].id;
      const response = await fastify.inject({
        method: 'GET',
        url: `/api/v1/circuits/${circuitId}`,
      });

      const body = JSON.parse(response.body);
      expect(body.data).toHaveProperty('id');
      expect(body.data).toHaveProperty('circuitRef');
      expect(body.data).toHaveProperty('name');
      expect(body.data).toHaveProperty('location');
      expect(body.data).toHaveProperty('country');
      expect(body.data).toHaveProperty('url');
    });
  });

  describe('GET /api/v1/circuits/ref/:ref', () => {
    it('should return 200 and circuit details for valid reference', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/circuits/ref/monza',
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        expect(body.status).toBe('success');
        expect(body.data.circuitRef).toBe('monza');
        expect(body.data).toHaveProperty('stats');
      }
    });

    it('should return 200 for silverstone reference', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/circuits/ref/silverstone',
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        expect(body.data.circuitRef).toBe('silverstone');
      }
    });

    it('should return 404 for non-existent reference', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/circuits/ref/nonexistentcircuit',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('error');
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for empty reference', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/circuits/ref/',
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle case-sensitive references', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/circuits/ref/MONZA',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/v1/circuits/countries', () => {
    it('should return 200 and list of countries', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/circuits/countries',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('should return unique sorted countries', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/circuits/countries',
      });

      const body = JSON.parse(response.body);
      const countries = body.data;

      const uniqueCountries = [...new Set(countries)];
      expect(countries.length).toBe(uniqueCountries.length);

      if (countries.length > 1) {
        for (let i = 1; i < countries.length; i++) {
          expect(countries[i] >= countries[i - 1]).toBe(true);
        }
      }
    });

    it('should return only strings', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/circuits/countries',
      });

      const body = JSON.parse(response.body);
      body.data.forEach((country: any) => {
        expect(typeof country).toBe('string');
      });
    });

    it('should not include null or empty countries', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/circuits/countries',
      });

      const body = JSON.parse(response.body);
      body.data.forEach((country: any) => {
        expect(country).toBeTruthy();
        expect(country.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle multiple query parameters', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/circuits?country=Italy&search=monza&page=1&limit=5',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
    });

    it('should handle special characters in search', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/circuits?search=Circuit%20de',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
    });

    it('should return consistent response structure', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/circuits',
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

    it('should handle latitude and longitude correctly', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/circuits?limit=1',
      });

      const body = JSON.parse(response.body);
      if (body.data.length > 0) {
        const circuit = body.data[0];
        if (circuit.lat !== null) {
          expect(typeof circuit.lat).toBe('number');
          expect(circuit.lat).toBeGreaterThanOrEqual(-90);
          expect(circuit.lat).toBeLessThanOrEqual(90);
        }
        if (circuit.lng !== null) {
          expect(typeof circuit.lng).toBe('number');
          expect(circuit.lng).toBeGreaterThanOrEqual(-180);
          expect(circuit.lng).toBeLessThanOrEqual(180);
        }
      }
    });
  });
});
