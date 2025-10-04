import { PrismaClient } from '@prisma/client';
import { beforeAll, afterAll } from 'vitest';

const prisma = new PrismaClient();

// Setup: Connect to database before all tests
beforeAll(async () => {
  // Ensure database connection
  await prisma.$connect();
});

// Teardown: Disconnect after all tests
afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };
