import { Router, Request, Response } from 'express';
import * as bookingService from '../services/booking-service';

const router = Router();

/**
 * POST /rides/match - Run the pooling algorithm and assign pending bookings to rides
 * (Concurrency-safe: uses transaction + FOR UPDATE SKIP LOCKED)
 */
router.post('/match', async (req: Request, res: Response) => {
  try {
    const result = await bookingService.runMatching();
    return res.json(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
});

/**
 * GET /rides/:id - Get ride details with bookings
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const ride = await bookingService.getRide(req.params.id);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    return res.json(ride);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
});

export default router;
