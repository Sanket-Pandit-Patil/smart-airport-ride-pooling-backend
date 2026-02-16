# Concurrency Handling Strategy

## Goals
- Support **10,000 concurrent users** (connection pooling).
- Handle **100 requests per second** (async I/O, no blocking).
- **Latency under 300ms** (indexed queries, minimal lock contention).
- **Real-time cancellations** without corrupting state (optimistic locking).

## Implemented Mechanisms

### 1. Connection pooling (`src/db/pool.ts`)
- Single `pg.Pool` with `max: 20` (configurable via `PG_POOL_SIZE`).
- Requests share connections; no new TCP handshake per request.
- Idle timeout and connection timeout to avoid leaks.

### 2. Ride matching: `FOR UPDATE SKIP LOCKED`
- In `runMatching()`, we run a **transaction** and select PENDING bookings with:
  ```sql
  SELECT ... FROM bookings WHERE status = 'PENDING' ORDER BY created_at ASC FOR UPDATE SKIP LOCKED
  ```
- Only one matcher "sees" each pending row at a time; others skip locked rows and get the rest.
- Prevents double-assignment when multiple `/api/rides/match` calls run concurrently.

### 3. Cancellation: optimistic locking (version)
- Each booking has a `version` column.
- Cancel API requires `version` in the body; update is:
  ```sql
  UPDATE bookings SET status = 'CANCELLED', version = version + 1
  WHERE id = $1 AND status = 'PENDING' AND version = $2
  ```
- If another request already cancelled or matched the booking, `rowCount === 0` and we return 409.
- No pessimistic lock held on read; safe under high concurrency.

### 4. Async I/O
- All DB access is async (`async/await`). No blocking on I/O so the event loop can serve other requests.
- Express handlers are async; errors are caught and returned as 500/409.

### 5. Indexing (see Database schema)
- Indexes on `bookings(status)`, `bookings(ride_id)`, `bookings(created_at)` keep matching and lookups fast.
- Target: all API paths &lt; 300ms under 100 req/s.

## Testing concurrency
- Run multiple concurrent POSTs to `/api/bookings` and POSTs to `/api/rides/match` (see `tests/concurrency.test.ts` or manual load test).
- Run concurrent DELETE (cancel) with same booking and different versions; one succeeds, others get 409.
