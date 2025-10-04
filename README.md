# F1 API - Formula 1 Historical Data API

A comprehensive REST API providing historical Formula 1 data from 1950 to present.

## 🏎️ Quick Start

\`\`\`bash

# Install dependencies

npm install

# Setup database

npm run db:push

# Start development server

npm run dev
\`\`\`

Visit http://localhost:3000/api/v1 for API info.

## 📚 Documentation

See the [docs/](./docs/) folder for complete documentation:

- [Setup Guide](./docs/setup/Project-Setup-Guide.md)
- [Database Schema](./docs/database/)
- [Implementation Roadmap](./docs/planning/Implementation-Roadmap.md)

## 🚀 Tech Stack

- TypeScript + Node.js 20
- Fastify 4.x
- PostgreSQL 16
- Prisma ORM
- Zod validation
- Vitest testing

## 📖 API Endpoints (Generation 1 - MVP)

- `GET /api/v1/drivers` - List all drivers
- `GET /api/v1/teams` - List all teams
- `GET /api/v1/seasons` - List all seasons
- `GET /api/v1/races` - List all races
- `GET /api/v1/races/{id}/results` - Race results

Full API documentation: http://localhost:3000/docs

## 🧪 Testing

\`\`\`bash
npm test
\`\`\`

## 📦 Current Status

**Phase:** Generation 1 (MVP)  
**Timeline:** 4 weeks to launch  
**Tables:** 10 core tables  
**Data Coverage:** 1950-2025

## 🗺️ Roadmap

- ✅ Generation 1: Core historical data (Current)
- ⏳ Generation 2: Lap times and performance
- ⏳ Generation 3: Technical regulations
- ⏳ Generation 4: Penalties and stewards
- ... [See full roadmap](./docs/planning/Implementation-Roadmap.md)

## 📄 License

MIT

## 🤝 Contributing

This is a solo project. Issues and suggestions welcome!
