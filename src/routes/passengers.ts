import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as passengerRepo from '../repositories/passenger-repository';
import { validatePassengerName, validateUUID } from '../utils/validation';
import { ValidationError } from '../utils/errors';
import { successResponse, validationErrorResponse, notFoundResponse } from '../utils/response';

const router = Router();

const createPassengerSchema = z.object({
  name: z.string().min(1).max(255),
});

/**
 * POST /passengers - Create a passenger
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createPassengerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(validationErrorResponse(parsed.error.flatten().fieldErrors));
    }
    validatePassengerName(parsed.data.name);
    const passenger = await passengerRepo.createPassenger(parsed.data.name);
    return res.status(201).json(successResponse(passenger, 'Passenger created successfully', 201));
  } catch (e: unknown) {
    if (e instanceof ValidationError) {
      return res.status(e.statusCode).json(validationErrorResponse({ message: e.message }));
    }
    next(e);
  }
});

/**
 * GET /passengers/:id - Get passenger by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    validateUUID(req.params.id, 'Passenger ID');
    const passenger = await passengerRepo.getPassengerById(req.params.id);
    if (!passenger) {
      return res.status(404).json(notFoundResponse('Passenger not found'));
    }
    return res.json(successResponse(passenger, 'Passenger retrieved successfully'));
  } catch (e: unknown) {
    if (e instanceof ValidationError) {
      return res.status(e.statusCode).json(validationErrorResponse({ message: e.message }));
    }
    next(e);
  }
});

export default router;
