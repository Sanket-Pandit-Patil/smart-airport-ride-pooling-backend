import * as bookingRepo from '../repositories/booking-repository';
import * as rideRepo from '../repositories/ride-repository';
import * as cabRepo from '../repositories/cab-repository';
import * as passengerRepo from '../repositories/passenger-repository';
import {
  computePooling,
  type RideGroup,
  passengerRouteDistanceKm,
} from './pooling-algorithm';
import { computePassengerFare } from './pricing';
import { haversineKm } from './geo';
import { getPool } from '../db/pool';
import type { BookingRecord } from '../types';

const pool = getPool();

/**
 * Create a new booking (concurrency-safe: single INSERT).
 */
export async function createBooking(
  passengerId: string,
  pickup: { lat: number; lng: number },
  dropoff: { lat: number; lng: number },
  luggageCount: number
): Promise<{ bookingId: string; status: string }> {
  const passenger = await passengerRepo.getPassengerById(passengerId);
  if (!passenger) throw new Error('Passenger not found');
  const booking = await bookingRepo.createBooking(
    passengerId,
    pickup.lat,
    pickup.lng,
    dropoff.lat,
    dropoff.lng,
    luggageCount ?? 0
  );
  return { bookingId: booking.id, status: booking.status };
}

/**
 * Cancel a booking. Optimistic locking (version) for concurrent cancellations.
 */
export async function cancelBooking(bookingId: string, version: number): Promise<{ cancelled: boolean }> {
  const ok = await bookingRepo.cancelBooking(bookingId, version);
  return { cancelled: ok };
}

/**
 * Run matching in a transaction with FOR UPDATE SKIP LOCKED so concurrent requests
 * don't double-assign. Builds ride groups and persists them.
 */
export async function runMatching(): Promise<{ ridesCreated: number; bookingsMatched: number }> {
  let cabs = await cabRepo.listCabs();
  if (cabs.length === 0) {
    await cabRepo.ensureDefaultCabs();
    cabs = await cabRepo.listCabs();
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const pending = await client.query(
      `SELECT id, passenger_id, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, luggage_count, status, ride_id, version
       FROM bookings WHERE status = 'PENDING' ORDER BY created_at ASC FOR UPDATE SKIP LOCKED`
    );
    const rows = pending.rows as BookingRecord[];
    if (rows.length === 0) {
      await client.query('COMMIT');
      return { ridesCreated: 0, bookingsMatched: 0 };
    }
    const existingRides: RideGroup[] = [];
    const groups = computePooling(
      rows,
      existingRides,
      cabs.map((c) => ({ id: c.id, seats: c.seats, luggage_capacity: c.luggage_capacity }))
    );

    let cabIndex = 0;
    let bookingsMatched = 0;
    for (const group of groups) {
      const cab = cabs[cabIndex % cabs.length];
      const [ride] = await client.query(
        `INSERT INTO rides (cab_id, status) VALUES ($1, 'ACTIVE') RETURNING id, cab_id, total_distance_km, total_fare, status`,
        [cab.id]
      ).then((r) => r.rows);
      const rideId = ride.id;
      const totalDistanceKm = group.totalDistanceKm;
      const passengerFares = group.bookings.map((b) => {
        const direct = haversineKm(
          Number(b.pickup_lat),
          Number(b.pickup_lng),
          Number(b.dropoff_lat),
          Number(b.dropoff_lng)
        );
        const actual = passengerRouteDistanceKm(group.waypoints, b.id);
        return computePassengerFare(direct, actual, group.bookings.length);
      });
      const totalFare = passengerFares.reduce((a, b) => a + b, 0);
      await client.query(
        `UPDATE rides SET total_distance_km = $1, total_fare = $2, updated_at = NOW() WHERE id = $3`,
        [totalDistanceKm, totalFare, rideId]
      );
      for (const wp of group.waypoints) {
        await client.query(
          `INSERT INTO ride_waypoints (ride_id, booking_id, sequence, lat, lng, waypoint_type) VALUES ($1, $2, $3, $4, $5, $6)`,
          [rideId, wp.bookingId, wp.sequence, wp.lat, wp.lng, wp.type]
        );
      }
      for (const b of group.bookings) {
        await client.query(
          `UPDATE bookings SET ride_id = $1, status = 'MATCHED', updated_at = NOW(), version = version + 1 WHERE id = $2`,
          [rideId, b.id]
        );
        bookingsMatched++;
      }
      cabIndex++;
    }
    await client.query('COMMIT');
    return { ridesCreated: groups.length, bookingsMatched };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function getBooking(bookingId: string) {
  return bookingRepo.getBookingById(bookingId);
}

export async function getRide(rideId: string) {
  const ride = await rideRepo.getRideById(rideId);
  if (!ride) return null;
  const bookings = await bookingRepo.getBookingsByRideId(rideId);
  return { ...ride, bookings };
}
