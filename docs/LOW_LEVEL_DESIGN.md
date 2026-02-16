# Low Level Design (Class Diagram and Patterns)

## Module Overview

```
routes/          → HTTP handlers, validation (Zod)
services/        → Business logic (booking, pooling, pricing, geo)
repositories/    → DB access (CRUD)
db/              → Pool, migrations
config/          → Env-based config
types/           → Shared interfaces
```

## Class / Module Diagram (ASCII)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ROUTES (Express Routers)                                                 │
│  BookingsRouter  RidesRouter  PassengersRouter  HealthRouter               │
│  - POST/GET/DELETE bookings   - POST /rides/match, GET /rides/:id          │
│  - Validate body with Zod     - No body for match                          │
└─────────────────────────────┬────────────────────────────────────────────┘
                              │ calls
┌─────────────────────────────▼────────────────────────────────────────────┐
│  BOOKING SERVICE (orchestration)                                          │
│  - createBooking(passengerId, pickup, dropoff, luggageCount)              │
│  - cancelBooking(bookingId, version)                                      │
│  - runMatching() → transaction + PoolingAlgorithm + persist                │
│  - getBooking(id), getRide(id)                                            │
└──┬───────────────────────────────────────────────────────────────────┬───┘
   │ uses                                                               │ uses
   ▼                                                                     ▼
┌─────────────────────────────┐    ┌─────────────────────────────────────────┐
│  REPOSITORIES               │    │  POOLING ALGORITHM (pure functions)      │
│  BookingRepository          │    │  - computePooling(pending, rides, cabs) │
│  RideRepository             │    │  - buildWaypoints(bookings)             │
│  CabRepository              │    │  - detourOk(bookings, newBooking, ...)  │
│  PassengerRepository        │    │  - totalRouteKm, passengerRouteDistanceKm│
└─────────────────────────────┘    └─────────────────────────────────────────┘
   │                                                                     │
   │ uses                                                               │ uses
   ▼                                                                     ▼
┌─────────────────────────────┐    ┌─────────────────────────────────────────┐
│  DB POOL (singleton)        │    │  GEO          │  PRICING                 │
│  getPool() → pg.Pool        │    │  haversineKm  │  computePassengerFare     │
└─────────────────────────────┘    │  routeDistanceKm                         │
                                   └─────────────────────────────────────────┘
```

## Design Patterns Used

| Pattern | Where | Purpose |
|--------|--------|---------|
| **Repository** | repositories/* | Abstract DB access; services don’t see SQL. |
| **Singleton** | db/pool.ts | Single connection pool for the process. |
| **Dependency injection (manual)** | services import repos | Testability; can swap repos in tests. |
| **Transaction script** | runMatching() | One use case = one transaction (BEGIN, lock, algorithm, INSERT/UPDATE, COMMIT). |
| **Optimistic locking** | cancelBooking(id, version) | Version column; UPDATE WHERE version = $2 to avoid lost updates. |
| **Pessimistic locking** | runMatching() | FOR UPDATE SKIP LOCKED on PENDING bookings so concurrent matchers don’t double-assign. |

## Key Types (TypeScript)

- **BookingRecord** – id, passenger_id, pickup/dropoff lat/lng, luggage_count, status, ride_id, version.
- **RideRecord** – id, cab_id, total_distance_km, total_fare, status.
- **RideGroup** – cabId, bookings[], waypoints[], totalDistanceKm, seatUsed, luggageUsed (output of pooling).
- **Waypoint** – lat, lng, bookingId, type (PICKUP|DROPOFF), sequence.

No ORM; repositories use `pg` with parameterized queries. Validation at API boundary (Zod) and business rules in services (e.g. detour check in pooling algorithm).
