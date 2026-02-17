/**
 * Input validation utilities.
 * Validates geographic coordinates and other inputs.
 */

import { InvalidGeoCoordinatesError, ValidationError } from './errors';

/**
 * Validate geographic coordinates (latitude and longitude).
 * Latitude: -90 to 90
 * Longitude: -180 to 180
 */
export function validateGeoCoordinates(lat: number, lng: number): void {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    throw new InvalidGeoCoordinatesError('Coordinates must be numbers');
  }
  if (lat < -90 || lat > 90) {
    throw new InvalidGeoCoordinatesError(`Invalid latitude: ${lat}. Must be between -90 and 90`);
  }
  if (lng < -180 || lng > 180) {
    throw new InvalidGeoCoordinatesError(`Invalid longitude: ${lng}. Must be between -180 and 180`);
  }
}

/**
 * Validate a location object (pickup or dropoff).
 */
export function validateLocation(location: any, name: string = 'Location'): void {
  if (!location || typeof location !== 'object') {
    throw new ValidationError(`${name} must be an object with lat and lng`);
  }
  const { lat, lng } = location;
  if (lat === undefined || lng === undefined) {
    throw new ValidationError(`${name} must have lat and lng properties`);
  }
  validateGeoCoordinates(lat, lng);
}

/**
 * Validate UUID format.
 */
export function validateUUID(id: string, fieldName: string = 'ID'): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new ValidationError(`${fieldName} must be a valid UUID`);
  }
}

/**
 * Validate luggage count.
 */
export function validateLuggageCount(count: number): void {
  if (!Number.isInteger(count) || count < 0) {
    throw new ValidationError('Luggage count must be a non-negative integer');
  }
}

/**
 * Validate passenger name.
 */
export function validatePassengerName(name: string): void {
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new ValidationError('Passenger name must be a non-empty string');
  }
  if (name.length > 255) {
    throw new ValidationError('Passenger name must not exceed 255 characters');
  }
}

/**
 * Validate version number (for optimistic locking).
 */
export function validateVersion(version: any): number {
  if (version === undefined || version === null) {
    throw new ValidationError('Version is required for this operation');
  }
  const ver = Number(version);
  if (!Number.isInteger(ver) || ver < 0) {
    throw new ValidationError('Version must be a non-negative integer');
  }
  return ver;
}
