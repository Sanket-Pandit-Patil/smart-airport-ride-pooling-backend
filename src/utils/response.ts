/**
 * API response envelope for consistent response structure.
 */

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: string;
}

/**
 * Create a success response.
 */
export function successResponse<T>(
  data?: T,
  message: string = 'Success',
  statusCode: number = 200
): ApiResponse<T> {
  return {
    success: true,
    statusCode,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create an error response.
 */
export function errorResponse(
  message: string,
  code: string = 'INTERNAL_ERROR',
  statusCode: number = 500,
  details?: Record<string, any>
): ApiResponse<any> {
  return {
    success: false,
    statusCode,
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validation error response helper.
 */
export function validationErrorResponse(details?: Record<string, any>): ApiResponse<any> {
  return errorResponse(
    'Validation failed',
    'VALIDATION_ERROR',
    400,
    details
  );
}

/**
 * Not found error response helper.
 */
export function notFoundResponse(message: string = 'Resource not found'): ApiResponse<any> {
  return errorResponse(message, 'NOT_FOUND', 404);
}

/**
 * Conflict error response helper.
 */
export function conflictResponse(message: string = 'Resource conflict'): ApiResponse<any> {
  return errorResponse(message, 'CONFLICT', 409);
}
