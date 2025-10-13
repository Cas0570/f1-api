import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Global setup - runs ONCE before all test files
 */
export async function setup() {
  console.log('🔧 Global test setup starting...');

  try {
    // Connect to database
    await prisma.$connect();
    console.log('✓ Test database connected');

    // Clean entire database before starting
    await cleanEntireDatabase();
    console.log('✓ Database cleaned');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

/**
 * Global teardown - runs ONCE after all test files
 */
export async function teardown() {
  console.log('🔧 Global test teardown starting...');

  try {
    // Clean database after all tests
    await cleanEntireDatabase();
    console.log('✓ Database cleaned');

    // Disconnect
    await prisma.$disconnect();
    console.log('✓ Database disconnected');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
  }
}

/**
 * Clean entire database
 */
async function cleanEntireDatabase() {
  // Delete in correct order due to foreign keys
  await prisma.driverStanding.deleteMany();
  await prisma.constructorStanding.deleteMany();
  await prisma.raceResult.deleteMany();
  await prisma.qualifyingResult.deleteMany();
  await prisma.race.deleteMany();
  await prisma.season.deleteMany();
  await prisma.circuit.deleteMany();
  await prisma.status.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.team.deleteMany();
}
