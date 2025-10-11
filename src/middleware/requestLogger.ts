import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Request logging middleware
 * Simple logging without nested hooks
 */
export async function requestLogger(
  request: FastifyRequest,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  reply: FastifyReply
) {
  // Just log the incoming request
  request.log.info({
    method: request.method,
    url: request.url,
    ip: request.ip,
    userAgent: request.headers['user-agent'],
  });
}

/**
 * Response logger - logs after response is sent
 */
export async function responseLogger(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Log response with timing
  request.log.info({
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    responseTime: `${Math.round(reply.elapsedTime)}ms`,
  });
}

/**
 * Add response time header (must be in onSend, not onResponse)
 */
export async function addResponseTimeHeader(
  request: FastifyRequest,
  reply: FastifyReply,
  payload: any
) {
  reply.header('X-Response-Time', `${Math.round(reply.elapsedTime)}ms`);
  return payload;
}
