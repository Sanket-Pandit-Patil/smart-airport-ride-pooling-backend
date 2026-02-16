import { getPool } from '../db/pool';
import type { BookingRecord } from '../types';

const pool = getPool();

export async function createBooking(
  passengerId: string,
  pickupLat: number,
  pickupLng: number,
  dropoffLat: number,
  dropoffLng: number,
  luggageCount: number
): Promise<BookingRecord> {
  const result = await pool.query(
    `INSERT INTO bookings (passenger_id, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, luggage_count, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
     RETURNING id, passenger_id, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, luggage_count, status, ride_id, version`,
    [passengerId, pickupLat, pickupLng, dropoffLat, dropoffLng, luggageCount ?? 0]
  );
  return result.rows[0] as BookingRecord;
}

/**
 * Fetch PENDING bookings with FOR UPDATE SKIP LOCKED for concurrent matching.
 * Only one matcher process will see each row at a time.
 */
export async function getPendingBookingsForMatching(): Promise<BookingRecord[]> {
  const result = await pool.query(
    `SELECT id, passenger_id, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, luggage_count, status, ride_id, version
     FROM bookings
     WHERE status = 'PENDING'
     ORDER BY created_at ASC
     FOR UPDATE SKIP LOCKED`
  );
  return result.rows as BookingRecord[];
}

export async function getPendingBookings(): Promise<BookingRecord[]> {
  const result = await pool.query(
    `SELECT id, passenger_id, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, luggage_count, status, ride_id, version
     FROM bookings WHERE status = 'PENDING' ORDER BY created_at ASC`
  );
  return result.rows as BookingRecord[];
}

export async function getBookingById(id: string): Promise<BookingRecord | null> {
  const result = await pool.query(
    `SELECT id, passenger_id, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, luggage_count, status, ride_id, version
     FROM bookings WHERE id = $1`,
    [id]
  );
  return (result.rows[0] as BookingRecord) ?? null;
}

/**
 * Optimistic lock: cancel only if version matches (handles concurrent cancellations).
 */
export async function cancelBooking(id: string, version: number): Promise<boolean> {
  const result = await pool.query(
    `UPDATE bookings SET status = 'CANCELLED', updated_at = NOW(), version = version + 1
     WHERE id = $1 AND status = 'PENDING' AND version = $2`,
    [id, version]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function assignBookingToRide(
  bookingId: string,
  rideId: string,
  version: number
): Promise<boolean> {
  const result = await pool.query(
    `UPDATE bookings SET ride_id = $1, status = 'MATCHED', updated_at = NOW(), version = version + 1
     WHERE id = $2 AND status = 'PENDING' AND version = $3`,
    [rideId, bookingId, version]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function getBookingsByRideId(rideId: string): Promise<BookingRecord[]> {
  const result = await pool.query(
    `SELECT id, passenger_id, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, luggage_count, status, ride_id, version
     FROM bookings WHERE ride_id = $1`,
    [rideId]
  );
  return result.rows as BookingRecord[];
}
