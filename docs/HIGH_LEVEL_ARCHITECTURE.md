# High Level Architecture

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                     CLIENTS (Apps / Web)                 │
                    └─────────────────────────────┬───────────────────────────┘
                                                  │ HTTP/REST
                    ┌─────────────────────────────▼───────────────────────────┐
                    │                    API LAYER (Express)                    │
                    │  /api/bookings  /api/rides  /api/passengers  /health     │
                    │  Swagger UI at /api-docs                                  │
                    └─────────────────────────────┬───────────────────────────┘
                                                  │
                    ┌─────────────────────────────▼───────────────────────────┐
                    │                  SERVICE LAYER                          │
                    │  • BookingService (create, cancel, runMatching, get)     │
                    │  • PoolingAlgorithm (computePooling, detour, waypoints)  │
                    │  • Pricing (computePassengerFare)                        │
                    │  • Geo (haversine, route distance)                       │
                    └─────────────────────────────┬───────────────────────────┘
                                                  │
                    ┌─────────────────────────────▼───────────────────────────┐
                    │                REPOSITORY LAYER                          │
                    │  BookingRepository, RideRepository, CabRepository,       │
                    │  PassengerRepository                                     │
                    └─────────────────────────────┬───────────────────────────┘
                                                  │
                    ┌─────────────────────────────▼───────────────────────────┐
                    │           CONNECTION POOL (pg.Pool)                      │
                    │           Max connections: PG_POOL_SIZE (e.g. 20)         │
                    └─────────────────────────────┬───────────────────────────┘
                                                  │
                    ┌─────────────────────────────▼───────────────────────────┐
                    │                 PostgreSQL                              │
                    │  passengers | bookings | rides | cabs | ride_waypoints  │
                    └─────────────────────────────────────────────────────────┘
```

## Flow Summary

1. **Create booking:** Client → POST /api/bookings → BookingService.createBooking → BookingRepository.insert → DB. Status = PENDING.
2. **Match rides:** Client or cron → POST /api/rides/match → BookingService.runMatching → transaction: lock PENDING rows (FOR UPDATE SKIP LOCKED), run PoolingAlgorithm, create rides and waypoints, update bookings to MATCHED.
3. **Cancel:** Client → DELETE /api/bookings/:id (body: version) → BookingService.cancelBooking → optimistic UPDATE by id and version; 409 if already matched/cancelled.
4. **Get ride:** GET /api/rides/:id → BookingService.getRide → RideRepository + BookingRepository.

## Concurrency and Scale

- **10k users / 100 req/s:** Handled by connection pool (async I/O, no blocking), indexed queries, and short transactions.
- **Matching concurrency:** Single transaction per run; FOR UPDATE SKIP LOCKED so multiple match calls don’t double-assign the same booking.
- **Cancellation concurrency:** Optimistic locking (version) so concurrent cancels are safe.

## Deployment (conceptual)

- **Single node:** One process, one pool, one DB. Sufficient for 100 req/s and &lt;300ms if DB and indexes are tuned.
- **Multi-node:** Stateless API; DB is single source of truth. Match endpoint can be called by one worker or with a distributed lock to avoid duplicate match runs; FOR UPDATE SKIP LOCKED still prevents double-assignment at DB level.
