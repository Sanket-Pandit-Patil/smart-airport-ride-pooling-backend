import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as passengerRepo from '../repositories/passenger-repository';

const router = Router();

const createPassengerSchema = z.object({
  name: z.string().min(1).max(255),
});

/**
 * POST /passengers - Create a passenger
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = createPassengerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    const passenger = await passengerRepo.createPassenger(parsed.data.name);
    return res.status(201).json(passenger);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
});

/**
 * GET /passengers/:id - Get passenger by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const passenger = await passengerRepo.getPassengerById(req.params.id);
    if (!passenger) return res.status(404).json({ error: 'Passenger not found' });
    return res.json(passenger);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
});

export default router;
