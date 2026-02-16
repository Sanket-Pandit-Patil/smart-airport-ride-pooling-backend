import { getPool } from '../db/pool';
import type { CabRecord } from '../types';
import { config } from '../config';

const pool = getPool();

export async function listCabs(): Promise<CabRecord[]> {
  const result = await pool.query(
    `SELECT id, seats, luggage_capacity FROM cabs ORDER BY id`
  );
  return result.rows as CabRecord[];
}

export async function ensureDefaultCabs(): Promise<void> {
  const count = await pool.query(`SELECT COUNT(*)::int AS c FROM cabs`);
  if (count.rows[0].c > 0) return;
  const seats = config.defaultCabSeats;
  const luggage = config.defaultCabLuggage;
  for (let i = 0; i < 50; i++) {
    await pool.query(
      `INSERT INTO cabs (seats, luggage_capacity) VALUES ($1, $2)`,
      [seats, luggage]
    );
  }
}

export async function createCab(seats: number, luggageCapacity: number): Promise<CabRecord> {
  const result = await pool.query(
    `INSERT INTO cabs (seats, luggage_capacity) VALUES ($1, $2) RETURNING id, seats, luggage_capacity`,
    [seats, luggageCapacity]
  );
  return result.rows[0] as CabRecord;
}
