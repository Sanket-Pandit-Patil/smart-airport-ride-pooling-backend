import { Router, Request, Response } from 'express';
import { getPool } from '../db/pool';
import { successResponse, errorResponse } from '../utils/response';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  database: {
    connected: boolean;
    responseTime?: number;
    error?: string;
  };
  environment: string;
}

/**
 * GET /health - Liveness/readiness check with detailed status
 */
router.get('/', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  const healthStatus: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      connected: false,
    },
    environment: process.env.NODE_ENV || 'development',
  };

  try {
    const pool = getPool();
    const dbStartTime = Date.now();
    await pool.query('SELECT 1');
    const dbResponseTime = Date.now() - dbStartTime;
    
    healthStatus.database.connected = true;
    healthStatus.database.responseTime = dbResponseTime;
    healthStatus.status = 'healthy';
    
    return res.json(successResponse(healthStatus, 'Service is healthy', 200));
  } catch (error) {
    healthStatus.database.connected = false;
    healthStatus.database.error = error instanceof Error ? error.message : 'Unknown error';
    healthStatus.status = 'unhealthy';
    
    return res.status(503).json(errorResponse(
      'Service unhealthy: Database connection failed',
      'SERVICE_UNAVAILABLE',
      503,
      healthStatus
    ));
  }
});

export default router;
