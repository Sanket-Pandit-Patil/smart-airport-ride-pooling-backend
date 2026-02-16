import { getPool } from '../db/pool';
import type { RideRecord } from '../types';
import type { Waypoint } from '../types';

const pool = getPool();

export async function createRide(cabId: string): Promise<RideRecord> {
  const result = await pool.query(
    `INSERT INTO rides (cab_id, status) VALUES ($1, 'ACTIVE') RETURNING id, cab_id, total_distance_km, total_fare, status`,
    [cabId]
  );
  return result.rows[0] as RideRecord;
}

export async function updateRideDistanceAndFare(
  rideId: string,
  totalDistanceKm: number,
  totalFare: number
): Promise<void> {
  await pool.query(
    `UPDATE rides SET total_distance_km = $1, total_fare = $2, updated_at = NOW() WHERE id = $3`,
    [totalDistanceKm, totalFare, rideId]
  );
}

export async function insertWaypoints(rideId: string, waypoints: Waypoint[]): Promise<void> {
  if (waypoints.length === 0) return;
  const values = waypoints
    .map(
      (w, i) =>
        `(uuid_generate_v4(), '${rideId}', '${w.bookingId}', ${w.sequence}, ${w.lat}, ${w.lng}, '${w.type}')`
    )
    .join(',');
  await pool.query(
    `INSERT INTO ride_waypoints (id, ride_id, booking_id, sequence, lat, lng, waypoint_type) VALUES ${values}`
  );
}

/** Safer parameterized batch insert for waypoints */
export async function insertWaypointsSafe(
  rideId: string,
  waypoints: Array<{ bookingId: string; sequence: number; lat: number; lng: number; type: string }>
): Promise<void> {
  for (const w of waypoints) {
    await pool.query(
      `INSERT INTO ride_waypoints (ride_id, booking_id, sequence, lat, lng, waypoint_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [rideId, w.bookingId, w.sequence, w.lat, w.lng, w.type]
    );
  }
}

export async function getRideById(id: string): Promise<RideRecord | null> {
  const result = await pool.query(
    `SELECT id, cab_id, total_distance_km, total_fare, status FROM rides WHERE id = $1`,
    [id]
  );
  return (result.rows[0] as RideRecord) ?? null;
}

export async function getActiveRides(): Promise<RideRecord[]> {
  const result = await pool.query(
    `SELECT id, cab_id, total_distance_km, total_fare, status FROM rides WHERE status = 'ACTIVE'`
  );
  return result.rows as RideRecord[];
}
