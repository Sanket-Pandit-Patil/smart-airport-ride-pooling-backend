import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as bookingService from '../services/booking-service';
import {
  validateGeoCoordinates,
  validateLocation,
  validateUUID,
  validateLuggageCount,
  validateVersion,
} from '../utils/validation';
import { ValidationError, BookingNotFoundError, BookingAlreadyMatchedError } from '../utils/errors';
import { successResponse, validationErrorResponse, notFoundResponse, conflictResponse } from '../utils/response';

const router = Router();

const createBookingSchema = z.object({
  passengerId: z.string().uuid(),
  pickup: z.object({ lat: z.number(), lng: z.number() }),
  dropoff: z.object({ lat: z.number(), lng: z.number() }),
  luggageCount: z.number().int().min(0).optional(),
});

/**
 * POST /bookings - Create a new booking
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(validationErrorResponse(parsed.error.flatten().fieldErrors));
    }
    const { passengerId, pickup, dropoff, luggageCount } = parsed.data;
    
    // Validate coordinates
    validateGeoCoordinates(pickup.lat, pickup.lng);
    validateGeoCoordinates(dropoff.lat, dropoff.lng);
    validateLuggageCount(luggageCount ?? 0);
    
    const result = await bookingService.createBooking(passengerId, pickup, dropoff, luggageCount ?? 0);
    return res.status(201).json(successResponse(result, 'Booking created successfully', 201));
  } catch (e: unknown) {
    if (e instanceof ValidationError) {
      return res.status(e.statusCode).json(validationErrorResponse({ message: e.message }));
    }
    next(e);
  }
});

/**
 * GET /bookings/:id - Get booking by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    validateUUID(req.params.id, 'Booking ID');
    const booking = await bookingService.getBooking(req.params.id);
    if (!booking) {
      return res.status(404).json(notFoundResponse('Booking not found'));
    }
    return res.json(successResponse(booking, 'Booking retrieved successfully'));
  } catch (e: unknown) {
    if (e instanceof ValidationError) {
      return res.status(e.statusCode).json(validationErrorResponse({ message: e.message }));
    }
    next(e);
  }
});

/**
 * DELETE /bookings/:id - Cancel booking (optimistic lock)
 * Body: { "version": number }
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    validateUUID(req.params.id, 'Booking ID');
    const version = validateVersion(req.body?.version ?? req.query.version);
    
    const result = await bookingService.cancelBooking(req.params.id, version);
    if (!result.cancelled) {
      return res.status(409).json(conflictResponse('Booking already cancelled or matched'));
    }
    return res.json(successResponse(result, 'Booking cancelled successfully'));
  } catch (e: unknown) {
    if (e instanceof ValidationError) {
      return res.status(e.statusCode).json(validationErrorResponse({ message: e.message }));
    }
    next(e);
  }
});

export default router;
