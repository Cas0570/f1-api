# F1 API - Complete Project Directory Structure

Your complete project organization including code, documentation, and all artifacts from our conversation.

---

## 📁 Full Directory Tree

```
f1-api/                                    # Root project folder
│
├── docs/                                  # 📚 ALL DOCUMENTATION GOES HERE
│   ├── planning/
│   │   ├── Implementation-Roadmap.md      # 10 generation plan
│   │   ├── Complete-Database-Schema.md    # Full 60+ table reference
│   │   └── Tech-Stack-Decision.md         # Why we chose this stack
│   │
│   ├── database/
│   │   ├── ERD-Collection-Overview.md     # How to use ERDs
│   │   ├── Generation-01-ERD.mermaid      # Gen 1 database diagram
│   │   ├── Generation-02-ERD.mermaid      # Gen 2 database diagram
│   │   ├── Generation-03-ERD.mermaid      # Gen 3 database diagram
│   │   ├── Generation-04-ERD.mermaid      # Gen 4 database diagram
│   │   ├── Generation-05-ERD.mermaid      # Gen 5 database diagram
│   │   ├── Generation-06-ERD.mermaid      # Gen 6 database diagram
│   │   ├── Generation-07-ERD.mermaid      # Gen 7 database diagram
│   │   ├── Generation-08-ERD.mermaid      # Gen 8 database diagram
│   │   ├── Generation-09-ERD.mermaid      # Gen 9 database diagram
│   │   └── Generation-10-ERD.mermaid      # Gen 10 database diagram
│   │
│   ├── setup/
│   │   ├── Project-Setup-Guide.md         # ⭐ Complete setup instructions
│   │   ├── Project-Directory-Structure.md # ⭐ This file
│   │   └── Pre-Development-Checklist.md   # What docs you need
│   │
│   ├── api/
│   │   ├── API-Design.md                  # (coming next)
│   │   ├── Endpoint-Specifications.md     # (coming next)
│   │   └── Response-Standards.md          # (coming next)
│   │
│   └── guides/
│       ├── Data-Import-Guide.md           # (coming next)
│       ├── Testing-Guide.md               # (coming next)
│       └── Deployment-Guide.md            # (coming next)
│
├── src/                                   # 💻 APPLICATION CODE
│   ├── config/
│   │   ├── database.ts                    # Database connection
│   │   ├── environment.ts                 # Environment variables
│   │   └── logger.ts                      # Logging configuration
│   │
│   ├── routes/
│   │   ├── v1/
│   │   │   ├── drivers.ts                 # Driver endpoints
│   │   │   ├── teams.ts                   # Team endpoints
│   │   │   ├── circuits.ts                # Circuit endpoints
│   │   │   ├── seasons.ts                 # Season endpoints
│   │   │   ├── races.ts                   # Race endpoints
│   │   │   └── index.ts                   # Route aggregator
│   │   └── index.ts                       # All routes
│   │
│   ├── services/
│   │   ├── driverService.ts               # Driver business logic
│   │   ├── teamService.ts                 # Team business logic
│   │   ├── raceService.ts                 # Race business logic
│   │   └── standingsService.ts            # Standings business logic
│   │
│   ├── controllers/
│   │   ├── driverController.ts            # Driver request handlers
│   │   ├── teamController.ts              # Team request handlers
│   │   └── raceController.ts              # Race request handlers
│   │
│   ├── middleware/
│   │   ├── errorHandler.ts                # Global error handling
│   │   ├── validation.ts                  # Request validation
│   │   └── rateLimiter.ts                 # Rate limiting (Gen 3+)
│   │
│   ├── types/
│   │   ├── api.ts                         # API types
│   │   ├── database.ts                    # Database types
│   │   └── responses.ts                   # Response types
│   │
│   ├── utils/
│   │   ├── logger.ts                      # Logging utility
│   │   ├── errors.ts                      # Custom errors
│   │   ├── pagination.ts                  # Pagination helper
│   │   └── validators.ts                  # Zod schemas
│   │
│   ├── plugins/
│   │   ├── prisma.ts                      # Prisma plugin
│   │   └── swagger.ts                     # API documentation
│   │
│   └── index.ts                           # ⭐ Main application entry
│
├── prisma/
│   ├── schema.prisma                      # ⭐ Database schema (from setup)
│   ├── seed.ts                            # Database seeding script
│   └── migrations/                        # (Generated automatically)
│
├── tests/                                 # 🧪 TESTS
│   ├── unit/
│   │   ├── services/
│   │   │   ├── driverService.test.ts
│   │   │   └── teamService.test.ts
│   │   └── utils/
│   │       └── pagination.test.ts
│   │
│   ├── integration/
│   │   └── routes/
│   │       ├── drivers.test.ts
│   │       ├── teams.test.ts
│   │       └── races.test.ts
│   │
│   ├── fixtures/
│   │   ├── drivers.json                   # Test data
│   │   └── races.json                     # Test data
│   │
│   └── helpers/
│       └── testSetup.ts                   # Test utilities
│
├── scripts/                               # 🔧 UTILITY SCRIPTS
│   ├── import-ergast-data.ts              # Import historical data
│   ├── generate-test-data.ts              # Create test fixtures
│   └── db-backup.ts                       # Database backup
│
├── .github/                               # 🤖 GITHUB ACTIONS (later)
│   └── workflows/
│       ├── test.yml                       # Run tests on PR
│       └── deploy.yml                     # Deploy to Railway
│
├── .vscode/                               # VS CODE SETTINGS
│   ├── extensions.json                    # Recommended extensions
│   ├── settings.json                      # Editor settings
│   └── launch.json                        # Debug configuration
│
├── .env.example                           # ⭐ Environment template (from setup)
├── .env                                   # ⚠️ Your secrets (NOT in git)
├── .gitignore                             # ⭐ Git ignore rules (from setup)
├── .prettierrc                            # Code formatting rules
├── .eslintrc.js                           # Linting rules
├── docker-compose.yml                     # Local PostgreSQL (optional)
├── package.json                           # ⭐ Dependencies (from setup)
├── tsconfig.json                          # ⭐ TypeScript config (from setup)
├── vitest.config.ts                       # Test configuration
├── README.md                              # ⭐ PROJECT OVERVIEW (create this!)
└── LICENSE                                # License file (MIT recommended)
```

---

## 🎯 Quick Setup Checklist

### 1. Create the directory structure

```bash
# Navigate to your project
cd f1-api

# Create docs structure
mkdir -p docs/{planning,database,setup,api,guides}

# Create src structure (already done in setup guide)
mkdir -p src/{config,routes/v1,services,controllers,middleware,types,utils,plugins}

# Create test structure
mkdir -p tests/{unit/{services,utils},integration/routes,fixtures,helpers}

# Create scripts folder
mkdir scripts

# Create .vscode folder
mkdir .vscode
```

### 2. Move your documentation files

```bash
# All those markdown files from our conversation go into docs/

# Planning documents
docs/planning/
  - Implementation-Roadmap.md
  - Complete-Database-Schema.md
  - Tech-Stack-Decision.md

# Database ERDs
docs/database/
  - ERD-Collection-Overview.md
  - Generation-01-ERD.mermaid (through 10)

# Setup guide
docs/setup/
  - Project-Setup-Guide.md
  - Project-Directory-Structure.md
```

---

## 📝 Must-Create Files First

### 1. README.md (Root of project)

```markdown
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
- [API Design](./docs/api/)
- [Database Schema](./docs/database/)

## 🚀 Tech Stack

- TypeScript + Node.js 20
- Fastify 4.x
- PostgreSQL 16
- Prisma ORM

## 📖 API Endpoints (Generation 1)

- `GET /api/v1/drivers` - List all drivers
- `GET /api/v1/teams` - List all teams
- `GET /api/v1/seasons` - List all seasons
- `GET /api/v1/races` - List all races

Full API documentation: http://localhost:3000/docs

## 🧪 Testing

\`\`\`bash
npm test
\`\`\`

## 📦 Deployment

Deployed on Railway: [Your URL here]

## 📄 License

MIT
```

### 2. .vscode/settings.json

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "files.exclude": {
    "node_modules": true,
    "dist": true,
    ".env": false
  }
}
```

### 3. .vscode/extensions.json

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### 4. .prettierrc

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

### 5. .eslintrc.js

```javascript
module.exports = {
  parser: "@typescript-eslint/parser",
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  rules: {
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
  },
};
```

---

## 🗂️ What Goes Where? (Quick Reference)

| File Type       | Location         | Example                          |
| --------------- | ---------------- | -------------------------------- |
| Planning docs   | `docs/planning/` | Roadmap, tech decisions          |
| Database ERDs   | `docs/database/` | All generation ERDs              |
| Setup guides    | `docs/setup/`    | Setup, troubleshooting           |
| API docs        | `docs/api/`      | Endpoint specs, standards        |
| Source code     | `src/`           | All TypeScript files             |
| Database schema | `prisma/`        | schema.prisma, seeds             |
| Tests           | `tests/`         | All test files                   |
| Build output    | `dist/`          | Compiled JavaScript (gitignored) |
| Config files    | Root             | package.json, tsconfig.json      |

---

## 📋 Git Best Practices

### What to commit:

✅ All `docs/` files
✅ All `src/` files  
✅ `prisma/schema.prisma`
✅ `.env.example` (template)
✅ Config files (tsconfig.json, package.json)
✅ README.md

### What NOT to commit:

❌ `node_modules/`
❌ `.env` (your secrets!)
❌ `dist/` (build output)
❌ `.DS_Store` or OS files
❌ `*.log` files

---

## 🎯 Your Next Steps

1. **Create the folder structure** (run those mkdir commands above)

2. **Move your docs** into `docs/` folder:

   - Put "Project-Setup-Guide.md" into `docs/setup/`
   - Put all ERDs into `docs/database/`
   - Put roadmap into `docs/planning/`

3. **Create README.md** in project root (copy template above)

4. **Follow the setup guide** in `docs/setup/Project-Setup-Guide.md`

5. **Commit everything** to git:

```bash
git add .
git commit -m "Initial project setup with documentation"
git push origin main
```

---

## 💡 Pro Tips

### Organizing Documentation

- **Keep it close to code** - docs/ in the same repo
- **Version control everything** - docs evolve with code
- **Link between docs** - use relative links
- **Update as you build** - docs should stay current

### Folder Naming Conventions

- Use **lowercase** for all folders
- Use **kebab-case** for multi-word folders (`my-folder`)
- Keep names **short but descriptive**
- Group by **feature**, not file type

### Finding Documentation

Create this in your README.md:

```markdown
## 📚 Documentation Map

- **Getting Started**: [docs/setup/Project-Setup-Guide.md](./docs/setup/Project-Setup-Guide.md)
- **Database Design**: [docs/database/](./docs/database/)
- **API Reference**: [docs/api/](./docs/api/)
- **Development**: [docs/guides/](./docs/guides/)
```

---

## ✅ Verification Checklist

After setting up your directory structure:

- [ ] `docs/` folder exists with subfolders
- [ ] `src/` has all subfolders (config, routes, services, etc.)
- [ ] `prisma/` has schema.prisma file
- [ ] `tests/` folder structure created
- [ ] `.gitignore` exists and is configured
- [ ] `README.md` exists in root
- [ ] `.vscode/` has settings and extensions
- [ ] All documentation files moved to `docs/`
- [ ] Everything committed to git

---

**TL;DR:** Put "Project-Setup-Guide.md" in `docs/setup/` and create a README.md in your project root! 🚀
