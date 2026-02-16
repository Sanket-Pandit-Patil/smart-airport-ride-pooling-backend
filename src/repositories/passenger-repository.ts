import { getPool } from '../db/pool';

const pool = getPool();

export async function createPassenger(name: string): Promise<{ id: string }> {
  const result = await pool.query(
    `INSERT INTO passengers (name) VALUES ($1) RETURNING id`,
    [name]
  );
  return result.rows[0];
}

export async function getPassengerById(id: string): Promise<{ id: string; name: string } | null> {
  const result = await pool.query(`SELECT id, name FROM passengers WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}
