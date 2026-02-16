/**
 * Dynamic pricing formula.
 *
 * Formula:
 *   baseFare = directDistanceKm * baseFarePerKm
 *   poolDiscount = 1 - (1 - poolingDiscountFactor) * (sharedPassengers - 1) / max(sharedPassengers, 1)
 *   passengerFare = baseFare * poolDiscount * (1 + detourFactor * detourSurchargeRate)
 *
 * - More passengers in same cab => discount (poolingDiscountFactor).
 * - Detour above 0% adds a small surcharge (fairness).
 */

import { config } from '../config';

const baseFarePerKm = config.baseFarePerKm;
const poolingDiscountFactor = config.poolingDiscountFactor;
const maxDetourFactor = config.maxDetourFactor;

/** Surcharge per 1% detour (e.g. 0.005 = 0.5% extra per 1% detour) */
const DETOUR_SURCHARGE_RATE = 0.005;

/**
 * Compute fare for one passenger in a pooled ride.
 * @param directDistanceKm - Passenger's direct A->B distance
 * @param actualDistanceKm - Passenger's distance in the shared route (>= direct)
 * @param sharedPassengerCount - Number of passengers in the cab
 */
export function computePassengerFare(
  directDistanceKm: number,
  actualDistanceKm: number,
  sharedPassengerCount: number
): number {
  const baseFare = directDistanceKm * baseFarePerKm;
  const poolDiscount =
    sharedPassengerCount <= 1
      ? 1
      : 1 - (1 - poolingDiscountFactor) * ((sharedPassengerCount - 1) / Math.max(sharedPassengerCount, 1));
  const detourFactor =
    directDistanceKm <= 0 ? 0 : Math.min((actualDistanceKm - directDistanceKm) / directDistanceKm, maxDetourFactor);
  const detourSurcharge = 1 + detourFactor * DETOUR_SURCHARGE_RATE * 100;
  const fare = baseFare * poolDiscount * detourSurcharge;
  return Math.round(fare * 100) / 100;
}

/**
 * Total fare for a ride (sum of all passenger fares). Used for display/analytics.
 */
export function computeRideTotalFare(
  passengerDistances: Array<{ directKm: number; actualKm: number }>,
  sharedPassengerCount: number
): number {
  return passengerDistances.reduce(
    (sum, p) => sum + computePassengerFare(p.directKm, p.actualKm, sharedPassengerCount),
    0
  );
}
