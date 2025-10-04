import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { teamService, TeamQueryParams } from '../../services/teamService';
import type { ApiResponse } from '../../types/api';

// Validation schemas
const teamQuerySchema = z.object({
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

const teamIdParamSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10)),
});

const teamRefParamSchema = z.object({
  ref: z.string().min(1),
});

export async function teamRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/v1/teams/nationalities
   * Get list of all team nationalities
   * NOTE: This MUST be defined BEFORE /:id route to avoid conflicts
   */
  fastify.get('/nationalities', async (request, reply) => {
    try {
      const nationalities = await teamService.getNationalities();

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
   * GET /api/v1/teams
   * Get all teams with pagination
   */
  fastify.get(
    '/',
    async (
      request: FastifyRequest<{ Querystring: Record<string, string> }>,
      reply: FastifyReply
    ) => {
      try {
        // Validate query parameters
        const validationResult = teamQuerySchema.safeParse(request.query);

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

        const params: TeamQueryParams = validationResult.data;

        // Get teams from service
        const { teams, meta } = await teamService.getAllTeams(params);

        return reply.status(200).send({
          status: 'success',
          data: teams,
          meta,
        } as ApiResponse<typeof teams>);
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          status: 'error',
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch teams',
          },
        } as ApiResponse<never>);
      }
    }
  );

  /**
   * GET /api/v1/teams/:id
   * Get team by ID
   */
  fastify.get(
    '/:id',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        // Validate ID parameter
        const validationResult = teamIdParamSchema.safeParse(request.params);

        if (!validationResult.success) {
          return reply.status(400).send({
            status: 'error',
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid team ID',
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
              message: 'Team ID out of range',
            },
          } as ApiResponse<never>);
        }

        const team = await teamService.getTeamById(id);

        if (!team) {
          return reply.status(404).send({
            status: 'error',
            error: {
              code: 'NOT_FOUND',
              message: `Team with ID ${id} not found`,
            },
          } as ApiResponse<never>);
        }

        return reply.status(200).send({
          status: 'success',
          data: team,
        } as ApiResponse<typeof team>);
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          status: 'error',
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch team',
          },
        } as ApiResponse<never>);
      }
    }
  );

  /**
   * GET /api/v1/teams/ref/:ref
   * Get team by reference (e.g., "mercedes")
   */
  fastify.get(
    '/ref/:ref',
    async (
      request: FastifyRequest<{ Params: { ref: string } }>,
      reply: FastifyReply
    ) => {
      try {
        // Validate ref parameter
        const validationResult = teamRefParamSchema.safeParse(request.params);

        if (!validationResult.success) {
          return reply.status(400).send({
            status: 'error',
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid team reference',
            },
          } as ApiResponse<never>);
        }

        const { ref } = validationResult.data;

        const team = await teamService.getTeamByRef(ref);

        if (!team) {
          return reply.status(404).send({
            status: 'error',
            error: {
              code: 'NOT_FOUND',
              message: `Team '${ref}' not found`,
            },
          } as ApiResponse<never>);
        }

        return reply.status(200).send({
          status: 'success',
          data: team,
        } as ApiResponse<typeof team>);
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          status: 'error',
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch team',
          },
        } as ApiResponse<never>);
      }
    }
  );
}
