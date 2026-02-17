import { Router, Request, Response, NextFunction } from 'express';
import * as bookingService from '../services/booking-service';
import { validateUUID } from '../utils/validation';
import { ValidationError } from '../utils/errors';
import { successResponse, notFoundResponse } from '../utils/response';

const router = Router();

/**
 * POST /rides/match - Run the pooling algorithm and assign pending bookings to rides
 * (Concurrency-safe: uses transaction + FOR UPDATE SKIP LOCKED)
 */
router.post('/match', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await bookingService.runMatching();
    return res.json(successResponse(result, 'Matching completed successfully'));
  } catch (e: unknown) {
    next(e);
  }
});

/**
 * GET /rides/:id - Get ride details with bookings
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    validateUUID(req.params.id, 'Ride ID');
    const ride = await bookingService.getRide(req.params.id);
    if (!ride) {
      return res.status(404).json(notFoundResponse('Ride not found'));
    }
    return res.json(successResponse(ride, 'Ride retrieved successfully'));
  } catch (e: unknown) {
    if (e instanceof ValidationError) {
      return res.status(e.statusCode).json({ error: e.message });
    }
    next(e);
  }
});

export default router;
