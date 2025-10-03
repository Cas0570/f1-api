import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Prisma Client
const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
});

// Initialize Fastify with logger
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport:
      process.env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
});

// Register plugins
async function registerPlugins() {
  // CORS - Allow cross-origin requests
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  });

  // Helmet - Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: false, // Disable for API-only server
  });
}

// Import routes
import { v1Routes } from './routes/v1';

// Setup routes
async function setupRoutes() {
  // Root endpoint
  fastify.get('/', async () => {
    return {
      name: 'F1 API',
      version: '1.0.0',
      status: 'operational',
      documentation: '/api/v1',
    };
  });

  // Health check endpoint
  fastify.get('/health', async () => {
    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        uptime: process.uptime(),
      };
    } catch (error) {
      fastify.log.error(error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        uptime: process.uptime(),
      };
    }
  });

  // API v1 info endpoint
  fastify.get('/api/v1', async () => {
    return {
      name: 'F1 API - Generation 1',
      version: '1.0.0',
      description: 'Formula 1 Historical Data API (1950-present)',
      generation: 1,
      endpoints: {
        drivers: '/api/v1/drivers',
        teams: '/api/v1/teams',
        circuits: '/api/v1/circuits',
        seasons: '/api/v1/seasons',
        races: '/api/v1/races',
        health: '/health',
      },
      documentation: 'https://github.com/Cas0570/f1-api',
    };
  });

  // Register API v1 routes
  await fastify.register(v1Routes, { prefix: '/api/v1' });

  // 404 handler
  fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      status: 'error',
      error: {
        code: 'NOT_FOUND',
        message: `Route ${request.method}:${request.url} not found`,
      },
    });
  });

  // Global error handler
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);

    reply.status(error.statusCode || 500).send({
      status: 'error',
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'An unexpected error occurred',
      },
    });
  });
}

// Start server
async function start() {
  try {
    // Register plugins
    await registerPlugins();

    // Setup routes
    await setupRoutes();

    // Start listening
    const port = parseInt(process.env.PORT || '3000', 10);
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });

    fastify.log.info(`
🏎️  F1 API Server Started Successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Server URL: http://${host}:${port}
🔍 Health Check: http://${host}:${port}/health
📚 API Info: http://${host}:${port}/api/v1
🌍 Environment: ${process.env.NODE_ENV || 'development'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
  } catch (err) {
    fastify.log.error(err);
    await cleanup();
    process.exit(1);
  }
}

// Cleanup function
async function cleanup() {
  try {
    fastify.log.info('Shutting down gracefully...');
    await prisma.$disconnect();
    await fastify.close();
    fastify.log.info('Cleanup completed');
  } catch (error) {
    fastify.log.error({ error }, 'Error during cleanup:');
  }
}

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  fastify.log.info('SIGINT received, shutting down...');
  await cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  fastify.log.info('SIGTERM received, shutting down...');
  await cleanup();
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  fastify.log.error({ error }, 'Uncaught Exception:');
  cleanup().then(() => process.exit(1));
});

process.on('unhandledRejection', (reason, promise) => {
  fastify.log.error({ reason, promise }, 'Unhandled Rejection at:');
  cleanup().then(() => process.exit(1));
});

// Start the application
start();
