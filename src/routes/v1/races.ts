import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { raceService } from '../../services/raceService';
import type { ApiResponse, RaceQueryParams } from '../../types/api';

// Validation schemas
const raceQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
  season: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  circuit: z.string().optional(),
});

const raceIdParamSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10)),
});

const seasonYearParamSchema = z.object({
  year: z.string().transform((val) => parseInt(val, 10)),
});

export async function raceRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/v1/races
   * Get all races with pagination and filtering
   */
  fastify.get(
    '/',
    async (
      request: FastifyRequest<{ Querystring: Record<string, string> }>,
      reply: FastifyReply
    ) => {
      try {
        // Validate query parameters
        const validationResult = raceQuerySchema.safeParse(request.query);

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

        const params: RaceQueryParams = validationResult.data;

        // Get races from service
        const { races, meta } = await raceService.getAllRaces(params);

        return reply.status(200).send({
          status: 'success',
          data: races,
          meta,
        } as ApiResponse<typeof races>);
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          status: 'error',
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch races',
          },
        } as ApiResponse<never>);
      }
    }
  );

  /**
   * GET /api/v1/races/season/:year
   * Get all races for a specific season
   */
  fastify.get(
    '/season/:year',
    async (
      request: FastifyRequest<{ Params: { year: string } }>,
      reply: FastifyReply
    ) => {
      try {
        // Validate year parameter
        const validationResult = seasonYearParamSchema.safeParse(
          request.params
        );

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

        // Check if year is reasonable
        if (year < 1950 || year > new Date().getFullYear() + 1) {
          return reply.status(400).send({
            status: 'error',
            error: {
              code: 'INVALID_YEAR',
              message: `Season year must be between 1950 and ${new Date().getFullYear() + 1}`,
            },
          } as ApiResponse<never>);
        }

        const result = await raceService.getRacesBySeason(year);

        if (!result) {
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
          data: result.races,
          meta: {
            season: result.season,
            totalRaces: result.races.length,
          },
        } as unknown as ApiResponse<typeof result.races>);
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          status: 'error',
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch races',
          },
        } as ApiResponse<never>);
      }
    }
  );

  /**
   * GET /api/v1/races/:id
   * Get race by ID
   */
  fastify.get(
    '/:id',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        // Validate ID parameter
        const validationResult = raceIdParamSchema.safeParse(request.params);

        if (!validationResult.success) {
          return reply.status(400).send({
            status: 'error',
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid race ID',
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
              message: 'Race ID out of range',
            },
          } as ApiResponse<never>);
        }

        const race = await raceService.getRaceById(id);

        if (!race) {
          return reply.status(404).send({
            status: 'error',
            error: {
              code: 'NOT_FOUND',
              message: `Race with ID ${id} not found`,
            },
          } as ApiResponse<never>);
        }

        return reply.status(200).send({
          status: 'success',
          data: race,
        } as ApiResponse<typeof race>);
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          status: 'error',
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch race',
          },
        } as ApiResponse<never>);
      }
    }
  );

  /**
   * GET /api/v1/races/:id/results
   * Get race results for a specific race
   */
  fastify.get(
    '/:id/results',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        // Validate ID parameter
        const validationResult = raceIdParamSchema.safeParse(request.params);

        if (!validationResult.success) {
          return reply.status(400).send({
            status: 'error',
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid race ID',
            },
          } as ApiResponse<never>);
        }

        const { id } = validationResult.data;

        const results = await raceService.getRaceResults(id);

        if (results === null) {
          return reply.status(404).send({
            status: 'error',
            error: {
              code: 'NOT_FOUND',
              message: `Race with ID ${id} not found`,
            },
          } as ApiResponse<never>);
        }

        return reply.status(200).send({
          status: 'success',
          data: results,
        } as ApiResponse<typeof results>);
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          status: 'error',
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch race results',
          },
        } as ApiResponse<never>);
      }
    }
  );

  /**
   * GET /api/v1/races/:id/qualifying
   * Get qualifying results for a specific race
   */
  fastify.get(
    '/:id/qualifying',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        // Validate ID parameter
        const validationResult = raceIdParamSchema.safeParse(request.params);

        if (!validationResult.success) {
          return reply.status(400).send({
            status: 'error',
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid race ID',
            },
          } as ApiResponse<never>);
        }

        const { id } = validationResult.data;

        const results = await raceService.getQualifyingResults(id);

        if (results === null) {
          return reply.status(404).send({
            status: 'error',
            error: {
              code: 'NOT_FOUND',
              message: `Race with ID ${id} not found`,
            },
          } as ApiResponse<never>);
        }

        return reply.status(200).send({
          status: 'success',
          data: results,
        } as ApiResponse<typeof results>);
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          status: 'error',
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch qualifying results',
          },
        } as ApiResponse<never>);
      }
    }
  );
}
