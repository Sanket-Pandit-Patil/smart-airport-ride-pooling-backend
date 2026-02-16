/**
 * Ride Pooling Algorithm – DSA approach with complexity analysis.
 *
 * Goal: Group passengers into shared cabs while:
 * - Respecting seat and luggage constraints
 * - Minimizing total travel deviation
 * - Ensuring no passenger exceeds detour tolerance
 *
 * Approach: Greedy insertion with detour and capacity checks.
 * Time: O(P * R * W), P=pending bookings, R=existing rides, W=waypoints per ride.
 * Space: O(P + R * W).
 */

import { haversineKm, routeDistanceKm } from './geo';
import { config } from '../config';
import type { BookingRecord } from '../types';
import type { Waypoint } from '../types';

const MAX_DETOUR_FACTOR = config.maxDetourFactor;
const DEFAULT_SEATS = config.defaultCabSeats;
const DEFAULT_LUGGAGE = config.defaultCabLuggage;

export interface RideGroup {
  cabId: string;
  bookings: BookingRecord[];
  waypoints: Waypoint[];
  totalDistanceKm: number;
  seatUsed: number;
  luggageUsed: number;
}

/**
 * Build waypoints for a set of bookings: all pickups then all dropoffs.
 * Pickup order = order of first occurrence; dropoff order = same.
 * This minimizes backtracking when pickups/dropoffs are clustered.
 * Complexity: O(B log B) for sorting, B = bookings.length.
 */
function buildWaypoints(bookings: BookingRecord[]): Waypoint[] {
  const points: Array<{ lat: number; lng: number; bookingId: string; type: 'PICKUP' | 'DROPOFF'; seq: number }> = [];
  bookings.forEach((b, idx) => {
    points.push({
      lat: Number(b.pickup_lat),
      lng: Number(b.pickup_lng),
      bookingId: b.id,
      type: 'PICKUP',
      seq: idx,
    });
    points.push({
      lat: Number(b.dropoff_lat),
      lng: Number(b.dropoff_lng),
      bookingId: b.id,
      type: 'DROPOFF',
      seq: idx,
    });
  });
  // Sort: pickups first by latitude (north-south), then dropoffs by latitude
  points.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'PICKUP' ? -1 : 1;
    return a.lat - b.lat || a.seq - b.seq;
  });
  return points.map((p, i) => ({
    lat: p.lat,
    lng: p.lng,
    bookingId: p.bookingId,
    type: p.type,
    sequence: i + 1,
  }));
}

/**
 * Compute total route distance for waypoints. O(W).
 */
function totalRouteKm(waypoints: Waypoint[]): number {
  return routeDistanceKm(waypoints.map((w) => ({ lat: w.lat, lng: w.lng })));
}

/**
 * For a given booking, compute its in-ride distance (pickup -> dropoff segments along route).
 * Simplified: we use (distance from route start to pickup) + (pickup to dropoff) + (dropoff to next).
 * Actually for detour we need: distance this passenger travels in the shared route.
 * That = distance from first pickup to this pickup + this pickup to this dropoff + (if dropoff not last) some segment.
 * Simpler: passenger's travel = segment from their pickup waypoint to their dropoff waypoint along the route.
 */
function passengerRouteDistanceKm(waypoints: Waypoint[], bookingId: string): number {
  const idxPickup = waypoints.findIndex((w) => w.bookingId === bookingId && w.type === 'PICKUP');
  const idxDropoff = waypoints.findIndex((w) => w.bookingId === bookingId && w.type === 'DROPOFF');
  if (idxPickup === -1 || idxDropoff === -1) return 0;
  let d = 0;
  for (let i = idxPickup; i < idxDropoff; i++) {
    d += haversineKm(waypoints[i].lat, waypoints[i].lng, waypoints[i + 1].lat, waypoints[i + 1].lng);
  }
  return d;
}

/**
 * Check if adding `booking` to a ride with `waypoints` and `bookings` keeps every passenger within detour tolerance.
 * New waypoints = rebuild from bookings + booking. O(B+1).
 */
function detourOk(
  existingBookings: BookingRecord[],
  newBooking: BookingRecord,
  seats: number,
  luggage: number
): { ok: boolean; waypoints: Waypoint[] } {
  const all = [...existingBookings, newBooking];
  const seatUsed = all.reduce((s, b) => s + 1, 0);
  const luggageUsed = all.reduce((s, b) => s + (b.luggage_count || 0), 0);
  if (seatUsed > seats || luggageUsed > luggage) return { ok: false, waypoints: [] };
  const waypoints = buildWaypoints(all);
  const totalRoute = totalRouteKm(waypoints);
  for (const b of all) {
    const direct = haversineKm(
      Number(b.pickup_lat),
      Number(b.pickup_lng),
      Number(b.dropoff_lat),
      Number(b.dropoff_lng)
    );
    const viaRoute = passengerRouteDistanceKm(waypoints, b.id);
    if (direct <= 0) continue;
    const factor = (viaRoute - direct) / direct;
    if (factor > MAX_DETOUR_FACTOR) return { ok: false, waypoints: [] };
  }
  return { ok: true, waypoints };
}

/**
 * Greedy pooling: for each pending booking, try to add to an existing ride; else create new ride.
 * Complexity: O(P * R * W), P=pending, R=rides, W=waypoints.
 */
export function computePooling(
  pendingBookings: BookingRecord[],
  existingRides: RideGroup[],
  cabs: Array<{ id: string; seats: number; luggage_capacity: number }>
): RideGroup[] {
  const rides = existingRides.map((r) => ({
    cabId: r.cabId,
    bookings: [...r.bookings],
    waypoints: [...r.waypoints],
    totalDistanceKm: r.totalDistanceKm,
    seatUsed: r.seatUsed,
    luggageUsed: r.luggageUsed,
  }));
  const cabMap = new Map(cabs.map((c) => [c.id, c]));
  const defaultCab = cabs[0];
  if (!defaultCab) return [];

  for (const booking of pendingBookings) {
    const seats = cabMap.get(defaultCab.id)?.seats ?? DEFAULT_SEATS;
    const luggage = cabMap.get(defaultCab.id)?.luggage_capacity ?? DEFAULT_LUGGAGE;
    let added = false;
    for (const ride of rides) {
      const cab = cabMap.get(ride.cabId) ?? defaultCab;
      const { ok, waypoints } = detourOk(ride.bookings, booking, cab.seats, cab.luggage_capacity);
      if (ok) {
        ride.bookings.push(booking);
        ride.waypoints = waypoints;
        ride.totalDistanceKm = totalRouteKm(waypoints);
        ride.seatUsed += 1;
        ride.luggageUsed += booking.luggage_count || 0;
        added = true;
        break;
      }
    }
    if (!added) {
      const waypoints = buildWaypoints([booking]);
      rides.push({
        cabId: defaultCab.id,
        bookings: [booking],
        waypoints,
        totalDistanceKm: totalRouteKm(waypoints),
        seatUsed: 1,
        luggageUsed: booking.luggage_count || 0,
      });
    }
  }

  return rides.map((r) => ({
    ...r,
    totalDistanceKm: totalRouteKm(r.waypoints),
  }));
}

export { buildWaypoints, totalRouteKm, passengerRouteDistanceKm, detourOk };
