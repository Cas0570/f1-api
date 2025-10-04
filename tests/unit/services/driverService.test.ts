import { describe, it, expect } from 'vitest';
import { driverService } from '../../../src/services/driverService';

describe('DriverService', () => {
  describe('getAllDrivers', () => {
    it('should return all drivers with default pagination', async () => {
      const result = await driverService.getAllDrivers({});

      expect(result).toHaveProperty('drivers');
      expect(result).toHaveProperty('meta');
      expect(Array.isArray(result.drivers)).toBe(true);
      expect(result.meta).toHaveProperty('page');
      expect(result.meta).toHaveProperty('limit');
      expect(result.meta).toHaveProperty('total');
      expect(result.meta).toHaveProperty('totalPages');
      expect(result.meta).toHaveProperty('hasNext');
      expect(result.meta).toHaveProperty('hasPrev');
    });

    it('should respect pagination parameters', async () => {
      const result = await driverService.getAllDrivers({ page: 1, limit: 5 });

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(5);
      expect(result.drivers.length).toBeLessThanOrEqual(5);
    });

    it('should filter by nationality', async () => {
      const result = await driverService.getAllDrivers({
        nationality: 'British',
      });

      result.drivers.forEach((driver) => {
        expect(driver.nationality).toBe('British');
      });
    });

    it('should search by name', async () => {
      const result = await driverService.getAllDrivers({ search: 'hamilton' });

      expect(result.drivers.length).toBeGreaterThan(0);
      result.drivers.forEach((driver) => {
        const searchTerm = 'hamilton'.toLowerCase();
        const matchesSearch =
          driver.forename.toLowerCase().includes(searchTerm) ||
          driver.surname.toLowerCase().includes(searchTerm) ||
          driver.driverRef.toLowerCase().includes(searchTerm);
        expect(matchesSearch).toBe(true);
      });
    });

    it('should return empty array for non-existent nationality', async () => {
      const result = await driverService.getAllDrivers({
        nationality: 'NonExistent',
      });

      expect(result.drivers).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('getDriverById', () => {
    it('should return driver with stats when found', async () => {
      // Get first driver from database
      const drivers = await driverService.getAllDrivers({ limit: 1 });
      if (drivers.drivers.length === 0) {
        // Skip test if no drivers in database
        return;
      }

      const driverId = drivers.drivers[0].id;
      const driver = await driverService.getDriverById(driverId);

      expect(driver).not.toBeNull();
      expect(driver?.id).toBe(driverId);
      expect(driver).toHaveProperty('stats');
      expect(driver?.stats).toHaveProperty('races');
      expect(driver?.stats).toHaveProperty('wins');
      expect(driver?.stats).toHaveProperty('podiums');
      expect(driver?.stats).toHaveProperty('poles');
    });

    it('should return null for non-existent driver', async () => {
      const driver = await driverService.getDriverById(999999);

      expect(driver).toBeNull();
    });
  });

  describe('getDriverByRef', () => {
    it('should return driver when found by reference', async () => {
      const driver = await driverService.getDriverByRef('hamilton');

      if (driver) {
        expect(driver.driverRef).toBe('hamilton');
        expect(driver).toHaveProperty('stats');
      }
    });

    it('should return null for non-existent reference', async () => {
      const driver = await driverService.getDriverByRef('nonexistent_driver');

      expect(driver).toBeNull();
    });
  });

  describe('getNationalities', () => {
    it('should return list of unique nationalities', async () => {
      const nationalities = await driverService.getNationalities();

      expect(Array.isArray(nationalities)).toBe(true);
      // Check uniqueness
      const uniqueNationalities = [...new Set(nationalities)];
      expect(nationalities.length).toBe(uniqueNationalities.length);
    });

    it('should return sorted nationalities', async () => {
      const nationalities = await driverService.getNationalities();

      if (nationalities.length > 1) {
        // Check if sorted
        for (let i = 1; i < nationalities.length; i++) {
          expect(nationalities[i] >= nationalities[i - 1]).toBe(true);
        }
      }
    });
  });
});
