import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

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

  // 1. Create Status records
  console.log('📝 Creating status records...');
  const statusFinished = await prisma.status.create({
    data: { status: 'Finished', category: 'finished' },
  });
  const statusAccident = await prisma.status.create({
    data: { status: 'Accident', category: 'accident' },
  });
  const statusEngine = await prisma.status.create({
    data: { status: 'Engine', category: 'mechanical' },
  });
  const statusCollision = await prisma.status.create({
    data: { status: 'Collision', category: 'accident' },
  });
  const statusGearbox = await prisma.status.create({
    data: { status: 'Gearbox', category: 'mechanical' },
  });

  // 2. Create Teams
  console.log('🏎️  Creating teams...');
  const mercedes = await prisma.team.create({
    data: {
      teamRef: 'mercedes',
      name: 'Mercedes',
      nationality: 'German',
      url: 'http://en.wikipedia.org/wiki/Mercedes-Benz_in_Formula_One',
    },
  });

  const redBull = await prisma.team.create({
    data: {
      teamRef: 'red_bull',
      name: 'Red Bull Racing',
      nationality: 'Austrian',
      url: 'http://en.wikipedia.org/wiki/Red_Bull_Racing',
    },
  });

  const ferrari = await prisma.team.create({
    data: {
      teamRef: 'ferrari',
      name: 'Ferrari',
      nationality: 'Italian',
      url: 'http://en.wikipedia.org/wiki/Scuderia_Ferrari',
    },
  });

  const mclaren = await prisma.team.create({
    data: {
      teamRef: 'mclaren',
      name: 'McLaren',
      nationality: 'British',
      url: 'http://en.wikipedia.org/wiki/McLaren',
    },
  });

  // 3. Create Drivers
  console.log('👤 Creating drivers...');
  const hamilton = await prisma.driver.create({
    data: {
      driverRef: 'hamilton',
      number: 44,
      code: 'HAM',
      forename: 'Lewis',
      surname: 'Hamilton',
      dob: new Date('1985-01-07'),
      nationality: 'British',
      url: 'http://en.wikipedia.org/wiki/Lewis_Hamilton',
    },
  });

  const verstappen = await prisma.driver.create({
    data: {
      driverRef: 'max_verstappen',
      number: 1,
      code: 'VER',
      forename: 'Max',
      surname: 'Verstappen',
      dob: new Date('1997-09-30'),
      nationality: 'Dutch',
      url: 'http://en.wikipedia.org/wiki/Max_Verstappen',
    },
  });

  const leclerc = await prisma.driver.create({
    data: {
      driverRef: 'leclerc',
      number: 16,
      code: 'LEC',
      forename: 'Charles',
      surname: 'Leclerc',
      dob: new Date('1997-10-16'),
      nationality: 'Monegasque',
      url: 'http://en.wikipedia.org/wiki/Charles_Leclerc',
    },
  });

  const norris = await prisma.driver.create({
    data: {
      driverRef: 'norris',
      number: 4,
      code: 'NOR',
      forename: 'Lando',
      surname: 'Norris',
      dob: new Date('1999-11-13'),
      nationality: 'British',
      url: 'http://en.wikipedia.org/wiki/Lando_Norris',
    },
  });

  const russell = await prisma.driver.create({
    data: {
      driverRef: 'russell',
      number: 63,
      code: 'RUS',
      forename: 'George',
      surname: 'Russell',
      dob: new Date('1998-02-15'),
      nationality: 'British',
      url: 'http://en.wikipedia.org/wiki/George_Russell_(racing_driver)',
    },
  });

  const alonso = await prisma.driver.create({
    data: {
      driverRef: 'alonso',
      number: 14,
      code: 'ALO',
      forename: 'Fernando',
      surname: 'Alonso',
      dob: new Date('1981-07-29'),
      nationality: 'Spanish',
      url: 'http://en.wikipedia.org/wiki/Fernando_Alonso',
    },
  });

  const sainz = await prisma.driver.create({
    data: {
      driverRef: 'sainz',
      number: 55,
      code: 'SAI',
      forename: 'Carlos',
      surname: 'Sainz Jr.',
      dob: new Date('1994-09-01'),
      nationality: 'Spanish',
      url: 'http://en.wikipedia.org/wiki/Carlos_Sainz_Jr.',
    },
  });

  const perez = await prisma.driver.create({
    data: {
      driverRef: 'perez',
      number: 11,
      code: 'PER',
      forename: 'Sergio',
      surname: 'Pérez',
      dob: new Date('1990-01-26'),
      nationality: 'Mexican',
      url: 'http://en.wikipedia.org/wiki/Sergio_P%C3%A9rez',
    },
  });

  // 4. Create Circuits
  console.log('🏁 Creating circuits...');
  const monza = await prisma.circuit.create({
    data: {
      circuitRef: 'monza',
      name: 'Autodromo Nazionale di Monza',
      location: 'Monza',
      country: 'Italy',
      lat: 45.6156,
      lng: 9.28111,
      alt: 162,
      url: 'http://en.wikipedia.org/wiki/Autodromo_Nazionale_Monza',
    },
  });

  const silverstone = await prisma.circuit.create({
    data: {
      circuitRef: 'silverstone',
      name: 'Silverstone Circuit',
      location: 'Silverstone',
      country: 'UK',
      lat: 52.0786,
      lng: -1.01694,
      alt: 153,
      url: 'http://en.wikipedia.org/wiki/Silverstone_Circuit',
    },
  });

  const spa = await prisma.circuit.create({
    data: {
      circuitRef: 'spa',
      name: 'Circuit de Spa-Francorchamps',
      location: 'Spa',
      country: 'Belgium',
      lat: 50.4372,
      lng: 5.97139,
      alt: 401,
      url: 'http://en.wikipedia.org/wiki/Circuit_de_Spa-Francorchamps',
    },
  });

  // 5. Create Seasons
  console.log('📅 Creating seasons...');
  const season2024 = await prisma.season.create({
    data: {
      year: 2024,
      url: 'http://en.wikipedia.org/wiki/2024_Formula_One_World_Championship',
    },
  });

  const season2023 = await prisma.season.create({
    data: {
      year: 2023,
      url: 'http://en.wikipedia.org/wiki/2023_Formula_One_World_Championship',
    },
  });

  // 6. Create Races
  console.log('🏆 Creating races...');
  const italianGP2024 = await prisma.race.create({
    data: {
      seasonId: season2024.id,
      circuitId: monza.id,
      round: 16,
      name: 'Italian Grand Prix',
      date: new Date('2024-09-01'),
      time: new Date('1970-01-01T13:00:00Z'),
      url: 'http://en.wikipedia.org/wiki/2024_Italian_Grand_Prix',
    },
  });

  const britishGP2024 = await prisma.race.create({
    data: {
      seasonId: season2024.id,
      circuitId: silverstone.id,
      round: 12,
      name: 'British Grand Prix',
      date: new Date('2024-07-07'),
      time: new Date('1970-01-01T14:00:00Z'),
      url: 'http://en.wikipedia.org/wiki/2024_British_Grand_Prix',
    },
  });

  const belgianGP2023 = await prisma.race.create({
    data: {
      seasonId: season2023.id,
      circuitId: spa.id,
      round: 14,
      name: 'Belgian Grand Prix',
      date: new Date('2023-07-30'),
      time: new Date('1970-01-01T13:00:00Z'),
      url: 'http://en.wikipedia.org/wiki/2023_Belgian_Grand_Prix',
    },
  });

  // 7. Create Qualifying Results
  console.log('⏱️  Creating qualifying results...');

  // Italian GP 2024 Qualifying
  await prisma.qualifyingResult.createMany({
    data: [
      {
        raceId: italianGP2024.id,
        driverId: norris.id,
        teamId: mclaren.id,
        position: 1,
        q1Time: '1:19.456',
        q2Time: '1:19.234',
        q3Time: '1:19.327',
      },
      {
        raceId: italianGP2024.id,
        driverId: verstappen.id,
        teamId: redBull.id,
        position: 2,
        q1Time: '1:19.567',
        q2Time: '1:19.345',
        q3Time: '1:19.438',
      },
      {
        raceId: italianGP2024.id,
        driverId: russell.id,
        teamId: mercedes.id,
        position: 3,
        q1Time: '1:19.678',
        q2Time: '1:19.456',
        q3Time: '1:19.549',
      },
      {
        raceId: italianGP2024.id,
        driverId: leclerc.id,
        teamId: ferrari.id,
        position: 4,
        q1Time: '1:19.789',
        q2Time: '1:19.567',
        q3Time: '1:19.660',
      },
    ],
  });

  // British GP 2024 Qualifying
  await prisma.qualifyingResult.createMany({
    data: [
      {
        raceId: britishGP2024.id,
        driverId: russell.id,
        teamId: mercedes.id,
        position: 1,
        q1Time: '1:25.123',
        q2Time: '1:24.987',
        q3Time: '1:25.819',
      },
      {
        raceId: britishGP2024.id,
        driverId: hamilton.id,
        teamId: mercedes.id,
        position: 2,
        q1Time: '1:25.234',
        q2Time: '1:25.098',
        q3Time: '1:25.990',
      },
      {
        raceId: britishGP2024.id,
        driverId: norris.id,
        teamId: mclaren.id,
        position: 3,
        q1Time: '1:25.345',
        q2Time: '1:25.209',
        q3Time: '1:26.101',
      },
    ],
  });

  // 8. Create Race Results
  console.log('🏁 Creating race results...');

  // Italian GP 2024 Results
  await prisma.raceResult.createMany({
    data: [
      {
        raceId: italianGP2024.id,
        driverId: leclerc.id,
        teamId: ferrari.id,
        gridPosition: 4,
        position: 1,
        positionText: '1',
        points: 25,
        laps: 53,
        time: '1:14:27.001',
        timeMillis: 4467001,
        statusId: statusFinished.id,
      },
      {
        raceId: italianGP2024.id,
        driverId: norris.id,
        teamId: mclaren.id,
        gridPosition: 1,
        position: 2,
        positionText: '2',
        points: 18,
        laps: 53,
        time: '+2.664',
        timeMillis: 4469665,
        statusId: statusFinished.id,
      },
      {
        raceId: italianGP2024.id,
        driverId: verstappen.id,
        teamId: redBull.id,
        gridPosition: 2,
        position: 3,
        positionText: '3',
        points: 15,
        laps: 53,
        time: '+6.153',
        timeMillis: 4473154,
        statusId: statusFinished.id,
      },
      {
        raceId: italianGP2024.id,
        driverId: russell.id,
        teamId: mercedes.id,
        gridPosition: 3,
        position: 4,
        positionText: '4',
        points: 12,
        laps: 53,
        time: '+8.741',
        timeMillis: 4475742,
        statusId: statusFinished.id,
      },
    ],
  });

  // British GP 2024 Results
  await prisma.raceResult.createMany({
    data: [
      {
        raceId: britishGP2024.id,
        driverId: hamilton.id,
        teamId: mercedes.id,
        gridPosition: 2,
        position: 1,
        positionText: '1',
        points: 25,
        laps: 52,
        time: '1:22:27.095',
        timeMillis: 4947095,
        statusId: statusFinished.id,
      },
      {
        raceId: britishGP2024.id,
        driverId: verstappen.id,
        teamId: redBull.id,
        gridPosition: 4,
        position: 2,
        positionText: '2',
        points: 18,
        laps: 52,
        time: '+1.465',
        timeMillis: 4948560,
        statusId: statusFinished.id,
      },
      {
        raceId: britishGP2024.id,
        driverId: norris.id,
        teamId: mclaren.id,
        gridPosition: 3,
        position: 3,
        positionText: '3',
        points: 15,
        laps: 52,
        time: '+7.547',
        timeMillis: 4954642,
        statusId: statusFinished.id,
      },
    ],
  });

  // Belgian GP 2023 Results
  await prisma.raceResult.createMany({
    data: [
      {
        raceId: belgianGP2023.id,
        driverId: verstappen.id,
        teamId: redBull.id,
        gridPosition: 6,
        position: 1,
        positionText: '1',
        points: 25,
        laps: 44,
        time: '1:22:30.450',
        timeMillis: 4950450,
        statusId: statusFinished.id,
      },
      {
        raceId: belgianGP2023.id,
        driverId: perez.id,
        teamId: redBull.id,
        gridPosition: 2,
        position: 2,
        positionText: '2',
        points: 18,
        laps: 44,
        time: '+22.305',
        timeMillis: 4972755,
        statusId: statusFinished.id,
      },
      {
        raceId: belgianGP2023.id,
        driverId: leclerc.id,
        teamId: ferrari.id,
        gridPosition: 3,
        position: 3,
        positionText: '3',
        points: 15,
        laps: 44,
        time: '+32.259',
        timeMillis: 4982709,
        statusId: statusFinished.id,
      },
    ],
  });

  // 9. Create Driver Standings
  console.log('📊 Creating driver standings...');

  // After Italian GP 2024
  await prisma.driverStanding.createMany({
    data: [
      {
        raceId: italianGP2024.id,
        driverId: verstappen.id,
        points: 303,
        position: 1,
        wins: 7,
      },
      {
        raceId: italianGP2024.id,
        driverId: norris.id,
        points: 241,
        position: 2,
        wins: 2,
      },
      {
        raceId: italianGP2024.id,
        driverId: leclerc.id,
        points: 217,
        position: 3,
        wins: 2,
      },
      {
        raceId: italianGP2024.id,
        driverId: hamilton.id,
        points: 164,
        position: 4,
        wins: 2,
      },
    ],
  });

  // 10. Create Constructor Standings
  console.log('🏆 Creating constructor standings...');

  // After Italian GP 2024
  await prisma.constructorStanding.createMany({
    data: [
      {
        raceId: italianGP2024.id,
        teamId: redBull.id,
        points: 446,
        position: 1,
        wins: 7,
      },
      {
        raceId: italianGP2024.id,
        teamId: mclaren.id,
        points: 438,
        position: 2,
        wins: 2,
      },
      {
        raceId: italianGP2024.id,
        teamId: ferrari.id,
        points: 407,
        position: 3,
        wins: 2,
      },
      {
        raceId: italianGP2024.id,
        teamId: mercedes.id,
        points: 292,
        position: 4,
        wins: 3,
      },
    ],
  });

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   - ${await prisma.driver.count()} drivers`);
  console.log(`   - ${await prisma.team.count()} teams`);
  console.log(`   - ${await prisma.circuit.count()} circuits`);
  console.log(`   - ${await prisma.season.count()} seasons`);
  console.log(`   - ${await prisma.race.count()} races`);
  console.log(
    `   - ${await prisma.qualifyingResult.count()} qualifying results`
  );
  console.log(`   - ${await prisma.raceResult.count()} race results`);
  console.log(`   - ${await prisma.status.count()} status records`);
  console.log(`   - ${await prisma.driverStanding.count()} driver standings`);
  console.log(
    `   - ${await prisma.constructorStanding.count()} constructor standings`
  );
  console.log('');
  console.log('🎉 You can now test your API endpoints!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
