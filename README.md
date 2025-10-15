<div align="center">

# 🏎️ F1 Historical Data API

### Comprehensive Formula 1 data from 1950 to present

[![Production](https://img.shields.io/badge/status-live-success)](https://api-production-ad1e.up.railway.app) [![API Version](https://img.shields.io/badge/api-v1-blue)](https://api-production-ad1e.up.railway.app/api/v1) [![Tests](https://img.shields.io/badge/tests-140%2B%20passing-success)]() [![TypeScript](https://img.shields.io/badge/typescript-5.3-blue)](https://www.typescriptlang.org/) [![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

[Live API](https://api-production-ad1e.up.railway.app) • [Documentation](https://api-production-ad1e.up.railway.app/documentation) • [Report Bug](https://github.com/Cas0570/F1-Api/issues)

</div>

---

## 🌍 Production API

**Live Endpoint**: `https://api-production-ad1e.up.railway.app`  
**Interactive Docs**: `https://api-production-ad1e.up.railway.app/documentation`  
**Status**: ✅ Operational

### Quick Examples

```bash
# Get all F1 seasons (1950-2024)
curl https://api-production-ad1e.up.railway.app/api/v1/seasons

# Get 2024 season details
curl https://api-production-ad1e.up.railway.app/api/v1/seasons/2024

# Get current driver championship standings
curl https://api-production-ad1e.up.railway.app/api/v1/seasons/2024/standings/drivers

# Get all-time drivers (paginated)
curl "https://api-production-ad1e.up.railway.app/api/v1/drivers?limit=10&offset=0"

# Get Lewis Hamilton's career details
curl https://api-production-ad1e.up.railway.app/api/v1/drivers/hamilton

# Get Monaco Grand Prix circuit details
curl https://api-production-ad1e.up.railway.app/api/v1/circuits/monaco
```

---

## 📊 API Coverage

| Category          | Count   | Description                  |
| ----------------- | ------- | ---------------------------- |
| **Seasons**       | 75      | 1950-2024                    |
| **Races**         | 1,100+  | All championship grands prix |
| **Drivers**       | 864     | All F1 drivers in history    |
| **Constructors**  | 212     | All teams/constructors       |
| **Circuits**      | 77      | Racing venues worldwide      |
| **Total Records** | 50,000+ | Complete historical dataset  |

---

## ⚡ Features

- ✅ **75 years of F1 history** - Complete data from 1950 to present
- ✅ **22 REST API endpoints** - Comprehensive data access
- ✅ **10-30ms response times** - Optimized with multi-layer caching
- ✅ **Interactive documentation** - Swagger/OpenAPI UI
- ✅ **Type-safe** - Full TypeScript implementation
- ✅ **Well-tested** - 140+ unit & integration tests
- ✅ **Production-ready** - Deployed with CI/CD pipeline

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ and npm 10+
- PostgreSQL 16+
- Docker (optional, for database)

### Installation

```bash
# Clone the repository
git clone https://github.com/Cas0570/F1-Api.git
cd F1-Api

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Start PostgreSQL (Docker)
docker-compose up -d

# Push database schema
npm run db:push

# Import historical F1 data (10-15 minutes)
npm run db:import

# Optimize database
npm run db:optimize

# Start development server
npm run dev
```

Visit `http://localhost:3000/documentation` for interactive API documentation.

---

## 📖 API Endpoints

### Core

| Method | Endpoint              | Description         |
| ------ | --------------------- | ------------------- |
| GET    | `/api/v1`             | API information     |
| GET    | `/health`             | Health check        |
| GET    | `/health/cache`       | Cache statistics    |
| GET    | `/health/performance` | Performance metrics |

### Seasons

| Method | Endpoint                                       | Description           |
| ------ | ---------------------------------------------- | --------------------- |
| GET    | `/api/v1/seasons`                              | List all seasons      |
| GET    | `/api/v1/seasons/:year`                        | Get season by year    |
| GET    | `/api/v1/seasons/:year/races`                  | Get races in season   |
| GET    | `/api/v1/seasons/:year/standings/drivers`      | Driver standings      |
| GET    | `/api/v1/seasons/:year/standings/constructors` | Constructor standings |

### Drivers

| Method | Endpoint                        | Description             |
| ------ | ------------------------------- | ----------------------- |
| GET    | `/api/v1/drivers`               | List all drivers        |
| GET    | `/api/v1/drivers/:id`           | Get driver by ID        |
| GET    | `/api/v1/drivers/ref/:ref`      | Get driver by reference |
| GET    | `/api/v1/drivers/nationalities` | Get all nationalities   |

### Constructors

| Method | Endpoint                      | Description                  |
| ------ | ----------------------------- | ---------------------------- |
| GET    | `/api/v1/teams`               | List all constructors        |
| GET    | `/api/v1/teams/:id`           | Get constructor by ID        |
| GET    | `/api/v1/teams/ref/:ref`      | Get constructor by reference |
| GET    | `/api/v1/teams/nationalities` | Get all nationalities        |

### Circuits

| Method | Endpoint                     | Description              |
| ------ | ---------------------------- | ------------------------ |
| GET    | `/api/v1/circuits`           | List all circuits        |
| GET    | `/api/v1/circuits/:id`       | Get circuit by ID        |
| GET    | `/api/v1/circuits/ref/:ref`  | Get circuit by reference |
| GET    | `/api/v1/circuits/countries` | Get all countries        |

### Races

| Method | Endpoint                       | Description            |
| ------ | ------------------------------ | ---------------------- |
| GET    | `/api/v1/races`                | List all races         |
| GET    | `/api/v1/races/:id`            | Get race by ID         |
| GET    | `/api/v1/races/:id/results`    | Get race results       |
| GET    | `/api/v1/races/:id/qualifying` | Get qualifying results |

Full API documentation available at: [https://api-production-ad1e.up.railway.app/documentation](https://api-production-ad1e.up.railway.app/documentation)

---

## 🛠️ Tech Stack

### Core Technologies

- **Runtime**: [Node.js](https://nodejs.org/) 20+
- **Language**: [TypeScript](https://www.typescriptlang.org/) 5.3
- **Framework**: [Fastify](https://www.fastify.io/) 4.x
- **Database**: [PostgreSQL](https://www.postgresql.org/) 16+
- **ORM**: [Prisma](https://www.prisma.io/) 5.x

### Development Tools

- **Testing**: [Vitest](https://vitest.dev/)
- **Validation**: [Zod](https://zod.dev/)
- **Documentation**: [Swagger/OpenAPI](https://swagger.io/)
- **Logging**: [Pino](https://getpino.io/)
- **Caching**: [node-cache](https://www.npmjs.com/package/node-cache)

### DevOps & Deployment

- **CI/CD**: [GitHub Actions](https://github.com/features/actions)
- **Hosting**: [Railway](https://railway.app/)
- **Containerization**: [Docker](https://www.docker.com/)
- **Version Control**: [Git](https://git-scm.com/)

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

**Test Coverage:**

- 340+ unit and integration tests
- 100% endpoint coverage
- 100% service layer coverage

---

## 📈 Performance

### Response Times

- **Cached**: 10-30ms average
- **Uncached**: 50-100ms average
- **Cache Hit Rate**: 60-90%

### Optimizations

- ✅ **Database Indexes**: 10+ strategic indexes (50-80% faster queries)
- ✅ **In-Memory Caching**: node-cache with 60-90% hit rate
- ✅ **HTTP Caching**: Browser caching (70%+ bandwidth savings)
- ✅ **Query Optimization**: Selective field loading with Prisma

---

## 📚 Documentation

### Project Documentation

- [Setup Guide](./docs/setup/Project-Setup-Guide.md) - Complete installation instructions
- [Database Schema](./docs/database/) - ERD diagrams and table definitions
- [Implementation Roadmap](./docs/planning/Implementation-Roadmap.md) - Development phases
- [API Documentation](https://api-production-ad1e.up.railway.app/documentation) - Interactive Swagger UI

### Database

Generation 1 includes 10 core tables:

1. **drivers** - Driver information and biographies
2. **teams** - Team/constructor data
3. **circuits** - Racing circuit details
4. **seasons** - Championship seasons
5. **races** - Grand Prix events
6. **race_results** - Race finishing positions
7. **qualifying_results** - Qualifying session results
8. **status** - Result status types
9. **driver_standings** - Championship points (drivers)
10. **team_standings** - Championship points (constructors)

[View complete schema](./docs/planning/Complete-Database-Schema.md)

---

## 🗺️ Development Roadmap

### ✅ Generation 1: Core Historical Data (COMPLETE)

- Basic race results and standings
- Driver and constructor information
- Circuit and season data
- **Status**: Deployed to production

### ⏳ Generation 2: Performance Timing

- Lap times and sectors
- Pit stop data
- Practice and qualifying sessions
- Sprint race results

### ⏳ Generation 3: Technical & Strategy

- Car specifications
- Tire strategies
- Engine manufacturers
- Aerodynamic regulations

### ⏳ Generation 4: Penalties & Stewards

- Penalties and infractions
- Steward decisions
- Safety car periods
- Technical regulations

[View full 10-generation roadmap](./docs/planning/Implementation-Roadmap.md)

---

## 🤝 Contributing

This is a solo project, but issues and suggestions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Data Source**: [Jolpica F1 API](https://api.jolpi.ca/ergast/f1) (Ergast F1 API mirror)
- **Original Ergast API**: Chris Newell's [Ergast Developer API](http://ergast.com/mrd/)
- **Inspiration**: The Formula 1 community and data enthusiasts

---

## 📞 Contact & Links

- **Live API**: https://api-production-ad1e.up.railway.app
- **Documentation**: https://api-production-ad1e.up.railway.app/documentation
- **Issues**: https://github.com/Cas0570/F1-Api/issues
- **Project**: https://github.com/Cas0570/F1-Api

---

<div align="center">

Made with ❤️ for Formula 1 fans and data enthusiasts

**⭐ Star this repo if you find it useful!**

[⬆ back to top](#-f1-historical-data-api)

</div>
