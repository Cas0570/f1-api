/**
 * Driver Routes
 * API endpoints for driver-related operations
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as driverService from '../../services/driverService';
import type { DriverQueryParams } from '../../types/api';

/**
 * Register driver routes
 */
export async function driverRoutes(fastify: FastifyInstance) {
  // GET /api/v1/drivers - List all drivers
  fastify.get(
    '/',
    {
      schema: {
        description: 'Get all F1 drivers',
        tags: ['drivers'],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1, default: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            nationality: { type: 'string' },
            search: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  drivers: { type: 'array' },
                },
              },
              meta: {
                type: 'object',
                properties: {
                  page: { type: 'integer' },
                  limit: { type: 'integer' },
                  total: { type: 'integer' },
                  totalPages: { type: 'integer' },
                },
              },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Querystring: DriverQueryParams }>,
      reply: FastifyReply
    ) => {
      try {
        const params = request.query;
        const result = await driverService.getAllDrivers(params);

        return reply.status(200).send({
          status: 'success',
          data: {
            drivers: result.drivers,
          },
          meta: result.meta,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          status: 'error',
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch drivers',
          },
        });
      }
    }
  );

  // GET /api/v1/drivers/:id - Get driver by ID
  fastify.get(
    '/:id',
    {
      schema: {
        description: 'Get driver by ID',
        tags: ['drivers'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
          },
          required: ['id'],
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const id = parseInt(request.params.id, 10);

        if (isNaN(id)) {
          return reply.status(400).send({
            status: 'error',
            error: {
              code: 'INVALID_ID',
              message: 'Driver ID must be a valid number',
            },
          });
        }

        const driver = await driverService.getDriverById(id);

        if (!driver) {
          return reply.status(404).send({
            status: 'error',
            error: {
              code: 'DRIVER_NOT_FOUND',
              message: `Driver with ID ${id} not found`,
            },
          });
        }

        return reply.status(200).send({
          status: 'success',
          data: {
            driver,
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          status: 'error',
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch driver',
          },
        });
      }
    }
  );

  // GET /api/v1/drivers/ref/:driverRef - Get driver by reference
  fastify.get(
    '/ref/:driverRef',
    {
      schema: {
        description: 'Get driver by driver reference (e.g., "hamilton")',
        tags: ['drivers'],
        params: {
          type: 'object',
          properties: {
            driverRef: { type: 'string' },
          },
          required: ['driverRef'],
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { driverRef: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { driverRef } = request.params;
        const driver = await driverService.getDriverByRef(driverRef);

        if (!driver) {
          return reply.status(404).send({
            status: 'error',
            error: {
              code: 'DRIVER_NOT_FOUND',
              message: `Driver with reference "${driverRef}" not found`,
            },
          });
        }

        return reply.status(200).send({
          status: 'success',
          data: {
            driver,
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          status: 'error',
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch driver',
          },
        });
      }
    }
  );

  // GET /api/v1/drivers/code/:code - Get driver by code
  fastify.get(
    '/code/:code',
    {
      schema: {
        description: 'Get driver by three-letter code (e.g., "HAM", "VER")',
        tags: ['drivers'],
        params: {
          type: 'object',
          properties: {
            code: { type: 'string', minLength: 3, maxLength: 3 },
          },
          required: ['code'],
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { code: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { code } = request.params;
        const driver = await driverService.getDriverByCode(code.toUpperCase());

        if (!driver) {
          return reply.status(404).send({
            status: 'error',
            error: {
              code: 'DRIVER_NOT_FOUND',
              message: `Driver with code "${code}" not found`,
            },
          });
        }

        return reply.status(200).send({
          status: 'success',
          data: {
            driver,
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          status: 'error',
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch driver',
          },
        });
      }
    }
  );
}
