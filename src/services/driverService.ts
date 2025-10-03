/**
 * Driver Service
 * Business logic for driver-related operations
 */

import { PrismaClient } from '@prisma/client';
import type {
  DriverDTO,
  DriverQueryParams,
  PaginationMeta,
} from '../types/api';

const prisma = new PrismaClient();

/**
 * Convert Prisma Driver to DTO
 */
function toDriverDTO(driver: any): DriverDTO {
  return {
    id: driver.id,
    driverRef: driver.driverRef,
    number: driver.number,
    code: driver.code,
    forename: driver.forename,
    surname: driver.surname,
    fullName: `${driver.forename} ${driver.surname}`,
    dob: driver.dob.toISOString().split('T')[0], // Format as YYYY-MM-DD
    nationality: driver.nationality,
    url: driver.url,
  };
}

/**
 * Get all drivers with pagination and filtering
 */
export async function getAllDrivers(params: DriverQueryParams = {}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  // Build where clause for filtering
  const where: any = {};

  if (params.nationality) {
    where.nationality = {
      equals: params.nationality,
      mode: 'insensitive',
    };
  }

  if (params.search) {
    where.OR = [
      {
        forename: {
          contains: params.search,
          mode: 'insensitive',
        },
      },
      {
        surname: {
          contains: params.search,
          mode: 'insensitive',
        },
      },
      {
        code: {
          contains: params.search,
          mode: 'insensitive',
        },
      },
      {
        driverRef: {
          contains: params.search,
          mode: 'insensitive',
        },
      },
    ];
  }

  // Execute queries in parallel
  const [drivers, total] = await Promise.all([
    prisma.driver.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ surname: 'asc' }, { forename: 'asc' }],
    }),
    prisma.driver.count({ where }),
  ]);

  const driverDTOs = drivers.map(toDriverDTO);

  const meta: PaginationMeta = {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };

  return { drivers: driverDTOs, meta };
}

/**
 * Get driver by ID
 */
export async function getDriverById(id: number) {
  const driver = await prisma.driver.findUnique({
    where: { id },
  });

  if (!driver) {
    return null;
  }

  return toDriverDTO(driver);
}

/**
 * Get driver by driver reference
 */
export async function getDriverByRef(driverRef: string) {
  const driver = await prisma.driver.findUnique({
    where: { driverRef },
  });

  if (!driver) {
    return null;
  }

  return toDriverDTO(driver);
}

/**
 * Get driver by code (e.g., "HAM", "VER")
 */
export async function getDriverByCode(code: string) {
  const driver = await prisma.driver.findUnique({
    where: { code },
  });

  if (!driver) {
    return null;
  }

  return toDriverDTO(driver);
}

/**
 * Search drivers by name
 */
export async function searchDrivers(query: string, limit: number = 10) {
  const drivers = await prisma.driver.findMany({
    where: {
      OR: [
        {
          forename: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          surname: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          code: {
            contains: query,
            mode: 'insensitive',
          },
        },
      ],
    },
    take: limit,
    orderBy: [{ surname: 'asc' }, { forename: 'asc' }],
  });

  return drivers.map(toDriverDTO);
}
