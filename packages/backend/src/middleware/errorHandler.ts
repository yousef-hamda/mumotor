import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/errors.js';
import { logger } from '../lib/logger.js';
import { isProd } from '../config/env.js';

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: 'Route not found', code: 'ROUTE_NOT_FOUND' });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: err.message, code: err.code, details: err.details });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.flatten().fieldErrors,
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Resource already exists', code: 'DUPLICATE' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Resource not found', code: 'NOT_FOUND' });
    }
  }

  // A malformed value that reaches a typed column (e.g. a non-UUID id in the URL)
  // is a bad request, not a server fault — surface it as 400, not 500 (L9).
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({ error: 'Invalid request', code: 'BAD_REQUEST' });
  }

  logger.error('Unhandled error', err instanceof Error ? err.stack : err);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(isProd ? {} : { detail: err instanceof Error ? err.message : String(err) }),
  });
}
