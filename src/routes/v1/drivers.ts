import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { driverService } from '../../services/driverService';
import type { ApiResponse, DriverQueryParams } from '../../types/api';

// Validation schemas
const driverQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
  nationality: z.string().optional(),
  search: z.string().optional(),
});

const driverIdParamSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10)),
});

const driverRefParamSchema = z.object({
  ref: z.string().min(1),
});

export async function driverRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/v1/drivers/nationalities
   * Get list of all driver nationalities
   * NOTE: This MUST be defined BEFORE /:id route to avoid conflicts
   */
  fastify.get('/nationalities', async (request, reply) => {
    try {
      const nationalities = await driverService.getNationalities();

      return reply.status(200).send({
        status: 'success',
        data: nationalities,
      } as ApiResponse<string[]>);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        status: 'error',
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch nationalities',
        },
      } as ApiResponse<never>);
    }
  });

  /**
   * GET /api/v1/drivers
   * Get all drivers with pagination
   */
  fastify.get(
    '/',
    async (
      request: FastifyRequest<{ Querystring: Record<string, string> }>,
      reply: FastifyReply
    ) => {
      try {
        // Validate query parameters
        const validationResult = driverQuerySchema.safeParse(request.query);

        if (!validationResult.success) {
          return reply.status(400).send({
            status: 'error',
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid query parameters',
              details: validationResult.error.format(),
            },
          } as ApiResponse<never>);
        }

        const params: DriverQueryParams = validationResult.data;

        // Get drivers from service
        const { drivers, meta } = await driverService.getAllDrivers(params);

        return reply.status(200).send({
          status: 'success',
          data: drivers,
          meta,
        } as ApiResponse<typeof drivers>);
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          status: 'error',
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch drivers',
          },
        } as ApiResponse<never>);
      }
    }
  );

  /**
   * GET /api/v1/drivers/:id
   * Get driver by ID
   */
  fastify.get(
    '/:id',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        // Validate ID parameter
        const validationResult = driverIdParamSchema.safeParse(request.params);

        if (!validationResult.success) {
          return reply.status(400).send({
            status: 'error',
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid driver ID',
            },
          } as ApiResponse<never>);
        }

        const { id } = validationResult.data;

        // Check if ID is reasonable
        if (id < 1 || id > 1000000) {
          return reply.status(400).send({
            status: 'error',
            error: {
              code: 'INVALID_ID',
              message: 'Driver ID out of range',
            },
          } as ApiResponse<never>);
        }

        const driver = await driverService.getDriverById(id);

        if (!driver) {
          return reply.status(404).send({
            status: 'error',
            error: {
              code: 'NOT_FOUND',
              message: `Driver with ID ${id} not found`,
            },
          } as ApiResponse<never>);
        }

        return reply.status(200).send({
          status: 'success',
          data: driver,
        } as ApiResponse<typeof driver>);
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          status: 'error',
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch driver',
          },
        } as ApiResponse<never>);
      }
    }
  );

  /**
   * GET /api/v1/drivers/ref/:ref
   * Get driver by reference (e.g., "hamilton")
   */
  fastify.get(
    '/ref/:ref',
    async (
      request: FastifyRequest<{ Params: { ref: string } }>,
      reply: FastifyReply
    ) => {
      try {
        // Validate ref parameter
        const validationResult = driverRefParamSchema.safeParse(request.params);

        if (!validationResult.success) {
          return reply.status(400).send({
            status: 'error',
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid driver reference',
            },
          } as ApiResponse<never>);
        }

        const { ref } = validationResult.data;

        const driver = await driverService.getDriverByRef(ref);

        if (!driver) {
          return reply.status(404).send({
            status: 'error',
            error: {
              code: 'NOT_FOUND',
              message: `Driver '${ref}' not found`,
            },
          } as ApiResponse<never>);
        }

        return reply.status(200).send({
          status: 'success',
          data: driver,
        } as ApiResponse<typeof driver>);
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          status: 'error',
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch driver',
          },
        } as ApiResponse<never>);
      }
    }
  );
}
