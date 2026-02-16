import { Router, Request, Response } from 'express';
import { getPool } from '../db/pool';

const router = Router();

/**
 * GET /health - Liveness/readiness (checks DB)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const pool = getPool();
    await pool.query('SELECT 1');
    return res.json({ status: 'ok', db: 'connected' });
  } catch {
    return res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

export default router;
