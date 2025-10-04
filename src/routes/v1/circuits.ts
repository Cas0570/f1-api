import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  circuitService,
  CircuitQueryParams,
} from '../../services/circuitService';
import type { ApiResponse } from '../../types/api';
import {
  circuitQuerySchema,
  idParamSchema,
  refParamSchema,
} from '../../utils/validation';

export async function circuitRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/v1/circuits/countries
   * Get list of all countries with circuits
   * NOTE: This MUST be defined BEFORE /:id route to avoid conflicts
   */
  fastify.get('/countries', async (request, reply) => {
    try {
      const countries = await circuitService.getCountries();

      return reply.status(200).send({
        status: 'success',
        data: countries,
      } as ApiResponse<string[]>);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        status: 'error',
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch countries',
        },
      } as ApiResponse<never>);
    }
  });

  /**
   * GET /api/v1/circuits
   * Get all circuits with pagination
   */
  fastify.get(
    '/',
    async (
      request: FastifyRequest<{ Querystring: Record<string, string> }>,
      reply: FastifyReply
    ) => {
      try {
        // Validate query parameters
        const validationResult = circuitQuerySchema.safeParse(request.query);

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

        const params: CircuitQueryParams = validationResult.data;

        // Get circuits from service
        const { circuits, meta } = await circuitService.getAllCircuits(params);

        return reply.status(200).send({
          status: 'success',
          data: circuits,
          meta,
        } as ApiResponse<typeof circuits>);
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          status: 'error',
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch circuits',
          },
        } as ApiResponse<never>);
      }
    }
  );

  /**
   * GET /api/v1/circuits/:id
   * Get circuit by ID
   */
  fastify.get(
    '/:id',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        // Validate ID parameter
        const validationResult = idParamSchema.safeParse(request.params);

        if (!validationResult.success) {
          return reply.status(400).send({
            status: 'error',
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid circuit ID',
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
              message: 'Circuit ID out of range',
            },
          } as ApiResponse<never>);
        }

        const circuit = await circuitService.getCircuitById(id);

        if (!circuit) {
          return reply.status(404).send({
            status: 'error',
            error: {
              code: 'NOT_FOUND',
              message: `Circuit with ID ${id} not found`,
            },
          } as ApiResponse<never>);
        }

        return reply.status(200).send({
          status: 'success',
          data: circuit,
        } as ApiResponse<typeof circuit>);
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          status: 'error',
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch circuit',
          },
        } as ApiResponse<never>);
      }
    }
  );

  /**
   * GET /api/v1/circuits/ref/:ref
   * Get circuit by reference (e.g., "monza")
   */
  fastify.get(
    '/ref/:ref',
    async (
      request: FastifyRequest<{ Params: { ref: string } }>,
      reply: FastifyReply
    ) => {
      try {
        // Validate ref parameter
        const validationResult = refParamSchema.safeParse(request.params);

        if (!validationResult.success) {
          return reply.status(400).send({
            status: 'error',
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid circuit reference',
            },
          } as ApiResponse<never>);
        }

        const { ref } = validationResult.data;

        const circuit = await circuitService.getCircuitByRef(ref);

        if (!circuit) {
          return reply.status(404).send({
            status: 'error',
            error: {
              code: 'NOT_FOUND',
              message: `Circuit '${ref}' not found`,
            },
          } as ApiResponse<never>);
        }

        return reply.status(200).send({
          status: 'success',
          data: circuit,
        } as ApiResponse<typeof circuit>);
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          status: 'error',
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch circuit',
          },
        } as ApiResponse<never>);
      }
    }
  );
}
