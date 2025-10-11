import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const BASE_URL = 'https://api.jolpi.ca/ergast/f1';

// Rate limiting - reasonable delays
const DELAY_BETWEEN_REQUESTS = 300; // 300ms between requests
const DELAY_BETWEEN_SEASONS = 1000; // 1 second between seasons
const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 5000; // 5 seconds

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface ImportStats {
  drivers: number;
  teams: number;
  circuits: number;
  seasons: number;
  races: number;
  qualifyingResults: number;
  raceResults: number;
  status: number;
  driverStandings: number;
  constructorStandings: number;
}

const stats: ImportStats = {
  drivers: 0,
  teams: 0,
  circuits: 0,
  seasons: 0,
  races: 0,
  qualifyingResults: 0,
  raceResults: 0,
  status: 0,
  driverStandings: 0,
  constructorStandings: 0,
};

/**
 * Fetch with retry and exponential backoff
 */
async function fetchWithRetry(url: string, retryCount = 0): Promise<any> {
  try {
    const response = await axios.get(url);
    return response;
  } catch (error: any) {
    if (error.response?.status === 429) {
      if (retryCount >= MAX_RETRIES) {
        throw new Error(`Max retries exceeded for ${url}`);
      }

      const backoffTime = INITIAL_BACKOFF * Math.pow(2, retryCount);
      console.log(
        `    ⏳ Rate limited! Waiting ${backoffTime / 1000}s... (retry ${retryCount + 1}/${MAX_RETRIES})`
      );

      await delay(backoffTime);
      return fetchWithRetry(url, retryCount + 1);
    }
    throw error;
  }
}

/**
 * Fetch all pages from paginated endpoint
 */
async function fetchAll<T>(endpoint: string): Promise<T[]> {
  const results: T[] = [];
  let offset = 0;
  const limit = 100;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const url = `${BASE_URL}/${endpoint}.json?limit=${limit}&offset=${offset}`;
    const response = await fetchWithRetry(url);
    const data = response.data.MRData;

    let items: T[] = [];
    if (data.DriverTable) items = data.DriverTable.Drivers || [];
    else if (data.ConstructorTable)
      items = data.ConstructorTable.Constructors || [];
    else if (data.CircuitTable) items = data.CircuitTable.Circuits || [];
    else if (data.SeasonTable) items = data.SeasonTable.Seasons || [];
    else if (data.StatusTable) items = data.StatusTable.Status || [];

    if (items.length === 0) break;
    results.push(...items);

    const total = parseInt(data.total);
    if (results.length >= total) break;

    offset += limit;
    await delay(DELAY_BETWEEN_REQUESTS);
  }

  return results;
}

function categorizeStatus(status: string): string {
  const finished = [
    'Finished',
    '+1 Lap',
    '+2 Laps',
    '+3 Laps',
    '+4 Laps',
    '+5 Laps',
  ];
  const mechanical = [
    'Engine',
    'Gearbox',
    'Transmission',
    'Clutch',
    'Hydraulics',
    'Electrical',
    'Oil pressure',
    'Fuel pressure',
    'Overheating',
    'Cooling system',
    'Throttle',
    'Suspension',
    'Brakes',
    'Differential',
    'Wheel',
    'Wheel nut',
    'Puncture',
    'Driveshaft',
    'Radiator',
    'ERS',
    'Power Unit',
    'Turbo',
  ];
  const accident = [
    'Accident',
    'Collision',
    'Spun off',
    'Collision damage',
    'Damage',
    'Fatal accident',
  ];
  const disqualified = ['Disqualified', 'Excluded'];

  if (finished.includes(status)) return 'finished';
  if (mechanical.some((m) => status.includes(m))) return 'mechanical';
  if (accident.some((a) => status.includes(a))) return 'accident';
  if (disqualified.includes(status)) return 'disqualified';
  return 'other';
}

async function importStatus() {
  console.log('\n📝 Importing status records...');
  const statuses = await fetchAll<any>('status');

  for (const status of statuses) {
    await prisma.status.upsert({
      where: { id: parseInt(status.statusId) },
      update: {},
      create: {
        id: parseInt(status.statusId),
        status: status.status,
        category: categorizeStatus(status.status),
      },
    });
    stats.status++;
  }

  console.log(`✅ Imported ${stats.status} status records`);
}

async function importDrivers() {
  console.log('\n👤 Importing drivers...');
  const drivers = await fetchAll<any>('drivers');

  for (const driver of drivers) {
    await prisma.driver.upsert({
      where: { driverRef: driver.driverId },
      update: {},
      create: {
        driverRef: driver.driverId,
        number: driver.permanentNumber
          ? parseInt(driver.permanentNumber)
          : null,
        code: driver.code || null,
        forename: driver.givenName,
        surname: driver.familyName,
        dob: new Date(driver.dateOfBirth),
        nationality: driver.nationality,
        url: driver.url,
      },
    });
    stats.drivers++;
  }

  console.log(`✅ Imported ${stats.drivers} drivers`);
}

async function importTeams() {
  console.log('\n🏎️  Importing teams...');
  const constructors = await fetchAll<any>('constructors');

  for (const constructor of constructors) {
    await prisma.team.upsert({
      where: { teamRef: constructor.constructorId },
      update: {},
      create: {
        teamRef: constructor.constructorId,
        name: constructor.name,
        nationality: constructor.nationality,
        url: constructor.url,
      },
    });
    stats.teams++;
  }

  console.log(`✅ Imported ${stats.teams} teams`);
}

async function importCircuits() {
  console.log('\n🏁 Importing circuits...');
  const circuits = await fetchAll<any>('circuits');

  for (const circuit of circuits) {
    await prisma.circuit.upsert({
      where: { circuitRef: circuit.circuitId },
      update: {},
      create: {
        circuitRef: circuit.circuitId,
        name: circuit.circuitName,
        location: circuit.Location.locality,
        country: circuit.Location.country,
        lat: parseFloat(circuit.Location.lat),
        lng: parseFloat(circuit.Location.long),
        alt: circuit.Location.alt ? parseInt(circuit.Location.alt) : null,
        url: circuit.url,
      },
    });
    stats.circuits++;
  }

  console.log(`✅ Imported ${stats.circuits} circuits`);
}

async function importSeasons() {
  console.log('\n📅 Importing seasons...');
  const seasons = await fetchAll<any>('seasons');

  for (const season of seasons) {
    await prisma.season.upsert({
      where: { year: parseInt(season.season) },
      update: {},
      create: {
        year: parseInt(season.season),
        url: season.url,
      },
    });
    stats.seasons++;
  }

  console.log(`✅ Imported ${stats.seasons} seasons`);
}

/**
 * Import all races and related data
 * NEW APPROACH: Batch import by season instead of per-race
 */
async function importRaces() {
  console.log('\n🏆 Importing races...');
  console.log('💡 Using batch import by season (much faster!)\n');

  const seasons = await prisma.season.findMany({
    orderBy: { year: 'asc' },
  });

  for (const season of seasons) {
    console.log(`  📅 Season ${season.year}...`);

    try {
      // 1. Get all races for this season
      await importRacesForSeason(season);
      await delay(DELAY_BETWEEN_REQUESTS);

      // 2. Get all qualifying results for this season (one API call!)
      await importQualifyingForSeason(season.id, season.year);
      await delay(DELAY_BETWEEN_REQUESTS);

      // 3. Get all race results for this season (one API call!)
      await importResultsForSeason(season.id, season.year);
      await delay(DELAY_BETWEEN_REQUESTS);

      // 4. Get final standings for this season
      await importStandingsForSeason(season.id, season.year);
      await delay(DELAY_BETWEEN_SEASONS);

      console.log(`    ✅ Completed ${season.year}`);
    } catch (error: any) {
      console.error(
        `    ❌ Error importing season ${season.year}:`,
        error.message
      );
    }
  }

  console.log(`\n✅ Imported ${stats.races} races`);
}

async function importRacesForSeason(season: any) {
  try {
    const response = await fetchWithRetry(
      `${BASE_URL}/${season.year}.json?limit=100`
    );
    const races = response.data.MRData.RaceTable.Races || [];

    for (const race of races) {
      const circuit = await prisma.circuit.findUnique({
        where: { circuitRef: race.Circuit.circuitId },
      });

      if (!circuit) continue;

      const raceDate = new Date(race.date);
      let raceTime: Date | null = null;
      if (race.time) {
        const [hours, minutes, seconds] = race.time.replace('Z', '').split(':');
        raceTime = new Date(`1970-01-01T${hours}:${minutes}:${seconds}Z`);
      }

      await prisma.race.upsert({
        where: {
          seasonId_round: {
            seasonId: season.id,
            round: parseInt(race.round),
          },
        },
        update: {},
        create: {
          seasonId: season.id,
          circuitId: circuit.id,
          round: parseInt(race.round),
          name: race.raceName,
          date: raceDate,
          time: raceTime,
          url: race.url,
        },
      });

      stats.races++;
    }
  } catch (error: any) {
    console.error(`      ⚠️  Could not fetch races`);
  }
}

async function importQualifyingForSeason(seasonId: number, year: number) {
  try {
    // ONE API CALL for entire season!
    const response = await fetchWithRetry(
      `${BASE_URL}/${year}/qualifying.json?limit=1000`
    );
    const races = response.data.MRData.RaceTable.Races || [];

    for (const race of races) {
      const dbRace = await prisma.race.findFirst({
        where: {
          seasonId: seasonId,
          round: parseInt(race.round),
        },
      });

      if (!dbRace) continue;

      const results = race.QualifyingResults || [];
      for (const result of results) {
        const driver = await prisma.driver.findUnique({
          where: { driverRef: result.Driver.driverId },
        });
        const team = await prisma.team.findUnique({
          where: { teamRef: result.Constructor.constructorId },
        });

        if (!driver || !team) continue;

        await prisma.qualifyingResult.upsert({
          where: {
            raceId_driverId: {
              raceId: dbRace.id,
              driverId: driver.id,
            },
          },
          update: {},
          create: {
            raceId: dbRace.id,
            driverId: driver.id,
            teamId: team.id,
            position: parseInt(result.position),
            q1Time: result.Q1 || null,
            q2Time: result.Q2 || null,
            q3Time: result.Q3 || null,
          },
        });

        stats.qualifyingResults++;
      }
    }
  } catch (error: any) {
    // Qualifying data might not exist for older seasons
  }
}

async function importResultsForSeason(seasonId: number, year: number) {
  try {
    // ONE API CALL for entire season!
    const response = await fetchWithRetry(
      `${BASE_URL}/${year}/results.json?limit=1000`
    );
    const races = response.data.MRData.RaceTable.Races || [];

    for (const race of races) {
      const dbRace = await prisma.race.findFirst({
        where: {
          seasonId: seasonId,
          round: parseInt(race.round),
        },
      });

      if (!dbRace) continue;

      const results = race.Results || [];
      for (const result of results) {
        const driver = await prisma.driver.findUnique({
          where: { driverRef: result.Driver.driverId },
        });
        const team = await prisma.team.findUnique({
          where: { teamRef: result.Constructor.constructorId },
        });
        const status = await prisma.status.findFirst({
          where: { status: result.status },
        });

        if (!driver || !team || !status) continue;

        await prisma.raceResult.upsert({
          where: {
            raceId_driverId: {
              raceId: dbRace.id,
              driverId: driver.id,
            },
          },
          update: {},
          create: {
            raceId: dbRace.id,
            driverId: driver.id,
            teamId: team.id,
            gridPosition: parseInt(result.grid),
            position: result.position ? parseInt(result.position) : null,
            positionText: result.positionText,
            points: parseFloat(result.points),
            laps: parseInt(result.laps),
            time: result.Time?.time || null,
            timeMillis: result.Time?.millis
              ? parseInt(result.Time.millis)
              : null,
            statusId: status.id,
          },
        });

        stats.raceResults++;
      }
    }
  } catch (error: any) {
    console.error(`      ⚠️  Could not fetch results`);
  }
}

async function importStandingsForSeason(seasonId: number, year: number) {
  try {
    // Get the last race of the season
    const lastRace = await prisma.race.findFirst({
      where: { seasonId: seasonId },
      orderBy: { round: 'desc' },
    });

    if (!lastRace) return;

    // Driver standings
    const driverResponse = await fetchWithRetry(
      `${BASE_URL}/${year}/driverStandings.json`
    );
    const driverStandings =
      driverResponse.data.MRData.StandingsTable.StandingsLists[0]
        ?.DriverStandings || [];

    for (const standing of driverStandings) {
      const driver = await prisma.driver.findUnique({
        where: { driverRef: standing.Driver.driverId },
      });

      if (!driver) continue;

      await prisma.driverStanding.upsert({
        where: {
          raceId_driverId: {
            raceId: lastRace.id,
            driverId: driver.id,
          },
        },
        update: {},
        create: {
          raceId: lastRace.id,
          driverId: driver.id,
          points: parseFloat(standing.points),
          position: parseInt(standing.position),
          wins: parseInt(standing.wins),
        },
      });

      stats.driverStandings++;
    }

    await delay(DELAY_BETWEEN_REQUESTS);

    // Constructor standings
    const constructorResponse = await fetchWithRetry(
      `${BASE_URL}/${year}/constructorStandings.json`
    );
    const constructorStandings =
      constructorResponse.data.MRData.StandingsTable.StandingsLists[0]
        ?.ConstructorStandings || [];

    for (const standing of constructorStandings) {
      const team = await prisma.team.findUnique({
        where: { teamRef: standing.Constructor.constructorId },
      });

      if (!team) continue;

      await prisma.constructorStanding.upsert({
        where: {
          raceId_teamId: {
            raceId: lastRace.id,
            teamId: team.id,
          },
        },
        update: {},
        create: {
          raceId: lastRace.id,
          teamId: team.id,
          points: parseFloat(standing.points),
          position: parseInt(standing.position),
          wins: parseInt(standing.wins),
        },
      });

      stats.constructorStandings++;
    }
  } catch (error: any) {
    // Standings might not exist for very old seasons
  }
}

async function main() {
  console.log('🏁 F1 Data Import from Jolpica F1 API');
  console.log('=====================================\n');
  console.log('Source: https://api.jolpi.ca/ergast/f1');
  console.log('⚡ Using BATCH import - much faster!\n');

  const startTime = Date.now();

  try {
    await importStatus();
    await importDrivers();
    await importTeams();
    await importCircuits();
    await importSeasons();
    await importRaces(); // Now batch imports!

    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);

    console.log('\n\n🎉 IMPORT COMPLETE!');
    console.log('==================');
    console.log(`\n⏱️  Total time: ${duration} minutes\n`);
    console.log('📊 Import Summary:');
    console.log(`   - Status records: ${stats.status}`);
    console.log(`   - Drivers: ${stats.drivers}`);
    console.log(`   - Teams: ${stats.teams}`);
    console.log(`   - Circuits: ${stats.circuits}`);
    console.log(`   - Seasons: ${stats.seasons}`);
    console.log(`   - Races: ${stats.races}`);
    console.log(`   - Qualifying results: ${stats.qualifyingResults}`);
    console.log(`   - Race results: ${stats.raceResults}`);
    console.log(`   - Driver standings: ${stats.driverStandings}`);
    console.log(`   - Constructor standings: ${stats.constructorStandings}`);
    console.log('\n✅ Your F1 API now has 75 years of historical data!');
    console.log('🚀 Try it out: http://localhost:3000/docs\n');
  } catch (error) {
    console.error('\n❌ IMPORT FAILED:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
