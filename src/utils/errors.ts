/**
 * Custom error classes for the application.
 * Enables structured error handling and proper HTTP status code mapping.
 */

export class AppError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super(message, 400);
  }
}

export class BookingNotFoundError extends AppError {
  constructor() {
    super('Booking not found', 404);
  }
}

export class RideNotFoundError extends AppError {
  constructor() {
    super('Ride not found', 404);
  }
}

export class PassengerNotFoundError extends AppError {
  constructor() {
    super('Passenger not found', 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
  }
}

export class BookingAlreadyMatchedError extends AppError {
  constructor() {
    super('Booking already matched or cancelled', 409);
  }
}

export class CapacityExceededError extends AppError {
  constructor(message: string = 'Cab capacity exceeded') {
    super(message, 400);
  }
}

export class DetourToleranceExceededError extends AppError {
  constructor() {
    super('Passenger detour tolerance exceeded', 400);
  }
}

export class InvalidGeoCoordinatesError extends AppError {
  constructor(message: string = 'Invalid geographic coordinates') {
    super(message, 400);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database error') {
    super(message, 500);
  }
}
