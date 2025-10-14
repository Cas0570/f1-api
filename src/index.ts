import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import {
  requestLogger,
  responseLogger,
  addResponseTimeHeader,
} from './middleware/requestLogger';
import { addCacheHeaders } from './middleware/cacheHeaders';
import { performanceMonitor } from './utils/performance';

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

  // Helmet
  await fastify.register(helmet, {
    contentSecurityPolicy: false,
  });

  // Request logging (on request start)
  fastify.addHook('onRequest', requestLogger);

  // Response time header and cache headers (before response sent)
  fastify.addHook('onSend', addResponseTimeHeader);
  fastify.addHook('onSend', addCacheHeaders);

  // Response logging and performance tracking (after response sent)
  fastify.addHook('onResponse', responseLogger);
  fastify.addHook('onResponse', (request, reply, done) => {
    performanceMonitor.record(request.url, reply.elapsedTime);
    done();
  });

  // Swagger
  await fastify.register(swagger);
  await fastify.register(swaggerUi);
}

// Setup routes
async function setupRoutes() {
  // Import routes
  const { v1Routes } = await import('./routes/v1/index.js');

  // Root endpoint
  fastify.get(
    '/',
    {
      schema: {
        tags: ['Health'],
        description: 'Root endpoint with API information',
        response: {
          200: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              version: { type: 'string' },
              status: { type: 'string' },
              documentation: { type: 'string' },
            },
          },
        },
      },
    },
    async () => {
      return {
        name: 'F1 API',
        version: '1.0.0',
        status: 'operational',
        documentation: '/docs',
      };
    }
  );

  // Health check endpoint
  fastify.get(
    '/health',
    {
      schema: {
        tags: ['Health'],
        description: 'Health check endpoint',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'healthy' },
              timestamp: { type: 'string', format: 'date-time' },
              database: { type: 'string', example: 'connected' },
              uptime: { type: 'number', example: 123.45 },
            },
          },
        },
      },
    },
    async () => {
      try {
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
    }
  );

  // Cache statistics endpoint
  fastify.get(
    '/health/cache',
    {
      schema: {
        tags: ['Health'],
        description: 'Cache performance statistics',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              stats: {
                type: 'object',
                properties: {
                  keys: { type: 'number' },
                  hits: { type: 'number' },
                  misses: { type: 'number' },
                  hitRate: { type: 'string' },
                  ksize: { type: 'number' },
                  vsize: { type: 'number' },
                },
              },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    async () => {
      const { cacheService } = await import('./services/cacheService.js');
      const stats = cacheService.getStats();
      const totalRequests = stats.hits + stats.misses;
      const hitRate =
        totalRequests > 0
          ? ((stats.hits / totalRequests) * 100).toFixed(2) + '%'
          : '0%';

      return {
        status: 'ok',
        stats: {
          keys: stats.keys,
          hits: stats.hits,
          misses: stats.misses,
          hitRate,
          ksize: stats.ksize,
          vsize: stats.vsize,
        },
        timestamp: new Date().toISOString(),
      };
    }
  );

  // Performance metrics endpoint
  fastify.get(
    '/health/performance',
    {
      schema: {
        tags: ['Health'],
        description: 'API performance metrics',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              metrics: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    endpoint: { type: 'string' },
                    avgResponseTime: { type: 'number' },
                    minResponseTime: { type: 'number' },
                    maxResponseTime: { type: 'number' },
                    totalRequests: { type: 'number' },
                  },
                },
              },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    async () => {
      const metrics = performanceMonitor.getAllMetrics();

      return {
        status: 'ok',
        metrics: metrics.slice(0, 20), // Top 20 endpoints
        timestamp: new Date().toISOString(),
      };
    }
  );

  // API v1 info endpoint
  fastify.get(
    '/api/v1',
    {
      schema: {
        tags: ['Health'],
        description: 'API v1 information and available endpoints',
        response: {
          200: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              version: { type: 'string' },
              description: { type: 'string' },
              generation: { type: 'integer' },
              status: { type: 'string' },
              endpoints: { type: 'object' },
              documentation: { type: 'string' },
            },
          },
        },
      },
    },
    async () => {
      return {
        name: 'F1 API - Generation 1',
        version: '1.0.0',
        description: 'Formula 1 Historical Data API (1950-present)',
        generation: 1,
        status: 'COMPLETE',
        endpoints: {
          drivers: '/api/v1/drivers',
          driverById: '/api/v1/drivers/:id',
          driverByRef: '/api/v1/drivers/ref/:ref',
          driverNationalities: '/api/v1/drivers/nationalities',
          teams: '/api/v1/teams',
          teamById: '/api/v1/teams/:id',
          teamByRef: '/api/v1/teams/ref/:ref',
          teamNationalities: '/api/v1/teams/nationalities',
          circuits: '/api/v1/circuits',
          circuitById: '/api/v1/circuits/:id',
          circuitByRef: '/api/v1/circuits/ref/:ref',
          circuitCountries: '/api/v1/circuits/countries',
          seasons: '/api/v1/seasons',
          seasonById: '/api/v1/seasons/:id',
          seasonByYear: '/api/v1/seasons/year/:year',
          races: '/api/v1/races',
          raceById: '/api/v1/races/:id',
          racesBySeason: '/api/v1/races/season/:year',
          raceResults: '/api/v1/races/:id/results',
          qualifyingResults: '/api/v1/races/:id/qualifying',
          driverStandings: '/api/v1/standings/drivers',
          constructorStandings: '/api/v1/standings/constructors',
          health: '/health',
        },
        documentation: 'https://github.com/Cas0570/f1-api',
      };
    }
  );

  // Register v1 routes
  fastify.register(v1Routes, { prefix: '/api/v1' });

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
📖 API Documentation: http://${host}:${port}/documentation
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
