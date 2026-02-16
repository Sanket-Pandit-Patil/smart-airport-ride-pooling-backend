import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as bookingService from '../services/booking-service';

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
router.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = createBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    const { passengerId, pickup, dropoff, luggageCount } = parsed.data;
    const result = await bookingService.createBooking(passengerId, pickup, dropoff, luggageCount ?? 0);
    return res.status(201).json(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
});

/**
 * GET /bookings/:id - Get booking by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const booking = await bookingService.getBooking(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    return res.json(booking);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
});

/**
 * DELETE /bookings/:id - Cancel booking (optimistic lock)
 * Body: { "version": number }
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const version = Number(req.body?.version ?? req.query.version);
    if (Number.isNaN(version) || version < 0) {
      return res.status(400).json({ error: 'Version is required for cancellation' });
    }
    const result = await bookingService.cancelBooking(req.params.id, version);
    if (!result.cancelled) return res.status(409).json({ error: 'Booking not found or already cancelled/matched' });
    return res.json(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
});

export default router;
