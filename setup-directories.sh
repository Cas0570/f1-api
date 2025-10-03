#!/bin/bash

# F1 API - Directory Structure Setup Script
# Creates all necessary directories for the project

echo "🏎️  Setting up F1 API directory structure..."

# Create main source directories
mkdir -p src/{config,routes/v1,services,controllers,middleware,types,utils,plugins}

# Create test directories
mkdir -p tests/{unit/{services,utils},integration/routes,fixtures,helpers}

# Create scripts directory
mkdir -p scripts

# Create prisma directory (if not exists)
mkdir -p prisma

# Create docs directories (if not exists)
mkdir -p docs/{planning,database,setup,api,guides}

echo "✅ Directory structure created successfully!"
echo ""
echo "Directory tree:"
tree -L 3 -I 'node_modules|dist' || ls -R

echo ""
echo "🎯 Next steps:"
echo "1. Copy src/index.ts to your src/ folder"
echo "2. Install missing dependency: npm install pino-pretty --save-dev"
echo "3. Ensure your .env file has DATABASE_URL set"
echo "4. Run: npm run dev"