# Dynamic Pricing Formula

## Design Goals

- **Transparent:** Fare depends on direct distance, actual (shared) distance, and number of co-riders.
- **Incentive to pool:** Discount when sharing the cab.
- **Fair detour:** Small surcharge when the passenger’s actual route is longer than direct (within tolerance).

## Formula

**Per-passenger fare:**

```
baseFare           = directDistanceKm × baseFarePerKm
poolDiscount       = 1 - (1 - poolingDiscountFactor) × (sharedPassengerCount - 1) / max(sharedPassengerCount, 1)
detourFactor       = min((actualDistanceKm - directDistanceKm) / directDistanceKm, maxDetourFactor)
detourSurcharge    = 1 + detourFactor × DETOUR_SURCHARGE_RATE × 100
passengerFare      = baseFare × poolDiscount × detourSurcharge
```

**Parameters (config / env):**

| Parameter | Default | Meaning |
|-----------|--------|--------|
| baseFarePerKm | 2.5 | Base rate per km (currency per km) |
| poolingDiscountFactor | 0.85 | Discount factor when sharing (e.g. 0.85 ⇒ 15% off as more people share) |
| maxDetourFactor | 0.3 | Max allowed detour (30%); fare uses min(actual detour, this) |
| DETOUR_SURCHARGE_RATE | 0.005 | Extra 0.5% per 1% detour (e.g. 10% detour ⇒ 1.05 multiplier) |

**Ride total fare** = sum of all passenger fares in that ride.

## Examples (conceptual)

- **Solo, 10 km direct, no detour:**  
  baseFare = 25, poolDiscount = 1, detourSurcharge = 1 ⇒ **25**.

- **3 passengers, same 10 km direct, no detour:**  
  poolDiscount = 1 - 0.15 × (2/3) ≈ 0.9 ⇒ each pays 25 × 0.9 = **22.5**.

- **Solo, 10 km direct, 20% detour:**  
  detourSurcharge = 1 + 0.2 × 0.5 = 1.1 ⇒ **27.5**.

## Implementation

- **File:** `src/services/pricing.ts`
- **Function:** `computePassengerFare(directDistanceKm, actualDistanceKm, sharedPassengerCount)`
- **Ride total:** `computeRideTotalFare(passengerDistances[], sharedPassengerCount)` (sum of per-passenger fares).

Fare is rounded to 2 decimal places.
