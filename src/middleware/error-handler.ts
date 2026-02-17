/**
 * Middleware for request logging and error handling.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { errorResponse } from '../utils/response';

/**
 * Request logging middleware.
 */
export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });

  next();
}

/**
 * Global error handling middleware.
 * Should be registered after all other middleware and routes.
 */
export function errorHandlingMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error('Error occurred', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof AppError) {
    res.status(err.statusCode).json(errorResponse(err.message, err.name, err.statusCode));
    return;
  }

  // Handle unexpected errors
  res.status(500).json(errorResponse('Internal server error', 'INTERNAL_ERROR', 500));
}
