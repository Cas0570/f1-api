import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Add cache control headers to responses
 * Historical F1 data rarely changes, so we can cache aggressively
 */
export async function addCacheHeaders(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Don't cache health checks or errors
  if (request.url.startsWith('/health') || reply.statusCode >= 400) {
    reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    return;
  }

  // Historical data endpoints - cache for 1 hour
  if (
    request.url.includes('/drivers/') ||
    request.url.includes('/teams/') ||
    request.url.includes('/circuits/') ||
    request.url.includes('/races/') ||
    request.url.includes('/seasons/')
  ) {
    reply.header('Cache-Control', 'public, max-age=3600'); // 1 hour
    return;
  }

  // List endpoints - cache for 10 minutes
  if (
    request.url.includes('/drivers') ||
    request.url.includes('/teams') ||
    request.url.includes('/circuits') ||
    request.url.includes('/races') ||
    request.url.includes('/seasons')
  ) {
    reply.header('Cache-Control', 'public, max-age=600'); // 10 minutes
    return;
  }

  // Standings - cache for 5 minutes (might update more frequently)
  if (request.url.includes('/standings')) {
    reply.header('Cache-Control', 'public, max-age=300'); // 5 minutes
    return;
  }

  // Default - cache for 5 minutes
  reply.header('Cache-Control', 'public, max-age=300');
}
