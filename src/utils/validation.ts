/**
 * Shared Validation Utilities
 * Zod schemas for API request validation
 */

import { z } from 'zod';

/**
 * Helper for parsing integers from strings with proper NaN validation
 */
const stringToInt = (fieldName: string) =>
  z
    .string()
    .refine((val) => !isNaN(parseInt(val, 10)), {
      message: `${fieldName} must be a valid number`,
    })
    .transform((val) => parseInt(val, 10));

/**
 * Optional string to int (for query params with defaults)
 */
const optionalStringToInt = (defaultValue: number) =>
  z
    .string()
    .optional()
    .refine(
      (val) => val === undefined || !isNaN(parseInt(val, 10)),
      'Must be a valid number'
    )
    .transform((val) => (val ? parseInt(val, 10) : defaultValue));

// ==========================================
// QUERY SCHEMAS (for list endpoints)
// ==========================================

export const paginatedQuerySchema = z.object({
  page: optionalStringToInt(1),
  limit: optionalStringToInt(20),
});

export const driverQuerySchema = paginatedQuerySchema.extend({
  nationality: z.string().optional(),
  search: z.string().optional(),
});

export const teamQuerySchema = paginatedQuerySchema.extend({
  nationality: z.string().optional(),
  search: z.string().optional(),
});

export const circuitQuerySchema = paginatedQuerySchema.extend({
  country: z.string().optional(),
  search: z.string().optional(),
});

export const seasonQuerySchema = paginatedQuerySchema;

export const raceQuerySchema = paginatedQuerySchema.extend({
  season: z
    .string()
    .optional()
    .refine(
      (val) => val === undefined || !isNaN(parseInt(val, 10)),
      'Season must be a valid number'
    )
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  circuit: z.string().optional(),
});

export const standingsQuerySchema = z.object({
  season: z
    .string()
    .optional()
    .refine(
      (val) => val === undefined || !isNaN(parseInt(val, 10)),
      'Season must be a valid number'
    )
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  round: z
    .string()
    .optional()
    .refine(
      (val) => val === undefined || !isNaN(parseInt(val, 10)),
      'Round must be a valid number'
    )
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
});

// ==========================================
// PARAMETER SCHEMAS (for :id, :ref routes)
// ==========================================

export const idParamSchema = z.object({
  id: stringToInt('ID'),
});

export const refParamSchema = z.object({
  ref: z.string().min(1, 'Reference cannot be empty'),
});

export const yearParamSchema = z.object({
  year: stringToInt('Year'),
});
