import { PrismaClient } from '@prisma/client';
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Create a separate Prisma instance for tests
export const testPrisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
  log: [], // Disable logs during tests for cleaner output
});

/**
 * Global test setup - runs once before all tests IN THIS FILE
 */
beforeAll(async () => {
  // Connect to database
  await testPrisma.$connect();
});

/**
 * Global test teardown - runs once after all tests IN THIS FILE
 */
afterAll(async () => {
  // Clean up after this test file
  await cleanDatabase();

  // Disconnect from database
  await testPrisma.$disconnect();
});

/**
 * Clean database before each test
 * This ensures each test starts with a clean slate
 */
beforeEach(async () => {
  await cleanDatabase();
});

/**
 * Clean up after each test
 */
afterEach(async () => {
  // Additional cleanup if needed
});

/**
 * Clean database - delete all data in correct order
 */
export async function cleanDatabase() {
  // Delete in correct order due to foreign keys
  await testPrisma.driverStanding.deleteMany();
  await testPrisma.constructorStanding.deleteMany();
  await testPrisma.raceResult.deleteMany();
  await testPrisma.qualifyingResult.deleteMany();
  await testPrisma.race.deleteMany();
  await testPrisma.season.deleteMany();
  await testPrisma.circuit.deleteMany();
  await testPrisma.status.deleteMany();
  await testPrisma.driver.deleteMany();
  await testPrisma.team.deleteMany();
}

/**
 * Mock Data Factories
 * Create realistic test data
 */

export const mockDriver = {
  create: async (overrides = {}) => {
    return testPrisma.driver.create({
      data: {
        driverRef: `test_driver_${Date.now()}`,
        number: 44,
        code: 'TST',
        forename: 'Test',
        surname: 'Driver',
        dob: new Date('1990-01-01'),
        nationality: 'British',
        url: 'http://test.com/driver',
        ...overrides,
      },
    });
  },

  createBatch: async (count: number) => {
    const drivers: Awaited<ReturnType<typeof testPrisma.driver.create>>[] = [];
    for (let i = 0; i < count; i++) {
      drivers.push(
        await mockDriver.create({
          driverRef: `test_driver_${Date.now()}_${i}`,
          forename: `Driver${i}`,
          surname: `Test${i}`,
          code: `T${i.toString().padStart(2, '0')}`,
        })
      );
    }
    return drivers;
  },
};

export const mockTeam = {
  create: async (overrides = {}) => {
    return testPrisma.team.create({
      data: {
        teamRef: uniqueId('test_team'),
        name: 'Test Racing Team',
        nationality: 'British',
        url: 'http://test.com/team',
        ...overrides,
      },
    });
  },

  createBatch: async (count: number) => {
    const teams: Awaited<ReturnType<typeof testPrisma.team.create>>[] = [];
    for (let i = 0; i < count; i++) {
      teams.push(
        await mockTeam.create({
          teamRef: uniqueId(`test_team_${i}`),
          name: `Team ${i}`,
        })
      );
    }
    return teams;
  },
};

export const mockCircuit = {
  create: async (overrides = {}) => {
    return testPrisma.circuit.create({
      data: {
        circuitRef: `test_circuit_${Date.now()}`,
        name: 'Test Circuit',
        location: 'Test City',
        country: 'Test Country',
        lat: 51.5074,
        lng: -0.1278,
        alt: 100,
        url: 'http://test.com/circuit',
        ...overrides,
      },
    });
  },

  createBatch: async (count: number) => {
    const circuits: Awaited<ReturnType<typeof testPrisma.circuit.create>>[] =
      [];
    for (let i = 0; i < count; i++) {
      circuits.push(
        await mockCircuit.create({
          circuitRef: `test_circuit_${Date.now()}_${i}`,
          name: `Circuit ${i}`,
          location: `City ${i}`,
        })
      );
    }
    return circuits;
  },
};

export const mockSeason = {
  create: async (overrides = {}) => {
    return testPrisma.season.create({
      data: {
        year: 2024,
        url: 'http://test.com/season/2024',
        ...overrides,
      },
    });
  },

  createBatch: async (years: number[]) => {
    const seasons: Awaited<ReturnType<typeof testPrisma.season.create>>[] = [];
    for (const year of years) {
      seasons.push(
        await mockSeason.create({
          year,
          url: `http://test.com/season/${year}`,
        })
      );
    }
    return seasons;
  },
};

export const mockStatus = {
  create: async (overrides = {}) => {
    return testPrisma.status.create({
      data: {
        status: 'Finished',
        category: 'finished',
        ...overrides,
      },
    });
  },

  createCommon: async () => {
    // Create common status types used in tests
    return {
      finished: await testPrisma.status.create({
        data: { status: 'Finished', category: 'finished' },
      }),
      accident: await testPrisma.status.create({
        data: { status: 'Accident', category: 'accident' },
      }),
      engine: await testPrisma.status.create({
        data: { status: 'Engine', category: 'mechanical' },
      }),
      collision: await testPrisma.status.create({
        data: { status: 'Collision', category: 'accident' },
      }),
    };
  },
};

export const mockRace = {
  create: async (seasonId: number, circuitId: number, overrides = {}) => {
    return testPrisma.race.create({
      data: {
        seasonId,
        circuitId,
        round: 1,
        name: 'Test Grand Prix',
        date: new Date('2024-03-01'),
        time: new Date('1970-01-01T14:00:00Z'),
        url: 'http://test.com/race',
        ...overrides,
      },
    });
  },
};

export const mockQualifyingResult = {
  create: async (
    raceId: number,
    driverId: number,
    teamId: number,
    overrides = {}
  ) => {
    return testPrisma.qualifyingResult.create({
      data: {
        raceId,
        driverId,
        teamId,
        position: 1,
        q1Time: '1:20.123',
        q2Time: '1:19.456',
        q3Time: '1:18.789',
        ...overrides,
      },
    });
  },
};

export const mockRaceResult = {
  create: async (
    raceId: number,
    driverId: number,
    teamId: number,
    statusId: number,
    overrides = {}
  ) => {
    return testPrisma.raceResult.create({
      data: {
        raceId,
        driverId,
        teamId,
        statusId,
        gridPosition: 1,
        position: 1,
        positionText: '1',
        points: 25,
        laps: 50,
        time: '1:30:45.123',
        timeMillis: 5445123,
        ...overrides,
      },
    });
  },
};

export const mockDriverStanding = {
  create: async (raceId: number, driverId: number, overrides = {}) => {
    return testPrisma.driverStanding.create({
      data: {
        raceId,
        driverId,
        points: 25,
        position: 1,
        wins: 1,
        ...overrides,
      },
    });
  },
};

export const mockConstructorStanding = {
  create: async (raceId: number, teamId: number, overrides = {}) => {
    return testPrisma.constructorStanding.create({
      data: {
        raceId,
        teamId,
        points: 44,
        position: 1,
        wins: 1,
        ...overrides,
      },
    });
  },
};

/**
 * Create a complete race weekend with all related data
 * Useful for integration tests
 */
export const mockCompleteRaceWeekend = {
  create: async () => {
    // Create season
    const season = await mockSeason.create({ year: 2024 });

    // Create circuit
    const circuit = await mockCircuit.create({
      circuitRef: 'silverstone',
      name: 'Silverstone Circuit',
      country: 'UK',
    });

    // Create race
    const race = await mockRace.create(season.id, circuit.id, {
      round: 1,
      name: 'British Grand Prix',
    });

    // Create drivers (top 3)
    const driver1 = await mockDriver.create({
      driverRef: 'hamilton',
      forename: 'Lewis',
      surname: 'Hamilton',
      code: 'HAM',
    });
    const driver2 = await mockDriver.create({
      driverRef: 'verstappen',
      forename: 'Max',
      surname: 'Verstappen',
      code: 'VER',
    });
    const driver3 = await mockDriver.create({
      driverRef: 'leclerc',
      forename: 'Charles',
      surname: 'Leclerc',
      code: 'LEC',
    });

    // Create teams
    const team1 = await mockTeam.create({
      teamRef: 'mercedes',
      name: 'Mercedes',
    });
    const team2 = await mockTeam.create({
      teamRef: 'red_bull',
      name: 'Red Bull Racing',
    });
    const team3 = await mockTeam.create({
      teamRef: 'ferrari',
      name: 'Ferrari',
    });

    // Create status
    const statuses = await mockStatus.createCommon();

    // Create qualifying results
    await mockQualifyingResult.create(race.id, driver1.id, team1.id, {
      position: 1,
    });
    await mockQualifyingResult.create(race.id, driver2.id, team2.id, {
      position: 2,
    });
    await mockQualifyingResult.create(race.id, driver3.id, team3.id, {
      position: 3,
    });

    // Create race results
    await mockRaceResult.create(
      race.id,
      driver1.id,
      team1.id,
      statuses.finished.id,
      {
        gridPosition: 1,
        position: 1,
        points: 25,
      }
    );
    await mockRaceResult.create(
      race.id,
      driver2.id,
      team2.id,
      statuses.finished.id,
      {
        gridPosition: 2,
        position: 2,
        points: 18,
      }
    );
    await mockRaceResult.create(
      race.id,
      driver3.id,
      team3.id,
      statuses.finished.id,
      {
        gridPosition: 3,
        position: 3,
        points: 15,
      }
    );

    // Create standings
    await mockDriverStanding.create(race.id, driver1.id, {
      position: 1,
      points: 25,
      wins: 1,
    });
    await mockDriverStanding.create(race.id, driver2.id, {
      position: 2,
      points: 18,
      wins: 0,
    });
    await mockDriverStanding.create(race.id, driver3.id, {
      position: 3,
      points: 15,
      wins: 0,
    });

    await mockConstructorStanding.create(race.id, team1.id, {
      position: 1,
      points: 25,
      wins: 1,
    });
    await mockConstructorStanding.create(race.id, team2.id, {
      position: 2,
      points: 18,
      wins: 0,
    });
    await mockConstructorStanding.create(race.id, team3.id, {
      position: 3,
      points: 15,
      wins: 0,
    });

    return {
      season,
      circuit,
      race,
      drivers: [driver1, driver2, driver3],
      teams: [team1, team2, team3],
      statuses,
    };
  },
};

/**
 * Utility: Wait for a condition to be true
 */
export async function waitFor(
  condition: () => Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error('Timeout waiting for condition');
}

/**
 * Utility: Generate random number
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Utility: Generate unique ID
 */
export function uniqueId(prefix = 'test'): string {
  return `${prefix}_${Date.now()}_${randomInt(1000, 9999)}`;
}
