import { PrismaClient } from '@prisma/client';
import type {
  CircuitResponse,
  PaginationMeta,
  PaginationParams,
} from '../types/api';

const prisma = new PrismaClient();

export interface CircuitQueryParams extends PaginationParams {
  country?: string;
  search?: string;
}

export interface CircuitDetailResponse extends CircuitResponse {
  stats?: {
    totalRaces: number;
    firstRace?: {
      year: number;
      name: string;
    };
    lastRace?: {
      year: number;
      name: string;
    };
  };
}

export class CircuitService {
  /**
   * Get all circuits with pagination and optional filtering
   */
  async getAllCircuits(
    params: CircuitQueryParams
  ): Promise<{ circuits: CircuitResponse[]; meta: PaginationMeta }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (params.country) {
      where.country = {
        equals: params.country,
        mode: 'insensitive',
      };
    }

    if (params.search) {
      where.OR = [
        {
          name: {
            contains: params.search,
            mode: 'insensitive',
          },
        },
        {
          location: {
            contains: params.search,
            mode: 'insensitive',
          },
        },
        {
          circuitRef: {
            contains: params.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Execute query with pagination
    const [circuits, total] = await Promise.all([
      prisma.circuit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.circuit.count({ where }),
    ]);

    // Transform to response format
    const circuitResponses: CircuitResponse[] = circuits.map((circuit) =>
      this.transformCircuitToResponse(circuit)
    );

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const meta: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return { circuits: circuitResponses, meta };
  }

  /**
   * Get a single circuit by ID
   */
  async getCircuitById(id: number): Promise<CircuitDetailResponse | null> {
    const circuit = await prisma.circuit.findUnique({
      where: { id },
      include: {
        races: {
          include: {
            season: true,
          },
          orderBy: {
            date: 'asc',
          },
        },
      },
    });

    if (!circuit) {
      return null;
    }

    // Calculate statistics
    const totalRaces = circuit.races.length;
    const firstRace = circuit.races[0]
      ? {
          year: circuit.races[0].season.year,
          name: circuit.races[0].name,
        }
      : undefined;
    const lastRace = circuit.races[circuit.races.length - 1]
      ? {
          year: circuit.races[circuit.races.length - 1].season.year,
          name: circuit.races[circuit.races.length - 1].name,
        }
      : undefined;

    const response: CircuitDetailResponse = {
      ...this.transformCircuitToResponse(circuit),
      stats: {
        totalRaces,
        firstRace,
        lastRace,
      },
    };

    return response;
  }

  /**
   * Get circuit by reference (e.g., "monza")
   */
  async getCircuitByRef(
    circuitRef: string
  ): Promise<CircuitDetailResponse | null> {
    const circuit = await prisma.circuit.findUnique({
      where: { circuitRef },
      include: {
        races: {
          include: {
            season: true,
          },
          orderBy: {
            date: 'asc',
          },
        },
      },
    });

    if (!circuit) {
      return null;
    }

    // Calculate statistics (same as getCircuitById)
    const totalRaces = circuit.races.length;
    const firstRace = circuit.races[0]
      ? {
          year: circuit.races[0].season.year,
          name: circuit.races[0].name,
        }
      : undefined;
    const lastRace = circuit.races[circuit.races.length - 1]
      ? {
          year: circuit.races[circuit.races.length - 1].season.year,
          name: circuit.races[circuit.races.length - 1].name,
        }
      : undefined;

    const response: CircuitDetailResponse = {
      ...this.transformCircuitToResponse(circuit),
      stats: {
        totalRaces,
        firstRace,
        lastRace,
      },
    };

    return response;
  }

  /**
   * Transform Prisma circuit model to API response
   */
  private transformCircuitToResponse(circuit: any): CircuitResponse {
    return {
      id: circuit.id,
      circuitRef: circuit.circuitRef,
      name: circuit.name,
      location: circuit.location,
      country: circuit.country,
      lat: circuit.lat,
      lng: circuit.lng,
      alt: circuit.alt,
      url: circuit.url,
    };
  }

  /**
   * Get list of all countries (for filtering)
   */
  async getCountries(): Promise<string[]> {
    const circuits = await prisma.circuit.findMany({
      select: { country: true },
      distinct: ['country'],
      orderBy: { country: 'asc' },
    });

    return circuits.map((c) => c.country);
  }
}

// Export singleton instance
export const circuitService = new CircuitService();
