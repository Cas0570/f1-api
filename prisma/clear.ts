import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database clear...');

  // Clear existing data (in correct order due to foreign keys)
  console.log('🗑️  Clearing existing data...');
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

  console.log('✅ Existing data cleared');
}

main()
  .catch((e) => {
    console.error('❌ Error clearing database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
