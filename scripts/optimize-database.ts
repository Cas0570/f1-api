import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function optimizeDatabase() {
  console.log('🔧 F1 API Database Optimization');
  console.log('================================\n');

  try {
    console.log('📊 Creating performance indexes...\n');

    // Manually create each index (more reliable than parsing SQL)
    const indexes = [
      {
        name: 'idx_drivers_nationality',
        sql: 'CREATE INDEX IF NOT EXISTS idx_drivers_nationality ON drivers(nationality)',
      },
      {
        name: 'idx_teams_nationality',
        sql: 'CREATE INDEX IF NOT EXISTS idx_teams_nationality ON teams(nationality)',
      },
      {
        name: 'idx_circuits_country',
        sql: 'CREATE INDEX IF NOT EXISTS idx_circuits_country ON circuits(country)',
      },
      {
        name: 'idx_races_date',
        sql: 'CREATE INDEX IF NOT EXISTS idx_races_date ON races(date DESC)',
      },
      {
        name: 'idx_race_results_driver_points',
        sql: 'CREATE INDEX IF NOT EXISTS idx_race_results_driver_points ON race_results(driver_id, points DESC)',
      },
      {
        name: 'idx_race_results_team_points',
        sql: 'CREATE INDEX IF NOT EXISTS idx_race_results_team_points ON race_results(team_id, points DESC)',
      },
      {
        name: 'idx_race_results_wins',
        sql: 'CREATE INDEX IF NOT EXISTS idx_race_results_wins ON race_results(position) WHERE position = 1',
      },
      {
        name: 'idx_qualifying_results_poles',
        sql: 'CREATE INDEX IF NOT EXISTS idx_qualifying_results_poles ON qualifying_results(position) WHERE position = 1',
      },
      {
        name: 'idx_driver_standings_race_position',
        sql: 'CREATE INDEX IF NOT EXISTS idx_driver_standings_race_position ON driver_standings(race_id, position)',
      },
      {
        name: 'idx_constructor_standings_race_position',
        sql: 'CREATE INDEX IF NOT EXISTS idx_constructor_standings_race_position ON constructor_standings(race_id, position)',
      },
    ];

    let createdCount = 0;
    let existedCount = 0;

    for (const index of indexes) {
      try {
        await prisma.$executeRawUnsafe(index.sql);
        console.log(`  ✓ ${index.name}`);
        createdCount++;
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log(`  ⊙ ${index.name} (already exists)`);
          existedCount++;
        } else {
          console.error(`  ✗ ${index.name}:`, error.message.split('\n')[0]);
        }
      }
    }

    console.log('\n📈 Updating table statistics...\n');

    // Update statistics for query planner
    const tables = [
      'drivers',
      'teams',
      'circuits',
      'seasons',
      'races',
      'race_results',
      'qualifying_results',
      'driver_standings',
      'constructor_standings',
      'status',
    ];

    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`ANALYZE ${table}`);
        console.log(`  ✓ Analyzed ${table}`);
      } catch (error: any) {
        console.error(`  ✗ ${table}:`, error.message);
      }
    }

    // Simple count queries to show data volume
    console.log('\n📊 Database Statistics:\n');

    const counts = await Promise.all([
      prisma.driver.count(),
      prisma.team.count(),
      prisma.circuit.count(),
      prisma.season.count(),
      prisma.race.count(),
      prisma.raceResult.count(),
      prisma.qualifyingResult.count(),
      prisma.driverStanding.count(),
      prisma.constructorStanding.count(),
    ]);

    const stats = [
      { table: 'Drivers', count: counts[0] },
      { table: 'Teams', count: counts[1] },
      { table: 'Circuits', count: counts[2] },
      { table: 'Seasons', count: counts[3] },
      { table: 'Races', count: counts[4] },
      { table: 'Race Results', count: counts[5] },
      { table: 'Qualifying Results', count: counts[6] },
      { table: 'Driver Standings', count: counts[7] },
      { table: 'Constructor Standings', count: counts[8] },
    ];

    stats.forEach((stat) => {
      console.log(
        `  ${stat.table.padEnd(25)} ${stat.count.toLocaleString().padStart(8)} records`
      );
    });

    console.log('\n✅ Database Optimization Complete!\n');
    console.log(`   - Indexes created: ${createdCount}`);
    console.log(`   - Already existed: ${existedCount}`);
    console.log(`   - Tables analyzed: ${tables.length}\n`);

    console.log('🚀 Your database is now optimized for performance!');
    console.log('   Query performance should be significantly improved.\n');
  } catch (error: any) {
    console.error('\n❌ Optimization failed:', error);
    console.error('\nError details:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

optimizeDatabase();
