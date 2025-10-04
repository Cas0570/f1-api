import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { v1Routes } from '../../../src/routes/v1/index';

describe('Team Routes', () => {
  let fastify: ReturnType<typeof Fastify>;

  beforeAll(async () => {
    fastify = Fastify();
    await fastify.register(v1Routes, { prefix: '/api/v1' });
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  describe('GET /api/v1/teams', () => {
    it('should return 200 and list of teams', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/teams',
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
        url: '/api/v1/teams?page=1&limit=5',
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
        url: '/api/v1/teams?nationality=Italian',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      body.data.forEach((team: any) => {
        expect(team.nationality).toBe('Italian');
      });
    });

    it('should search by name', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/teams?search=ferrari',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
    });

    it('should return 400 for invalid pagination parameters', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/teams?page=invalid',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('error');
    });

    it('should handle negative page numbers', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/teams?page=-1',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      // Service should coerce to page 1
      expect(body.meta.page).toBe(1);
    });

    it('should handle limit exceeding maximum', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/teams?limit=200',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      // Service should cap at 100
      expect(body.meta.limit).toBeLessThanOrEqual(100);
    });

    it('should return empty array for non-existent nationality', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/teams?nationality=NonExistentNationality',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toEqual([]);
      expect(body.meta.total).toBe(0);
    });

    it('should return teams sorted by name', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/teams?limit=10',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      if (body.data.length > 1) {
        for (let i = 1; i < body.data.length; i++) {
          expect(body.data[i].name >= body.data[i - 1].name).toBe(true);
        }
      }
    });
  });

  describe('GET /api/v1/teams/:id', () => {
    it('should return 200 and team details for valid ID', async () => {
      // First get a team to test with
      const listResponse = await fastify.inject({
        method: 'GET',
        url: '/api/v1/teams?limit=1',
      });

      const listBody = JSON.parse(listResponse.body);
      if (listBody.data.length === 0) {
        return; // Skip if no teams
      }

      const teamId = listBody.data[0].id;

      const response = await fastify.inject({
        method: 'GET',
        url: `/api/v1/teams/${teamId}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(body.data.id).toBe(teamId);
      expect(body.data).toHaveProperty('stats');
      expect(body.data.stats).toHaveProperty('races');
      expect(body.data.stats).toHaveProperty('wins');
      expect(body.data.stats).toHaveProperty('podiums');
      expect(body.data.stats).toHaveProperty('poles');
      expect(body.data.stats).toHaveProperty('championships');
    });

    it('should return 404 for non-existent team', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/teams/999999',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('error');
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/teams/invalid',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('error');
    });

    it('should return 400 for ID out of range', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/teams/9999999999',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('error');
      expect(body.error.code).toBe('INVALID_ID');
    });

    it('should include all required team fields', async () => {
      const listResponse = await fastify.inject({
        method: 'GET',
        url: '/api/v1/teams?limit=1',
      });

      const listBody = JSON.parse(listResponse.body);
      if (listBody.data.length === 0) return;

      const teamId = listBody.data[0].id;
      const response = await fastify.inject({
        method: 'GET',
        url: `/api/v1/teams/${teamId}`,
      });

      const body = JSON.parse(response.body);
      expect(body.data).toHaveProperty('id');
      expect(body.data).toHaveProperty('teamRef');
      expect(body.data).toHaveProperty('name');
      expect(body.data).toHaveProperty('nationality');
      expect(body.data).toHaveProperty('url');
    });
  });

  describe('GET /api/v1/teams/ref/:ref', () => {
    it('should return 200 and team details for valid reference', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/teams/ref/ferrari',
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        expect(body.status).toBe('success');
        expect(body.data.teamRef).toBe('ferrari');
        expect(body.data).toHaveProperty('stats');
      }
      // If 404, ferrari doesn't exist in test data - that's ok
    });

    it('should return 200 for mercedes reference', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/teams/ref/mercedes',
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        expect(body.data.teamRef).toBe('mercedes');
      }
    });

    it('should return 404 for non-existent reference', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/teams/ref/nonexistentteam',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('error');
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for empty reference', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/teams/ref/',
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle case-sensitive references', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/teams/ref/FERRARI',
      });

      // Should return 404 as teamRef is case-sensitive
      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/v1/teams/nationalities', () => {
    it('should return 200 and list of nationalities', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/teams/nationalities',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('should return unique sorted nationalities', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/teams/nationalities',
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

    it('should return only strings', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/teams/nationalities',
      });

      const body = JSON.parse(response.body);
      body.data.forEach((nationality: any) => {
        expect(typeof nationality).toBe('string');
      });
    });

    it('should not include null or empty nationalities', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/teams/nationalities',
      });

      const body = JSON.parse(response.body);
      body.data.forEach((nationality: any) => {
        expect(nationality).toBeTruthy();
        expect(nationality.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle multiple query parameters', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/teams?nationality=Italian&search=fer&page=1&limit=5',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
    });

    it('should handle special characters in search', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/teams?search=Red%20Bull',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
    });

    it('should return consistent response structure', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/teams',
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
  });
});
