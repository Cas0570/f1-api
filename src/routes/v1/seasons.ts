import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { seasonService, SeasonQueryParams } from '../../services/seasonService';
import type { ApiResponse } from '../../types/api';
import {
  seasonQuerySchema,
  idParamSchema,
  yearParamSchema,
} from '../../utils/validation';

export async function seasonRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/v1/seasons
   * Get all seasons with pagination
   */
  fastify.get(
    '/',
    async (
      request: FastifyRequest<{ Querystring: Record<string, string> }>,
      reply: FastifyReply
    ) => {
      try {
        // Validate query parameters
        const validationResult = seasonQuerySchema.safeParse(request.query);

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

        const params: SeasonQueryParams = validationResult.data;

        // Get seasons from service
        const { seasons, meta } = await seasonService.getAllSeasons(params);

        return reply.status(200).send({
          status: 'success',
          data: seasons,
          meta,
        } as ApiResponse<typeof seasons>);
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          status: 'error',
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch seasons',
          },
        } as ApiResponse<never>);
      }
    }
  );

  /**
   * GET /api/v1/seasons/:id
   * Get season by ID
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
              message: 'Invalid season ID',
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
              message: 'Season ID out of range',
            },
          } as ApiResponse<never>);
        }

        const season = await seasonService.getSeasonById(id);

        if (!season) {
          return reply.status(404).send({
            status: 'error',
            error: {
              code: 'NOT_FOUND',
              message: `Season with ID ${id} not found`,
            },
          } as ApiResponse<never>);
        }

        return reply.status(200).send({
          status: 'success',
          data: season,
        } as ApiResponse<typeof season>);
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          status: 'error',
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch season',
          },
        } as ApiResponse<never>);
      }
    }
  );

  /**
   * GET /api/v1/seasons/year/:year
   * Get season by year (e.g., 2024)
   */
  fastify.get(
    '/year/:year',
    async (
      request: FastifyRequest<{ Params: { year: string } }>,
      reply: FastifyReply
    ) => {
      try {
        // Validate year parameter
        const validationResult = yearParamSchema.safeParse(request.params);

        if (!validationResult.success) {
          return reply.status(400).send({
            status: 'error',
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid season year',
            },
          } as ApiResponse<never>);
        }

        const { year } = validationResult.data;

        // Check if year is reasonable (F1 started in 1950)
        if (year < 1950 || year > new Date().getFullYear() + 1) {
          return reply.status(400).send({
            status: 'error',
            error: {
              code: 'INVALID_YEAR',
              message: `Season year must be between 1950 and ${new Date().getFullYear() + 1}`,
            },
          } as ApiResponse<never>);
        }

        const season = await seasonService.getSeasonByYear(year);

        if (!season) {
          return reply.status(404).send({
            status: 'error',
            error: {
              code: 'NOT_FOUND',
              message: `Season ${year} not found`,
            },
          } as ApiResponse<never>);
        }

        return reply.status(200).send({
          status: 'success',
          data: season,
        } as ApiResponse<typeof season>);
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          status: 'error',
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch season',
          },
        } as ApiResponse<never>);
      }
    }
  );
}
