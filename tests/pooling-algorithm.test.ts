/**
 * Unit tests for pooling algorithm and pricing.
 * Run: npm test
 */
import {
  buildWaypoints,
  totalRouteKm,
  passengerRouteDistanceKm,
  detourOk,
  computePooling,
} from '../src/services/pooling-algorithm';
import { computePassengerFare } from '../src/services/pricing';
import { haversineKm } from '../src/services/geo';

describe('geo', () => {
  it('haversineKm returns positive distance', () => {
    const d = haversineKm(28.5355, 77.391, 28.6139, 77.209);
    expect(d).toBeGreaterThan(0);
    expect(d).toBeLessThan(50);
  });
});

describe('pooling algorithm', () => {
  const mockBooking = (
    id: string,
    pickup: [number, number],
    dropoff: [number, number],
    luggage = 0
  ) =>
    ({
      id,
      passenger_id: 'p1',
      pickup_lat: pickup[0],
      pickup_lng: pickup[1],
      dropoff_lat: dropoff[0],
      dropoff_lng: dropoff[1],
      luggage_count: luggage,
      status: 'PENDING',
      ride_id: null,
      version: 0,
    }) as any;

  it('buildWaypoints orders pickups and dropoffs', () => {
    const b = mockBooking('b1', [28.5, 77.3], [28.6, 77.2]);
    const waypoints = buildWaypoints([b]);
    expect(waypoints).toHaveLength(2);
    expect(waypoints[0].type).toBe('PICKUP');
    expect(waypoints[1].type).toBe('DROPOFF');
  });

  it('totalRouteKm is sum of segments', () => {
    const b = mockBooking('b1', [28.5, 77.3], [28.6, 77.2]);
    const waypoints = buildWaypoints([b]);
    const total = totalRouteKm(waypoints);
    expect(total).toBeGreaterThan(0);
  });

  it('passengerRouteDistanceKm equals total for single booking', () => {
    const b = mockBooking('b1', [28.5, 77.3], [28.6, 77.2]);
    const waypoints = buildWaypoints([b]);
    const passengerDist = passengerRouteDistanceKm(waypoints, 'b1');
    const total = totalRouteKm(waypoints);
    expect(passengerDist).toBeCloseTo(total, 5);
  });

  it('detourOk rejects when capacity exceeded', () => {
    const b1 = mockBooking('b1', [28.5, 77.3], [28.6, 77.2]);
    const b2 = mockBooking('b2', [28.51, 77.31], [28.61, 77.21]);
    const { ok } = detourOk([b1], b2, 1, 4);
    expect(ok).toBe(false);
  });

  it('computePooling returns one group per booking when no sharing possible', () => {
    const b1 = mockBooking('b1', [0, 0], [1, 1]);
    const cabs = [{ id: 'c1', seats: 4, luggage_capacity: 4 }];
    const groups = computePooling([b1], [], cabs);
    expect(groups).toHaveLength(1);
    expect(groups[0].bookings).toHaveLength(1);
  });
});

describe('pricing', () => {
  it('computePassengerFare increases with distance', () => {
    const f1 = computePassengerFare(5, 5, 1);
    const f2 = computePassengerFare(10, 10, 1);
    expect(f2).toBeGreaterThan(f1);
  });

  it('computePassengerFare gives discount for shared ride', () => {
    const solo = computePassengerFare(10, 10, 1);
    const shared = computePassengerFare(10, 10, 3);
    expect(shared).toBeLessThan(solo);
  });
});
