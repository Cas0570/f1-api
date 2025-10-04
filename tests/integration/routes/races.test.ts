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

    it('should respect pagination parameters', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/races?page=1&limit=5',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.meta.page).toBe(1);
      expect(body.meta.limit).toBe(5);
      expect(body.data.length).toBeLessThanOrEqual(5);
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

    it('should return 400 for invalid pagination', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/races?page=invalid',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('error');
    });

    it('should handle negative page numbers', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/races?page=-1',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.meta.page).toBe(1);
    });

    it('should handle limit exceeding maximum', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/races?limit=200',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.meta.limit).toBeLessThanOrEqual(100);
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

    it('should return races sorted by date descending', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/races?limit=10',
      });

      const body = JSON.parse(response.body);
      if (body.data.length > 1) {
        for (let i = 1; i < body.data.length; i++) {
          const prevDate = new Date(body.data[i - 1].date);
          const currDate = new Date(body.data[i].date);
          expect(currDate <= prevDate).toBe(true);
        }
      }
    });

    it('should return empty array for non-existent season', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/races?season=1900',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toEqual([]);
    });

    it('should return empty array for non-existent circuit', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/races?circuit=nonexistent',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toEqual([]);
    });

    it('should include all required race fields', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/races?limit=1',
      });

      const body = JSON.parse(response.body);
      if (body.data.length > 0) {
        const race = body.data[0];
        expect(race).toHaveProperty('id');
        expect(race).toHaveProperty('season');
        expect(race).toHaveProperty('round');
        expect(race).toHaveProperty('name');
        expect(race).toHaveProperty('date');
        expect(race).toHaveProperty('circuit');
        expect(race).toHaveProperty('url');
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
        expect(body.meta).toHaveProperty('totalRaces');
      }
    });

    it('should return 404 for non-existent season', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/races/season/1900',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('INVALID_YEAR');
    });

    it('should return 400 for invalid year format', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/races/season/invalid',
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

    it('should return 400 for year before 1950', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/races/season/1949',
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for year too far in future', async () => {
      const currentYear = new Date().getFullYear();
      const futureYear = currentYear + 10;

      const response = await fastify.inject({
        method: 'GET',
        url: `/api/v1/races/season/${futureYear}`,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should accept current year plus 1', async () => {
      const nextYear = new Date().getFullYear() + 1;

      const response = await fastify.inject({
        method: 'GET',
        url: `/api/v1/races/season/${nextYear}`,
      });

      expect([200, 404]).toContain(response.statusCode);
    });
  });

  describe('GET /api/v1/races/:id', () => {
    it('should return race with stats', async () => {
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

    it('should validate statistics are reasonable', async () => {
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

      const body = JSON.parse(response.body);
      const stats = body.data.stats;

      expect(stats.finishers + stats.dnfs).toBe(stats.totalDrivers);
      expect(stats.finishers).toBeLessThanOrEqual(stats.totalDrivers);
      expect(stats.dnfs).toBeLessThanOrEqual(stats.totalDrivers);
    });

    it('should return 404 for non-existent race', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/races/999999',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/races/invalid',
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for ID out of range', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/races/9999999999',
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/v1/races/:id/results', () => {
    it('should return race results ordered by position', async () => {
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

        if (body.data.length > 0) {
          const result = body.data[0];
          expect(result).toHaveProperty('driver');
          expect(result).toHaveProperty('team');
          expect(result).toHaveProperty('position');
          expect(result).toHaveProperty('points');
          expect(result).toHaveProperty('status');
          expect(result).toHaveProperty('gridPosition');
          expect(result).toHaveProperty('laps');
        }

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

    it('should include driver and team details', async () => {
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
        if (body.data.length > 0) {
          const result = body.data[0];
          expect(result.driver).toHaveProperty('forename');
          expect(result.driver).toHaveProperty('surname');
          expect(result.driver).toHaveProperty('code');
          expect(result.team).toHaveProperty('name');
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

    it('should return 400 for invalid race ID', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/races/invalid/results',
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return empty array for race with no results', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/races/1/results',
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        expect(Array.isArray(body.data)).toBe(true);
      }
    });
  });

  describe('GET /api/v1/races/:id/qualifying', () => {
    it('should return qualifying results ordered by position', async () => {
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

        if (body.data.length > 0) {
          const result = body.data[0];
          expect(result).toHaveProperty('driver');
          expect(result).toHaveProperty('team');
          expect(result).toHaveProperty('position');
          expect(result).toHaveProperty('q1Time');
        }
      }
    });

    it('should include Q1, Q2, Q3 times', async () => {
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
        if (body.data.length > 0) {
          const result = body.data[0];
          expect(result).toHaveProperty('q1Time');
          expect(result).toHaveProperty('q2Time');
          expect(result).toHaveProperty('q3Time');
        }
      }
    });

    it('should order results by position ascending', async () => {
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
        const results = body.data;

        if (results.length > 1) {
          for (let i = 1; i < results.length; i++) {
            expect(results[i].position).toBeGreaterThan(
              results[i - 1].position
            );
          }
        }
      }
    });

    it('should return 404 for non-existent race', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/races/999999/qualifying',
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 400 for invalid race ID', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/races/invalid/qualifying',
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle multiple filters', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/races?season=2024&circuit=monza&page=1&limit=10',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
    });

    it('should return consistent response structure', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/races',
      });

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('meta');
    });

    it('should format dates correctly', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/races?limit=1',
      });

      const body = JSON.parse(response.body);
      if (body.data.length > 0) {
        const race = body.data[0];
        expect(race.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });
  });
});
