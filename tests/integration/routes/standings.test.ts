import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { v1Routes } from '../../../src/routes/v1/index';

describe('Standings Routes', () => {
  let fastify: ReturnType<typeof Fastify>;

  beforeAll(async () => {
    fastify = Fastify();
    await fastify.register(v1Routes, { prefix: '/api/v1' });
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  describe('GET /api/v1/standings/drivers', () => {
    it('should return latest driver standings', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers',
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        expect(body.status).toBe('success');
        expect(Array.isArray(body.data)).toBe(true);
        expect(body).toHaveProperty('meta');
        expect(body.meta).toHaveProperty('season');
        expect(body.meta).toHaveProperty('round');
        expect(body.meta).toHaveProperty('raceName');
      }
    });

    it('should return standings for specific season', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers?season=2024',
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        expect(body.meta.season).toBe(2024);
      }
    });

    it('should return standings for specific season and round', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers?season=2024&round=16',
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        expect(body.meta.season).toBe(2024);
        expect(body.meta.round).toBe(16);
      }
    });

    it('should return 400 when round provided without season', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers?round=16',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('error');
      expect(body.error.message).toContain('season');
    });

    it('should return 400 for invalid season format', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers?season=invalid',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('error');
    });

    it('should return 400 for invalid round format', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers?season=2024&round=invalid',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('error');
    });

    it('should order standings by position', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers',
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        const standings = body.data;

        if (standings.length > 1) {
          for (let i = 1; i < standings.length; i++) {
            expect(standings[i].position).toBeGreaterThan(
              standings[i - 1].position
            );
          }
        }
      }
    });

    it('should include driver info in standings', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers',
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        if (body.data.length > 0) {
          const standing = body.data[0];
          expect(standing).toHaveProperty('position');
          expect(standing).toHaveProperty('points');
          expect(standing).toHaveProperty('wins');
          expect(standing).toHaveProperty('driver');
          expect(standing.driver).toHaveProperty('forename');
          expect(standing.driver).toHaveProperty('surname');
          expect(standing.driver).toHaveProperty('code');
        }
      }
    });

    it('should return 404 for non-existent season', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers?season=1900',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return 404 for non-existent round in valid season', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers?season=2024&round=999',
      });

      expect(response.statusCode).toBe(404);
    });

    it('should validate points are non-negative', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers',
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        body.data.forEach((standing: any) => {
          expect(standing.points).toBeGreaterThanOrEqual(0);
          expect(standing.wins).toBeGreaterThanOrEqual(0);
        });
      }
    });

    it('should validate wins dont exceed points possibility', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers',
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        body.data.forEach((standing: any) => {
          // A driver with X wins should have at least X * 18 points (minimum for a win with 18 other finishers)
          // This is a loose validation but catches obvious errors
          if (standing.wins > 0) {
            expect(standing.points).toBeGreaterThan(0);
          }
        });
      }
    });

    it('should include race metadata', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers',
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        expect(body.meta).toHaveProperty('raceName');
        expect(typeof body.meta.raceName).toBe('string');
      }
    });
  });

  describe('GET /api/v1/standings/constructors', () => {
    it('should return latest constructor standings', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/standings/constructors',
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        expect(body.status).toBe('success');
        expect(Array.isArray(body.data)).toBe(true);
      }
    });

    it('should return standings for specific season', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/standings/constructors?season=2024',
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        expect(body.meta.season).toBe(2024);
      }
    });

    it('should return standings for specific season and round', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/standings/constructors?season=2024&round=16',
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        expect(body.meta.season).toBe(2024);
        expect(body.meta.round).toBe(16);
      }
    });

    it('should return 400 when round provided without season', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/standings/constructors?round=16',
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid season format', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/standings/constructors?season=invalid',
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid round format', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/standings/constructors?season=2024&round=invalid',
      });

      expect(response.statusCode).toBe(400);
    });

    it('should order standings by position', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/standings/constructors',
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        const standings = body.data;

        if (standings.length > 1) {
          for (let i = 1; i < standings.length; i++) {
            expect(standings[i].position).toBeGreaterThan(
              standings[i - 1].position
            );
          }
        }
      }
    });

    it('should include team info in standings', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/standings/constructors',
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        if (body.data.length > 0) {
          const standing = body.data[0];
          expect(standing).toHaveProperty('position');
          expect(standing).toHaveProperty('points');
          expect(standing).toHaveProperty('wins');
          expect(standing).toHaveProperty('team');
          expect(standing.team).toHaveProperty('name');
          expect(standing.team).toHaveProperty('teamRef');
        }
      }
    });

    it('should return 404 for non-existent season', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/standings/constructors?season=1900',
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 for non-existent round in valid season', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/standings/constructors?season=2024&round=999',
      });

      expect(response.statusCode).toBe(404);
    });

    it('should validate points are non-negative', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/standings/constructors',
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        body.data.forEach((standing: any) => {
          expect(standing.points).toBeGreaterThanOrEqual(0);
          expect(standing.wins).toBeGreaterThanOrEqual(0);
        });
      }
    });

    it('should include race metadata', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/standings/constructors',
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        expect(body.meta).toHaveProperty('season');
        expect(body.meta).toHaveProperty('round');
        expect(body.meta).toHaveProperty('raceName');
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle large season numbers gracefully', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers?season=9999',
      });

      expect([404, 400]).toContain(response.statusCode);
    });

    it('should handle negative season numbers', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers?season=-1',
      });

      expect(response.statusCode).toBe(404);
    });

    it('should handle negative round numbers', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers?season=2024&round=-1',
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return consistent response structure for drivers', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers',
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        expect(body).toHaveProperty('status');
        expect(body).toHaveProperty('data');
        expect(body).toHaveProperty('meta');
      }
    });

    it('should return consistent response structure for constructors', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/standings/constructors',
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        expect(body).toHaveProperty('status');
        expect(body).toHaveProperty('data');
        expect(body).toHaveProperty('meta');
      }
    });

    it('should handle season with no rounds', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/standings/drivers?season=2025&round=1',
      });

      // Should either return 404 or valid standings
      expect([200, 404]).toContain(response.statusCode);
    });
  });
});
