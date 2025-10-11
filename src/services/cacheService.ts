import NodeCache from 'node-cache';

/**
 * Cache Service
 * In-memory caching for frequently accessed data
 */
class CacheService {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: 3600, // 1 hour default TTL
      checkperiod: 600, // Check for expired keys every 10 minutes
      useClones: false, // Better performance, but be careful with mutations
    });
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttl?: number): boolean {
    if (ttl) {
      return this.cache.set(key, value, ttl);
    }
    return this.cache.set(key, value);
  }

  /**
   * Delete key from cache
   */
  del(key: string): number {
    return this.cache.del(key);
  }

  /**
   * Delete multiple keys
   */
  delMultiple(keys: string[]): number {
    return this.cache.del(keys);
  }

  /**
   * Clear entire cache
   */
  flush(): void {
    this.cache.flushAll();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return this.cache.getStats();
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return this.cache.keys();
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Cache key builders for consistency
export const CacheKeys = {
  driver: (id: number) => `driver:${id}`,
  driverByRef: (ref: string) => `driver:ref:${ref}`,
  driverNationalities: () => 'driver:nationalities',

  team: (id: number) => `team:${id}`,
  teamByRef: (ref: string) => `team:ref:${ref}`,
  teamNationalities: () => 'team:nationalities',

  circuit: (id: number) => `circuit:${id}`,
  circuitByRef: (ref: string) => `circuit:ref:${ref}`,
  circuitCountries: () => 'circuit:countries',

  season: (id: number) => `season:${id}`,
  seasonByYear: (year: number) => `season:year:${year}`,

  race: (id: number) => `race:${id}`,
  raceBySeason: (year: number) => `race:season:${year}`,
  raceResults: (id: number) => `race:${id}:results`,
  raceQualifying: (id: number) => `race:${id}:qualifying`,

  driverStandings: (season?: number, round?: number) =>
    `standings:drivers:${season || 'latest'}:${round || 'final'}`,
  constructorStandings: (season?: number, round?: number) =>
    `standings:constructors:${season || 'latest'}:${round || 'final'}`,
};
