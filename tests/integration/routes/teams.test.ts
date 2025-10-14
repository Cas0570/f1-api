import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { v1Routes } from '../../../src/routes/v1/index';
import { cacheService } from '../../../src/services/cacheService';
import {
  cleanDatabase,
  mockTeam,
  mockDriver,
  mockRaceResult,
  mockQualifyingResult,
  mockRace,
  mockSeason,
  mockCircuit,
  mockStatus,
} from '../../helpers/testSetup';

const prisma = new PrismaClient();
let app: FastifyInstance;

describe('Team Routes', () => {
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

  describe('GET /api/v1/teams', () => {
    it('should return empty array when no teams exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/teams',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(body.data).toEqual([]);
      expect(body.meta.total).toBe(0);
    });

    it('should return all teams with pagination', async () => {
      await mockTeam.createBatch(5);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/teams',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(body.data).toHaveLength(5);
      expect(body.meta.total).toBe(5);
      expect(body.meta.page).toBe(1);
      expect(body.meta.limit).toBe(20);
    });

    it('should paginate teams correctly', async () => {
      await mockTeam.createBatch(25);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/teams?page=2&limit=10',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(10);
      expect(body.meta.page).toBe(2);
      expect(body.meta.hasNext).toBe(true);
      expect(body.meta.hasPrev).toBe(true);
    });

    it('should filter by nationality', async () => {
      await mockTeam.create({
        nationality: 'Italian',
        teamRef: 'ferrari',
        name: 'Ferrari',
      });
      await mockTeam.create({
        nationality: 'Italian',
        teamRef: 'alphatauri',
        name: 'AlphaTauri',
      });
      await mockTeam.create({
        nationality: 'British',
        teamRef: 'mclaren',
        name: 'McLaren',
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/teams?nationality=Italian',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(2);
      body.data.forEach((team: any) => {
        expect(team.nationality).toBe('Italian');
      });
    });

    it('should search by name', async () => {
      await mockTeam.create({
        name: 'Mercedes-AMG Petronas',
        teamRef: 'mercedes',
      });
      await mockTeam.create({
        name: 'Red Bull Racing',
        teamRef: 'red_bull',
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/teams?search=Mercedes',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].name).toContain('Mercedes');
    });

    it('should return 400 for invalid page parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/teams?page=invalid',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('error');
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid limit parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/teams?limit=abc',
      });

      expect(response.statusCode).toBe(400);
    });

    it('should sort teams alphabetically by name', async () => {
      await mockTeam.create({ name: 'Red Bull Racing', teamRef: 'rb' });
      await mockTeam.create({ name: 'Ferrari', teamRef: 'ferrari' });
      await mockTeam.create({ name: 'Mercedes', teamRef: 'merc' });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/teams',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data[0].name).toBe('Ferrari');
      expect(body.data[1].name).toBe('Mercedes');
      expect(body.data[2].name).toBe('Red Bull Racing');
    });
  });

  describe('GET /api/v1/teams/:id', () => {
    it('should return team by ID', async () => {
      const team = await mockTeam.create({
        name: 'Mercedes-AMG Petronas',
        teamRef: 'mercedes',
        nationality: 'German',
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/teams/${team.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(body.data.id).toBe(team.id);
      expect(body.data.name).toBe('Mercedes-AMG Petronas');
      expect(body.data.nationality).toBe('German');
      expect(body.data.stats).toBeDefined();
    });

    it('should return 404 for non-existent team', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/teams/99999',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('error');
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/teams/invalid',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return team with statistics', async () => {
      const team = await mockTeam.create();
      const driver = await mockDriver.create();
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
        url: `/api/v1/teams/${team.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.stats.races).toBe(1);
      expect(body.data.stats.wins).toBe(1);
      expect(body.data.stats.poles).toBe(1);
    });

    it('should handle team with multiple drivers', async () => {
      const team = await mockTeam.create();
      const driver1 = await mockDriver.create({ driverRef: 'd1' });
      const driver2 = await mockDriver.create({ driverRef: 'd2' });
      const season = await mockSeason.create();
      const circuit = await mockCircuit.create();
      const status = await mockStatus.create();

      const race = await mockRace.create(season.id, circuit.id);

      // Both drivers finish on podium
      await mockRaceResult.create(race.id, driver1.id, team.id, status.id, {
        position: 1,
        points: 25,
      });
      await mockRaceResult.create(race.id, driver2.id, team.id, status.id, {
        position: 2,
        points: 18,
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/teams/${team.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.stats.races).toBe(2); // 2 entries (one per driver)
      expect(body.data.stats.wins).toBe(1);
      expect(body.data.stats.podiums).toBe(2);
    });
  });

  describe('GET /api/v1/teams/ref/:ref', () => {
    it('should return team by reference', async () => {
      await mockTeam.create({
        teamRef: 'mercedes',
        name: 'Mercedes-AMG Petronas',
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/teams/ref/mercedes',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(body.data.teamRef).toBe('mercedes');
      expect(body.data.name).toBe('Mercedes-AMG Petronas');
    });

    it('should return 404 for non-existent reference', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/teams/ref/nonexistent',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for empty reference', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/teams/ref/',
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/v1/teams/nationalities', () => {
    it('should return empty array when no teams exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/teams/nationalities',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('success');
      expect(body.data).toEqual([]);
    });

    it('should return unique nationalities sorted', async () => {
      await mockTeam.create({ nationality: 'British', teamRef: 't1' });
      await mockTeam.create({ nationality: 'German', teamRef: 't2' });
      await mockTeam.create({ nationality: 'British', teamRef: 't3' }); // Duplicate

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/teams/nationalities',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(2);
      expect(body.data).toContain('British');
      expect(body.data).toContain('German');
    });
  });
});
