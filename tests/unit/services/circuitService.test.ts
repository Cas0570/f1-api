import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  cleanDatabase,
  mockCircuit,
  mockRace,
  mockSeason,
  testPrisma,
} from '../../helpers/testSetup';
import { circuitService } from '../../../src/services/circuitService';
import { cacheService } from '../../../src/services/cacheService';

describe('CircuitService', () => {
  beforeEach(async () => {
    await cleanDatabase();
    cacheService.flush();
  });

  afterEach(() => {
    cacheService.flush();
  });

  describe('getAllCircuits', () => {
    it('should return empty array when no circuits exist', async () => {
      const result = await circuitService.getAllCircuits({});

      expect(result.circuits).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    it('should return all circuits with default pagination', async () => {
      await mockCircuit.createBatch(5);

      const result = await circuitService.getAllCircuits({});

      expect(result.circuits).toHaveLength(5);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(result.meta.total).toBe(5);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.hasNext).toBe(false);
      expect(result.meta.hasPrev).toBe(false);
    });

    it('should paginate circuits correctly', async () => {
      await mockCircuit.createBatch(25);

      // Page 1
      const page1 = await circuitService.getAllCircuits({
        page: 1,
        limit: 10,
      });
      expect(page1.circuits).toHaveLength(10);
      expect(page1.meta.page).toBe(1);
      expect(page1.meta.total).toBe(25);
      expect(page1.meta.totalPages).toBe(3);
      expect(page1.meta.hasNext).toBe(true);
      expect(page1.meta.hasPrev).toBe(false);

      // Page 2
      const page2 = await circuitService.getAllCircuits({
        page: 2,
        limit: 10,
      });
      expect(page2.circuits).toHaveLength(10);
      expect(page2.meta.page).toBe(2);
      expect(page2.meta.hasNext).toBe(true);
      expect(page2.meta.hasPrev).toBe(true);

      // Page 3 (last page)
      const page3 = await circuitService.getAllCircuits({
        page: 3,
        limit: 10,
      });
      expect(page3.circuits).toHaveLength(5);
      expect(page3.meta.hasNext).toBe(false);
      expect(page3.meta.hasPrev).toBe(true);

      // Ensure different circuits on each page
      const page1Ids = page1.circuits.map((c) => c.id);
      const page2Ids = page2.circuits.map((c) => c.id);
      expect(page1Ids).not.toEqual(page2Ids);
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

      const result = await circuitService.getAllCircuits({ country: 'Italy' });

      expect(result.circuits).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      result.circuits.forEach((circuit) => {
        expect(circuit.country).toBe('Italy');
      });
    });

    it('should filter by country (case-insensitive)', async () => {
      await mockCircuit.create({ country: 'Italy', circuitRef: 'monza' });
      await mockCircuit.create({ country: 'Italy', circuitRef: 'imola' });
      await mockCircuit.create({ country: 'UK', circuitRef: 'silverstone' });

      // Test exact match
      const exact = await circuitService.getAllCircuits({ country: 'Italy' });
      expect(exact.circuits).toHaveLength(2);

      // Test case-insensitive
      const caseInsensitive = await circuitService.getAllCircuits({
        country: 'italy',
      });
      expect(caseInsensitive.circuits).toHaveLength(2);
    });

    it('should search by circuit name', async () => {
      await mockCircuit.create({
        name: 'Circuit de Monaco',
        circuitRef: 'monaco',
      });
      await mockCircuit.create({
        name: 'Silverstone Circuit',
        circuitRef: 'silverstone',
      });

      const result = await circuitService.getAllCircuits({ search: 'Monaco' });

      expect(result.circuits).toHaveLength(1);
      expect(result.circuits[0].name).toContain('Monaco');
    });

    it('should search by location', async () => {
      await mockCircuit.create({
        name: 'Monaco',
        location: 'Monte Carlo',
        circuitRef: 'monaco',
      });
      await mockCircuit.create({
        name: 'Silverstone',
        location: 'Silverstone',
        circuitRef: 'silverstone',
      });

      const result = await circuitService.getAllCircuits({
        search: 'Monte Carlo',
      });

      expect(result.circuits).toHaveLength(1);
      expect(result.circuits[0].location).toBe('Monte Carlo');
    });

    it('should search by circuitRef', async () => {
      await mockCircuit.create({ circuitRef: 'monaco', name: 'Monaco' });
      await mockCircuit.create({
        circuitRef: 'silverstone',
        name: 'Silverstone',
      });

      const result = await circuitService.getAllCircuits({ search: 'monaco' });

      expect(result.circuits).toHaveLength(1);
      expect(result.circuits[0].circuitRef).toBe('monaco');
    });

    it('should search case-insensitively', async () => {
      await mockCircuit.create({ name: 'Monaco', circuitRef: 'monaco' });

      const result = await circuitService.getAllCircuits({ search: 'MONACO' });

      expect(result.circuits).toHaveLength(1);
      expect(result.circuits[0].name).toBe('Monaco');
    });

    it('should combine country filter and search', async () => {
      await mockCircuit.create({
        country: 'Italy',
        name: 'Autodromo Nazionale di Monza',
        circuitRef: 'monza',
      });
      await mockCircuit.create({
        country: 'Italy',
        name: 'Autodromo Enzo e Dino Ferrari',
        circuitRef: 'imola',
      });
      await mockCircuit.create({
        country: 'UK',
        name: 'Silverstone Circuit',
        circuitRef: 'silverstone',
      });

      const result = await circuitService.getAllCircuits({
        country: 'Italy',
        search: 'Monza',
      });

      expect(result.circuits).toHaveLength(1);
      expect(result.circuits[0].name).toContain('Monza');
      expect(result.circuits[0].country).toBe('Italy');
    });

    it('should sort circuits alphabetically by name', async () => {
      await mockCircuit.create({ name: 'Silverstone', circuitRef: 'silver' });
      await mockCircuit.create({ name: 'Monaco', circuitRef: 'monaco' });
      await mockCircuit.create({ name: 'Spa', circuitRef: 'spa' });

      const result = await circuitService.getAllCircuits({});

      expect(result.circuits[0].name).toBe('Monaco');
      expect(result.circuits[1].name).toBe('Silverstone');
      expect(result.circuits[2].name).toBe('Spa');
    });

    it('should handle page numbers less than 1', async () => {
      await mockCircuit.createBatch(5);

      const result = await circuitService.getAllCircuits({ page: 0 });

      expect(result.meta.page).toBe(1);
    });

    it('should handle negative page numbers', async () => {
      await mockCircuit.createBatch(5);

      const result = await circuitService.getAllCircuits({ page: -5 });

      expect(result.meta.page).toBe(1);
    });

    it('should cap limit at 100', async () => {
      await mockCircuit.createBatch(5);

      const result = await circuitService.getAllCircuits({ limit: 200 });

      expect(result.meta.limit).toBe(100);
    });

    it('should use default limit when 0 is provided', async () => {
      await mockCircuit.createBatch(5);

      const result = await circuitService.getAllCircuits({ limit: 0 });

      expect(result.meta.limit).toBe(20);
    });
  });

  describe('getCircuitById', () => {
    it('should return circuit with basic info', async () => {
      const created = await mockCircuit.create({
        name: 'Circuit de Monaco',
        circuitRef: 'monaco',
        location: 'Monte Carlo',
        country: 'Monaco',
        lat: 43.7347,
        lng: 7.42056,
        alt: 7,
      });

      const circuit = await circuitService.getCircuitById(created.id);

      expect(circuit).toBeDefined();
      expect(circuit?.id).toBe(created.id);
      expect(circuit?.name).toBe('Circuit de Monaco');
      expect(circuit?.circuitRef).toBe('monaco');
      expect(circuit?.location).toBe('Monte Carlo');
      expect(circuit?.country).toBe('Monaco');
      expect(circuit?.lat).toBe(43.7347);
      expect(circuit?.lng).toBe(7.42056);
      expect(circuit?.alt).toBe(7);
    });

    it('should return null for non-existent circuit', async () => {
      const circuit = await circuitService.getCircuitById(99999);

      expect(circuit).toBeNull();
    });

    it('should calculate statistics correctly - no races', async () => {
      const created = await mockCircuit.create();

      const circuit = await circuitService.getCircuitById(created.id);

      expect(circuit?.stats).toEqual({
        totalRaces: 0,
        firstRace: undefined,
        lastRace: undefined,
      });
    });

    it('should calculate statistics correctly - with races', async () => {
      const circuit = await mockCircuit.create();
      const season2022 = await mockSeason.create({ year: 2022 });
      const season2023 = await mockSeason.create({ year: 2023 });
      const season2024 = await mockSeason.create({ year: 2024 });

      await mockRace.create(season2022.id, circuit.id, {
        name: 'Monaco Grand Prix',
        round: 1,
      });
      await mockRace.create(season2023.id, circuit.id, {
        name: 'Monaco Grand Prix',
        round: 1,
      });
      await mockRace.create(season2024.id, circuit.id, {
        name: 'Monaco Grand Prix',
        round: 1,
      });

      const result = await circuitService.getCircuitById(circuit.id);

      expect(result?.stats).toEqual({
        totalRaces: 3,
        firstRace: {
          year: 2022,
          name: 'Monaco Grand Prix',
        },
        lastRace: {
          year: 2024,
          name: 'Monaco Grand Prix',
        },
      });
    });

    it('should handle circuit with single race', async () => {
      const circuit = await mockCircuit.create();
      const season = await mockSeason.create({ year: 2024 });

      await mockRace.create(season.id, circuit.id, {
        name: 'Test Grand Prix',
      });

      const result = await circuitService.getCircuitById(circuit.id);

      expect(result?.stats).toEqual({
        totalRaces: 1,
        firstRace: {
          year: 2024,
          name: 'Test Grand Prix',
        },
        lastRace: {
          year: 2024,
          name: 'Test Grand Prix',
        },
      });
    });

    it('should order races chronologically', async () => {
      const circuit = await mockCircuit.create();
      const season2023 = await mockSeason.create({ year: 2023 });
      const season2024 = await mockSeason.create({ year: 2024 });
      const season2022 = await mockSeason.create({ year: 2022 });

      // Create races in non-chronological order
      await mockRace.create(season2023.id, circuit.id, {
        name: 'GP 2023',
        date: new Date('2023-05-01'),
      });
      await mockRace.create(season2024.id, circuit.id, {
        name: 'GP 2024',
        date: new Date('2024-05-01'),
      });
      await mockRace.create(season2022.id, circuit.id, {
        name: 'GP 2022',
        date: new Date('2022-05-01'),
      });

      const result = await circuitService.getCircuitById(circuit.id);

      expect(result?.stats?.firstRace?.year).toBe(2022);
      expect(result?.stats?.lastRace?.year).toBe(2024);
    });

    it('should cache circuit details', async () => {
      const created = await mockCircuit.create();

      // First call - hits database
      const firstCall = await circuitService.getCircuitById(created.id);
      expect(firstCall).toBeDefined();

      // Delete from database
      await testPrisma.circuit.delete({ where: { id: created.id } });

      // Second call - hits cache
      const secondCall = await circuitService.getCircuitById(created.id);
      expect(secondCall).toBeDefined();
      expect(secondCall?.id).toBe(created.id);

      // Verify cache usage
      const cacheStats = cacheService.getStats();
      expect(cacheStats.hits).toBeGreaterThan(0);
    });

    it('should handle circuit with null coordinates', async () => {
      const circuit = await mockCircuit.create({
        lat: null,
        lng: null,
        alt: null,
      });

      const result = await circuitService.getCircuitById(circuit.id);

      expect(result?.lat).toBeNull();
      expect(result?.lng).toBeNull();
      expect(result?.alt).toBeNull();
    });
  });

  describe('getCircuitByRef', () => {
    it('should return circuit by reference', async () => {
      await mockCircuit.create({
        circuitRef: 'monaco',
        name: 'Circuit de Monaco',
      });

      const circuit = await circuitService.getCircuitByRef('monaco');

      expect(circuit).toBeDefined();
      expect(circuit?.circuitRef).toBe('monaco');
      expect(circuit?.name).toBe('Circuit de Monaco');
    });

    it('should return null for non-existent reference', async () => {
      const circuit = await circuitService.getCircuitByRef('nonexistent');

      expect(circuit).toBeNull();
    });

    it('should include statistics like getCircuitById', async () => {
      const circuit = await mockCircuit.create({ circuitRef: 'test_circuit' });
      const season = await mockSeason.create();

      await mockRace.create(season.id, circuit.id, { name: 'Test GP' });

      const result = await circuitService.getCircuitByRef('test_circuit');

      expect(result?.stats?.totalRaces).toBe(1);
    });

    it('should cache circuit by ref', async () => {
      const created = await mockCircuit.create({
        circuitRef: 'cached_circuit',
      });

      // First call
      await circuitService.getCircuitByRef('cached_circuit');

      // Delete from database
      await testPrisma.circuit.delete({ where: { id: created.id } });

      // Second call - from cache
      const cached = await circuitService.getCircuitByRef('cached_circuit');
      expect(cached).toBeDefined();
      expect(cached?.circuitRef).toBe('cached_circuit');
    });
  });

  describe('getCountries', () => {
    it('should return empty array when no circuits exist', async () => {
      const countries = await circuitService.getCountries();

      expect(countries).toEqual([]);
    });

    it('should return unique countries sorted alphabetically', async () => {
      await mockCircuit.create({ country: 'Italy' });
      await mockCircuit.create({ country: 'UK' });
      await mockCircuit.create({ country: 'Monaco' });
      await mockCircuit.create({ country: 'Italy' }); // Duplicate

      const countries = await circuitService.getCountries();

      expect(countries).toEqual(['Italy', 'Monaco', 'UK']);
      expect(countries).toHaveLength(3);
    });

    it('should maintain case from database', async () => {
      await mockCircuit.create({ country: 'United Kingdom' });

      const countries = await circuitService.getCountries();

      expect(countries[0]).toBe('United Kingdom');
    });

    it('should cache countries for 24 hours', async () => {
      await mockCircuit.create({ country: 'Italy' });

      // First call
      await circuitService.getCountries();

      // Add new country
      await mockCircuit.create({ country: 'Spain' });

      // Second call - returns cached value
      const cached = await circuitService.getCountries();
      expect(cached).toEqual(['Italy']);

      // Clear cache and try again
      cacheService.flush();
      const fresh = await circuitService.getCountries();
      expect(fresh).toEqual(['Italy', 'Spain']);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long circuit names', async () => {
      const longName = 'A'.repeat(255);
      const circuit = await mockCircuit.create({ name: longName });

      const result = await circuitService.getCircuitById(circuit.id);

      expect(result?.name).toBe(longName);
    });

    it('should handle special characters in circuit names', async () => {
      await mockCircuit.create({
        name: 'Circuit Gilles-Villeneuve',
        circuitRef: 'villeneuve',
      });

      const result = await circuitService.getAllCircuits({
        search: 'Gilles-Villeneuve',
      });

      expect(result.circuits).toHaveLength(1);
    });

    it('should handle circuits with same name but different locations', async () => {
      await mockCircuit.create({
        name: 'Circuit',
        location: 'City A',
        circuitRef: 'circuit_a',
      });
      await mockCircuit.create({
        name: 'Circuit',
        location: 'City B',
        circuitRef: 'circuit_b',
      });

      const result = await circuitService.getAllCircuits({ search: 'Circuit' });

      expect(result.circuits).toHaveLength(2);
    });

    it('should return empty results for page beyond total pages', async () => {
      await mockCircuit.createBatch(5);

      const result = await circuitService.getAllCircuits({
        page: 10,
        limit: 10,
      });

      expect(result.circuits).toHaveLength(0);
      expect(result.meta.page).toBe(10);
      expect(result.meta.hasNext).toBe(false);
    });

    it('should handle circuit with many races across decades', async () => {
      const circuit = await mockCircuit.create();

      // Create races from 1950 to 2024
      const years = [1950, 1975, 2000, 2024];
      for (const year of years) {
        const season = await mockSeason.create({ year });
        await mockRace.create(season.id, circuit.id, {
          name: `GP ${year}`,
          date: new Date(`${year}-05-01`),
        });
      }

      const result = await circuitService.getCircuitById(circuit.id);

      expect(result?.stats?.totalRaces).toBe(4);
      expect(result?.stats?.firstRace?.year).toBe(1950);
      expect(result?.stats?.lastRace?.year).toBe(2024);
    });

    it('should handle circuits with races in same year', async () => {
      const circuit = await mockCircuit.create();
      const season = await mockSeason.create({ year: 2024 });

      // Two races in same year (like Austria - regular + sprint)
      await mockRace.create(season.id, circuit.id, {
        name: 'Austrian Grand Prix',
        round: 1,
        date: new Date('2024-06-28'),
      });
      await mockRace.create(season.id, circuit.id, {
        name: 'Austrian Grand Prix',
        round: 2,
        date: new Date('2024-06-30'),
      });

      const result = await circuitService.getCircuitById(circuit.id);

      expect(result?.stats?.totalRaces).toBe(2);
    });

    it('should handle extreme coordinates', async () => {
      const circuit = await mockCircuit.create({
        lat: -90.0, // South Pole
        lng: 180.0, // Date line
        alt: -400, // Below sea level
      });

      const result = await circuitService.getCircuitById(circuit.id);

      expect(result?.lat).toBe(-90.0);
      expect(result?.lng).toBe(180.0);
      expect(result?.alt).toBe(-400);
    });

    it('should handle search with empty string', async () => {
      await mockCircuit.createBatch(5);

      const result = await circuitService.getAllCircuits({ search: '' });

      // Empty search should return all circuits
      expect(result.circuits).toHaveLength(5);
    });
  });
});
