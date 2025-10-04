// Test fixtures for F1 API tests

export const mockDriver = {
  id: 1,
  driverRef: 'hamilton',
  number: 44,
  code: 'HAM',
  forename: 'Lewis',
  surname: 'Hamilton',
  dob: new Date('1985-01-07'),
  nationality: 'British',
  url: 'http://en.wikipedia.org/wiki/Lewis_Hamilton',
};

export const mockTeam = {
  id: 1,
  teamRef: 'mercedes',
  name: 'Mercedes',
  nationality: 'German',
  url: 'http://en.wikipedia.org/wiki/Mercedes-Benz_in_Formula_One',
};

export const mockCircuit = {
  id: 1,
  circuitRef: 'monza',
  name: 'Autodromo Nazionale di Monza',
  location: 'Monza',
  country: 'Italy',
  lat: 45.6156,
  lng: 9.28111,
  alt: 162,
  url: 'http://en.wikipedia.org/wiki/Autodromo_Nazionale_Monza',
};

export const mockSeason = {
  id: 1,
  year: 2024,
  url: 'http://en.wikipedia.org/wiki/2024_Formula_One_World_Championship',
};

export const mockRace = {
  id: 1,
  seasonId: 1,
  circuitId: 1,
  round: 16,
  name: 'Italian Grand Prix',
  date: new Date('2024-09-01'),
  time: new Date('1970-01-01T13:00:00Z'),
  url: 'http://en.wikipedia.org/wiki/2024_Italian_Grand_Prix',
};

export const mockStatus = {
  id: 1,
  status: 'Finished',
  category: 'finished',
};

export const mockDriverResponse = {
  id: 1,
  driverRef: 'hamilton',
  number: 44,
  code: 'HAM',
  forename: 'Lewis',
  surname: 'Hamilton',
  fullName: 'Lewis Hamilton',
  dob: '1985-01-07',
  nationality: 'British',
  url: 'http://en.wikipedia.org/wiki/Lewis_Hamilton',
};

export const mockTeamResponse = {
  id: 1,
  teamRef: 'mercedes',
  name: 'Mercedes',
  nationality: 'German',
  url: 'http://en.wikipedia.org/wiki/Mercedes-Benz_in_Formula_One',
};

export const mockCircuitResponse = {
  id: 1,
  circuitRef: 'monza',
  name: 'Autodromo Nazionale di Monza',
  location: 'Monza',
  country: 'Italy',
  lat: 45.6156,
  lng: 9.28111,
  alt: 162,
  url: 'http://en.wikipedia.org/wiki/Autodromo_Nazionale_Monza',
};

export const mockPaginationMeta = {
  page: 1,
  limit: 20,
  total: 1,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
};
