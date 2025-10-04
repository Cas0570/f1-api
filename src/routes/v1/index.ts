/**
 * API v1 Routes Aggregator
 * Registers all v1 API routes under /api/v1 prefix
 */

import { FastifyInstance } from 'fastify';
import { driverRoutes } from './drivers';
import { teamRoutes } from './teams';
import { circuitRoutes } from './circuits';

/**
 * Register all v1 routes
 */
export async function v1Routes(fastify: FastifyInstance) {
  // Register driver routes
  fastify.register(driverRoutes, { prefix: '/drivers' });

  // Register team routes
  fastify.register(teamRoutes, { prefix: '/teams' });

  // Register circuit routes
  fastify.register(circuitRoutes, { prefix: '/circuits' });

  // Future routes will be added here:
  // fastify.register(seasonRoutes, { prefix: '/seasons' });
  // fastify.register(raceRoutes, { prefix: '/races' });
}
