import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { standingsService } from '../../services/standingsService';
import type { ApiResponse, StandingsQueryParams } from '../../types/api';
import { standingsQuerySchema } from '../../utils/validation';

export async function standingsRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/v1/standings/drivers
   * Get driver championship standings
   * Query params:
   * - season: year (e.g., 2024) - optional
   * - round: race round number - optional (requires season)
   */
  fastify.get(
    '/drivers',
    async (
      request: FastifyRequest<{ Querystring: Record<string, string> }>,
      reply: FastifyReply
    ) => {
      try {
        // Validate query parameters
        const validationResult = standingsQuerySchema.safeParse(request.query);

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

        const params: StandingsQueryParams = validationResult.data;

        // Validate that round requires season
        if (params.round && !params.season) {
          return reply.status(400).send({
            status: 'error',
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Round parameter requires season parameter',
            },
          } as ApiResponse<never>);
        }

        const result = await standingsService.getDriverStandings(params);

        if (!result) {
          return reply.status(404).send({
            status: 'error',
            error: {
              code: 'NOT_FOUND',
              message: params.season
                ? `No standings found for season ${params.season}${params.round ? ` round ${params.round}` : ''}`
                : 'No standings data available',
            },
          } as ApiResponse<never>);
        }

        return reply.status(200).send({
          status: 'success',
          data: result.standings,
          meta: {
            season: result.season,
            round: result.round,
            raceName: result.raceName,
          },
        } as unknown as ApiResponse<typeof result.standings>);
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          status: 'error',
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch driver standings',
          },
        } as ApiResponse<never>);
      }
    }
  );

  /**
   * GET /api/v1/standings/constructors
   * Get constructor championship standings
   * Query params:
   * - season: year (e.g., 2024) - optional
   * - round: race round number - optional (requires season)
   */
  fastify.get(
    '/constructors',
    async (
      request: FastifyRequest<{ Querystring: Record<string, string> }>,
      reply: FastifyReply
    ) => {
      try {
        // Validate query parameters
        const validationResult = standingsQuerySchema.safeParse(request.query);

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

        const params: StandingsQueryParams = validationResult.data;

        // Validate that round requires season
        if (params.round && !params.season) {
          return reply.status(400).send({
            status: 'error',
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Round parameter requires season parameter',
            },
          } as ApiResponse<never>);
        }

        const result = await standingsService.getConstructorStandings(params);

        if (!result) {
          return reply.status(404).send({
            status: 'error',
            error: {
              code: 'NOT_FOUND',
              message: params.season
                ? `No standings found for season ${params.season}${params.round ? ` round ${params.round}` : ''}`
                : 'No standings data available',
            },
          } as ApiResponse<never>);
        }

        return reply.status(200).send({
          status: 'success',
          data: result.standings,
          meta: {
            season: result.season,
            round: result.round,
            raceName: result.raceName,
          },
        } as unknown as ApiResponse<typeof result.standings>);
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          status: 'error',
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch constructor standings',
          },
        } as ApiResponse<never>);
      }
    }
  );
}
