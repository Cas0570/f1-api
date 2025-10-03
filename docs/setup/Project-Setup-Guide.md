# F1 API - Complete Project Setup Guide

Your complete guide to building the F1 API with TypeScript, Fastify, PostgreSQL, and Prisma.

**Target:** Generation 1 MVP in 4 weeks | Budget: $0-15/month

---

## 📋 Tech Stack Summary

```yaml
Runtime: Node.js 20.x LTS
Language: TypeScript 5.3+
Framework: Fastify 4.x
Database: PostgreSQL 16
ORM: Prisma 5.x
Validation: Zod 3.x
Testing: Vitest + Supertest
Deployment: Railway
Monitoring: Sentry
Version Control: Git + GitHub
```

---

## 🗓️ 4-Week Timeline to Launch

### Week 1: Setup & Database (Days 1-7)

- ✅ Development environment setup
- ✅ Database schema creation (Gen 1 tables)
- ✅ Prisma models defined
- ✅ Basic data import from Ergast

### Week 2: Core API (Days 8-14)

- ✅ Drivers endpoints
- ✅ Teams endpoints
- ✅ Seasons & Races endpoints
- ✅ Basic error handling

### Week 3: Results & Testing (Days 15-21)

- ✅ Qualifying results endpoints
- ✅ Race results endpoints
- ✅ Standings endpoints
- ✅ Unit tests for all endpoints

### Week 4: Polish & Deploy (Days 22-28)

- ✅ API documentation (Swagger)
- ✅ Railway deployment
- ✅ Domain setup (optional)
- ✅ Launch! 🚀

---

## 💻 Prerequisites

### Required Software

```bash
# 1. Node.js 20 LTS
# Download from: https://nodejs.org/
# Verify installation:
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x

# 2. Git
# Download from: https://git-scm.com/
git --version

# 3. VS Code (Recommended)
# Download from: https://code.visualstudio.com/

# 4. PostgreSQL (Local Development)
# Option A: Download from https://www.postgresql.org/download/
# Option B: Use Docker (easier)
docker pull postgres:16
```

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

---

## 🚀 Project Setup (Step-by-Step)

### Step 1: Create Project Directory

```bash
# Create and enter project folder
mkdir f1-api
cd f1-api

# Initialize git
git init

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*

# Environment variables
.env
.env.local
.env.*.local

# Build output
dist/
build/

# Database
*.db
*.db-journal

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Test coverage
coverage/

# Prisma
prisma/migrations/
EOF
```

---

### Step 2: Initialize Node.js Project

```bash
# Initialize package.json
npm init -y

# Install TypeScript and core dependencies
npm install fastify @fastify/cors @fastify/helmet
npm install @prisma/client zod
npm install dotenv

# Install dev dependencies
npm install -D typescript @types/node
npm install -D tsx nodemon
npm install -D prisma
npm install -D vitest supertest @types/supertest
npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D prettier
```

---

### Step 3: Configure TypeScript

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "types": ["node", "vitest"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

---

### Step 4: Configure Package.json Scripts

Update `package.json`:

```json
{
  "name": "f1-api",
  "version": "1.0.0",
  "description": "Formula 1 Historical Data API",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write \"src/**/*.ts\""
  },
  "keywords": ["f1", "formula1", "api", "racing"],
  "author": "Your Name",
  "license": "MIT"
}
```

---

### Step 5: Project Structure

Create this folder structure:

```bash
mkdir -p src/{routes,services,types,utils,config}
mkdir -p prisma
mkdir -p tests
```

Your structure should look like:

```
f1-api/
├── src/
│   ├── config/
│   │   └── database.ts       # Database connection config
│   ├── routes/
│   │   ├── drivers.ts        # Driver endpoints
│   │   ├── teams.ts          # Team endpoints
│   │   ├── races.ts          # Race endpoints
│   │   └── index.ts          # Route aggregator
│   ├── services/
│   │   ├── driverService.ts  # Business logic for drivers
│   │   ├── teamService.ts    # Business logic for teams
│   │   └── raceService.ts    # Business logic for races
│   ├── types/
│   │   └── api.ts            # TypeScript types/interfaces
│   ├── utils/
│   │   ├── logger.ts         # Logging utility
│   │   └── errors.ts         # Error handling
│   └── index.ts              # Main entry point
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Seed data script
├── tests/
│   └── routes/               # API tests
├── .env.example              # Environment template
├── .gitignore
├── package.json
└── tsconfig.json
```

---

### Step 6: Environment Configuration

Create `.env.example`:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/f1_api?schema=public"

# Server
NODE_ENV="development"
PORT=3000
HOST="0.0.0.0"

# API
API_VERSION="v1"

# Logging
LOG_LEVEL="info"

# CORS (comma-separated)
CORS_ORIGIN="http://localhost:3000,http://localhost:5173"

# Rate Limiting (Gen 3+)
# RATE_LIMIT_MAX=100
# RATE_LIMIT_WINDOW=900000
```

Copy to `.env`:

```bash
cp .env.example .env
```

**Edit `.env`** with your actual database credentials.

---

### Step 7: Setup PostgreSQL Database

#### Option A: Local PostgreSQL

```bash
# After installing PostgreSQL, create database
psql -U postgres

# In psql:
CREATE DATABASE f1_api;
CREATE USER f1_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE f1_api TO f1_user;
\q

# Update .env with:
# DATABASE_URL="postgresql://f1_user:your_secure_password@localhost:5432/f1_api?schema=public"
```

#### Option B: Docker PostgreSQL (Easier)

Create `docker-compose.yml`:

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16
    container_name: f1_postgres
    environment:
      POSTGRES_USER: f1_user
      POSTGRES_PASSWORD: f1_password
      POSTGRES_DB: f1_api
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Start database:

```bash
docker-compose up -d

# Update .env with:
# DATABASE_URL="postgresql://f1_user:f1_password@localhost:5432/f1_api?schema=public"
```

#### Option C: Free Cloud PostgreSQL (Railway)

1. Go to https://railway.app/
2. Create account (free)
3. New Project → Add PostgreSQL
4. Copy DATABASE_URL from Railway dashboard
5. Paste into `.env`

---

### Step 8: Initialize Prisma

```bash
# Initialize Prisma
npx prisma init

# This creates:
# - prisma/schema.prisma
# - .env (if doesn't exist)
```

Update `prisma/schema.prisma`:

```prisma
// This is your Prisma schema file

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Generation 1 Models

model Driver {
  id          Int      @id @default(autoincrement())
  driverRef   String   @unique @map("driver_ref")
  number      Int?     @map("number")
  code        String?  @unique @db.VarChar(3)
  forename    String   @db.VarChar(255)
  surname     String   @db.VarChar(255)
  dob         DateTime @map("dob") @db.Date
  nationality String   @db.VarChar(255)
  url         String   @unique
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  qualifyingResults QualifyingResult[]
  raceResults       RaceResult[]
  driverStandings   DriverStanding[]

  @@map("drivers")
  @@index([driverRef])
  @@index([code])
}

model Team {
  id          Int      @id @default(autoincrement())
  teamRef     String   @unique @map("team_ref")
  name        String   @db.VarChar(255)
  nationality String   @db.VarChar(255)
  url         String   @unique
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  qualifyingResults    QualifyingResult[]
  raceResults          RaceResult[]
  constructorStandings ConstructorStanding[]

  @@map("teams")
  @@index([teamRef])
}

model Circuit {
  id         Int      @id @default(autoincrement())
  circuitRef String   @unique @map("circuit_ref")
  name       String   @db.VarChar(255)
  location   String   @db.VarChar(255)
  country    String   @db.VarChar(255)
  lat        Float?
  lng        Float?
  alt        Int?
  url        String   @unique
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  // Relations
  races Race[]

  @@map("circuits")
  @@index([circuitRef])
}

model Season {
  id        Int      @id @default(autoincrement())
  year      Int      @unique
  url       String   @unique
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  races Race[]

  @@map("seasons")
  @@index([year])
}

model Race {
  id        Int       @id @default(autoincrement())
  seasonId  Int       @map("season_id")
  circuitId Int       @map("circuit_id")
  round     Int
  name      String    @db.VarChar(255)
  date      DateTime  @db.Date
  time      DateTime? @db.Time
  url       String    @unique
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")

  // Relations
  season               Season                @relation(fields: [seasonId], references: [id])
  circuit              Circuit               @relation(fields: [circuitId], references: [id])
  qualifyingResults    QualifyingResult[]
  raceResults          RaceResult[]
  driverStandings      DriverStanding[]
  constructorStandings ConstructorStanding[]

  @@unique([seasonId, round])
  @@map("races")
  @@index([seasonId])
  @@index([circuitId])
}

model QualifyingResult {
  id         Int      @id @default(autoincrement())
  raceId     Int      @map("race_id")
  driverId   Int      @map("driver_id")
  teamId     Int      @map("team_id")
  position   Int
  q1Time     String?  @map("q1_time") @db.VarChar(20)
  q2Time     String?  @map("q2_time") @db.VarChar(20)
  q3Time     String?  @map("q3_time") @db.VarChar(20)
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  // Relations
  race   Race   @relation(fields: [raceId], references: [id])
  driver Driver @relation(fields: [driverId], references: [id])
  team   Team   @relation(fields: [teamId], references: [id])

  @@unique([raceId, driverId])
  @@map("qualifying_results")
  @@index([raceId])
  @@index([driverId])
  @@index([teamId])
}

model RaceResult {
  id           Int      @id @default(autoincrement())
  raceId       Int      @map("race_id")
  driverId     Int      @map("driver_id")
  teamId       Int      @map("team_id")
  gridPosition Int      @map("grid_position")
  position     Int?
  positionText String   @map("position_text") @db.VarChar(10)
  points       Float    @default(0)
  laps         Int      @map("laps_completed")
  time         String?  @db.VarChar(50)
  timeMillis   Int?     @map("time_millis")
  statusId     Int      @map("status_id")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  // Relations
  race   Race   @relation(fields: [raceId], references: [id])
  driver Driver @relation(fields: [driverId], references: [id])
  team   Team   @relation(fields: [teamId], references: [id])
  status Status @relation(fields: [statusId], references: [id])

  @@unique([raceId, driverId])
  @@map("race_results")
  @@index([raceId])
  @@index([driverId])
  @@index([teamId])
}

model Status {
  id          Int          @id @default(autoincrement())
  status      String       @unique @db.VarChar(255)
  category    String       @db.VarChar(50)
  createdAt   DateTime     @default(now()) @map("created_at")
  updatedAt   DateTime     @updatedAt @map("updated_at")
  raceResults RaceResult[]

  @@map("status")
}

model DriverStanding {
  id        Int      @id @default(autoincrement())
  raceId    Int      @map("race_id")
  driverId  Int      @map("driver_id")
  points    Float
  position  Int
  wins      Int      @default(0)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  race   Race   @relation(fields: [raceId], references: [id])
  driver Driver @relation(fields: [driverId], references: [id])

  @@unique([raceId, driverId])
  @@map("driver_standings")
  @@index([raceId])
  @@index([driverId])
  @@index([position])
}

model ConstructorStanding {
  id        Int      @id @default(autoincrement())
  raceId    Int      @map("race_id")
  teamId    Int      @map("team_id")
  points    Float
  position  Int
  wins      Int      @default(0)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  race Race @relation(fields: [raceId], references: [id])
  team Team @relation(fields: [teamId], references: [id])

  @@unique([raceId, teamId])
  @@map("constructor_standings")
  @@index([raceId])
  @@index([teamId])
  @@index([position])
}
```

---

### Step 9: Create Database Schema

```bash
# Push schema to database
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio (visual database editor)
npx prisma studio
# Opens at http://localhost:5555
```

---

### Step 10: Create Main Application File

Create `src/index.ts`:

```typescript
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
  },
});

// Plugins
fastify.register(cors, {
  origin: process.env.CORS_ORIGIN?.split(",") || "*",
});

fastify.register(helmet);

// Health check
fastify.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

// API info
fastify.get("/api/v1", async () => {
  return {
    name: "F1 API",
    version: "1.0.0",
    description: "Formula 1 Historical Data API",
    endpoints: {
      drivers: "/api/v1/drivers",
      teams: "/api/v1/teams",
      seasons: "/api/v1/seasons",
      circuits: "/api/v1/circuits",
    },
  };
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || "3000");
    const host = process.env.HOST || "0.0.0.0";

    await fastify.listen({ port, host });
    console.log(`🏎️  F1 API running on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    await prisma.$disconnect();
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

start();
```

---

### Step 11: Test Your Setup

```bash
# Start development server
npm run dev

# In another terminal, test:
curl http://localhost:3000/health
# Should return: {"status":"ok","timestamp":"2025-01-02T..."}

curl http://localhost:3000/api/v1
# Should return API info
```

**✅ SUCCESS!** Your basic setup is complete!

---

## 💰 Cost Breakdown

### Month 1-2 (Development)

- **Local Development**: $0
- **Database**: $0 (local Docker or Railway free tier)
- **Hosting**: $0 (not deployed yet)
- **Total**: **$0/month**

### Month 3+ (Production)

- **Railway (API + Database)**: $5-10/month
- **Domain (optional)**: $12/year (~$1/month)
- **Sentry (monitoring)**: $0 (free tier)
- **Total**: **$5-11/month**

### If you get 10,000+ users:

- **Railway**: ~$20-30/month
- **Redis**: $5/month (Upstash)
- **Total**: **$25-35/month**

---

## 📚 Learning Resources

### Fastify

- Official Docs: https://www.fastify.io/docs/latest/
- Best Practices: https://github.com/fastify/fastify/blob/main/docs/Guides/Getting-Started.md

### Prisma

- Quickstart: https://www.prisma.io/docs/getting-started
- Schema Reference: https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference

### TypeScript

- Handbook: https://www.typescriptlang.org/docs/handbook/intro.html
- Cheatsheet: https://www.typescriptlang.org/cheatsheets

### PostgreSQL

- Tutorial: https://www.postgresqltutorial.com/
- Performance: https://www.postgresql.org/docs/current/performance-tips.html

---

## 🎯 Next Steps

You're now ready to start building! Here's what to do next:

1. ✅ **Verify setup works** (npm run dev)
2. ✅ **Import some test data** (we'll create a seed script)
3. ✅ **Build your first endpoint** (GET /api/v1/drivers)
4. ✅ **Write your first test**
5. ✅ **Iterate and expand**

**Ready for the next document?** I can create:

- ✅ **SQL Seed Script** - Import Ergast data into your database
- ✅ **First API Endpoint** - Complete driver endpoint with tests
- ✅ **Data Import Guide** - How to get historical F1 data
- ✅ **Development Workflow** - Git workflow, testing, deploying

Which would be most helpful right now? 🚀
