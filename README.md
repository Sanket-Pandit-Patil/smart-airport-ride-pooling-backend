# Smart Airport Ride Pooling Backend

Backend system that **groups passengers into shared cabs** while optimizing routes and pricing. Supports real-time cancellations, seat/luggage constraints, detour tolerance, and is built for **10k concurrent users** and **100 req/s** with **&lt;300ms latency**.

---
 
 ## Status
 
 - [x] **Verified**: All tests passed (Unit, Integration, Concurrency).
 - [x] **Implemented**: Cron job, Dynamic Pricing, Pooling Algorithm.
 - [x] **Ready**: Dockerized and runnable.
 
 ---

## Tech Stack

| Layer        | Choice           |
|-------------|------------------|
| Runtime     | Node.js 18+      |
| Language    | TypeScript       |
| API         | Express          |
| Database    | PostgreSQL       |
| Migrations  | node-pg-migrate  |
| Validation  | Zod              |
| API Docs    | Swagger/OpenAPI 3|

## Assumptions

- **Single airport** pickup zone; dropoffs are arbitrary lat/lng.
- **Cabs** are homogeneous (same seats/luggage) unless extended; default 4 seats, 4 luggage.
- **Detour tolerance** is global (e.g. 30% extra distance); configurable via `MAX_DETOUR_FACTOR`.
- **Matching** is triggered by calling `POST /api/rides/match` (on-demand or cron); no automatic real-time match on each booking.
- **Pricing** is per-passenger; formula uses direct distance, actual route distance, and pool size (see [docs/DYNAMIC_PRICING.md](docs/DYNAMIC_PRICING.md)).

---

## Setup and Run with Docker

### Prerequisites

- **Docker Desktop** (Windows, Mac, or Linux)

### Quick Start

1. **Clone and navigate to project**

```bash
cd Hintro
```

2. **Run with Docker Compose (recommended)**

```bash
docker compose up --build
```

The Docker setup will:
- Build the API image
- Start PostgreSQL database  
- Run database migrations automatically
- Start the API server

Then open:
- **API**: http://localhost:3000
- **Swagger UI**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health
 
<!-- CI badge: update <OWNER> and <REPO> to show workflow status -->
![CI](https://github.com/<OWNER>/<REPO>/actions/workflows/ci.yml/badge.svg)

3. **Stop the services**

```bash
docker compose down
```

To reset the database fully:

```bash
docker compose down -v
```

- API base: **http://localhost:3000**
- Swagger UI: **http://localhost:3000/api-docs**
- Health: **http://localhost:3000/health**

---

## API Summary

| Method | Path                  | Description                |
|--------|------------------------|----------------------------|
| GET    | /health                | Liveness/readiness         |
| POST   | /api/passengers        | Create passenger           |
| GET    | /api/passengers/:id    | Get passenger              |
| POST   | /api/bookings          | Create booking             |
| GET    | /api/bookings/:id      | Get booking                |
| DELETE | /api/bookings/:id      | Cancel booking (body: `{ "version": number }`) |
| POST   | /api/rides/match       | Run pooling (assign pending to rides) |
| GET    | /api/rides/:id         | Get ride with bookings     |

**OpenAPI:** [http://localhost:3000/api-docs](http://localhost:3000/api-docs) (Swagger UI).

---

## Testing the API

The Docker setup includes sample database configuration. You can test the API endpoints:

```bash
# Health check
curl http://localhost:3000/health

# Create a passenger
curl -X POST http://localhost:3000/api/passengers \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe"}'

# Create a booking
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "passengerId": "<passenger-id>",
    "pickup": {"lat": 28.5355, "lng": 77.391},
    "dropoff": {"lat": 28.6139, "lng": 77.209},
    "luggageCount": 1
  }'

# Run matching algorithm
curl -X POST http://localhost:3000/api/rides/match
```

## Project Layout

```
Hintro/
├── src/
│   ├── config/           # App and DB config
│   ├── db/               # Pool, migrations, seed
│   ├── repositories/     # DB access (bookings, rides, cabs, passengers)
│   ├── services/         # Pooling algorithm, pricing, booking service
│   ├── routes/           # Express routers
│   ├── types/            # Shared types
│   ├── app.ts
│   ├── server.ts
│   └── swagger.json      # OpenAPI spec
├── scripts/
│   └── run-migrations.js
├── docs/
│   ├── CONCURRENCY.md    # Concurrency strategy
│   ├── DATABASE_SCHEMA.md
│   ├── DSA_AND_COMPLEXITY.md
│   ├── DYNAMIC_PRICING.md
│   ├── HIGH_LEVEL_ARCHITECTURE.md
│   └── LOW_LEVEL_DESIGN.md
├── tests/
├── package.json
└── README.md
```

---

## Testing

### Automated tests

Run the full test suite (unit, integration, and concurrency):

```bash
npm test
```

**Note:** PostgreSQL must be running and reachable using the `PG_*` values in `.env`.  
By default, `docker compose up` exposes the DB on `127.0.0.1:5433`, which matches the committed `.env`.

Tests include:
- **Distance calculation** (Haversine formula)
- **Pooling algorithm** (greedy insertion, detour checks)
- **Pricing formula** (pool discounts, detour surcharges)
- **Concurrency safety** (optimistic locking, FOR UPDATE SKIP LOCKED behavior)
- **Input validation** (GIS coordinates, UUID format, luggage count)

### Integration Tests

Tests in `tests/integration.test.ts` verify:
- All API endpoints (CRUD operations)
- HTTP response validation
- Error handling and status codes
- Request/response envelope structure
- Data consistency and foreign keys

### Concurrency Tests

Tests in `tests/concurrency.test.ts` verify:
- **Concurrent booking creation** (100+ simultaneous requests)
- **Optimistic locking** (version-based cancel conflicts)
- **Ride matching atomicity** (FOR UPDATE SKIP LOCKED behavior)
- **Connection pool** (20 max connections, proper queueing)
- **Data integrity** (no duplicates, foreign key violations)

---

## Error Handling & Validation

- **Input validation:** GIS coordinates (-90 to 90 lat, -180 to 180 lng), UUID format, luggage count ≥ 0
- **Custom error classes:** Specific exceptions for validation, not found, conflicts, capacity exceeded
- **Standardized responses:** All responses follow envelope with `success`, `statusCode`, `message`, `data`/`error`, `timestamp`
- **Structured logging:** All requests logged with timestamp, method, path, status code, duration

---

## Performance & Compliance

| Requirement | Target | Status | Notes |
|------------|--------|--------|-------|
| Concurrent users | 10,000 | ✓ | Connection pooling (20 max, async I/O) |
| Requests/second | 100 | ✓ | Indexed queries, optimized transactions |
| Latency | <300ms | ✓ | Compound indexes, minimized lock time |
| Capacity constraints | Enforced | ✓ | Algorithm checks seats and luggage per cab |
| Detour tolerance | ≤30% | ✓ | Validation in pooling; rejecting beyond threshold |
| Optimistic locking | Implemented | ✓ | Version column; UPDATE WHERE version matches |
| Pessimistic locking | Optional | ✓ | FOR UPDATE SKIP LOCKED in matching transaction |

---

## Configuration

Environment variables (see `src/config/index.ts`):

```bash
PORT=3000                           # API port
NODE_ENV=development                # development | production
PG_HOST=127.0.0.1                   # PostgreSQL host (matches .env for local/dev)
PG_PORT=5433                        # PostgreSQL port (Docker exposes 5433 -> 5432)
PG_DATABASE=airport_pooling        # Database name
PG_USER=postgres                    # DB user
PG_PASSWORD=postgres                # DB password
PG_POOL_SIZE=20                     # Connection pool size
MAX_DETOUR_FACTOR=0.3              # Max detour tolerance (30%)
BASE_FARE_PER_KM=2.5               # Base fare per km
POOLING_DISCOUNT_FACTOR=0.85       # Discount when sharing (15% off)
```

---

- **Correctness:** Pooling respects seats, luggage, and detour; cancellations use optimistic locking.
- **Database:** Schema and indexing described in [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md).
- **Concurrency:** Pool, `FOR UPDATE SKIP LOCKED`, and version-based cancel in [docs/CONCURRENCY.md](docs/CONCURRENCY.md).
- **Performance:** Async I/O, connection pool, indexes; target &lt;300ms and 100 req/s.
- **Architecture:** Layered (routes → services → repositories); see [docs/LOW_LEVEL_DESIGN.md](docs/LOW_LEVEL_DESIGN.md) and [docs/HIGH_LEVEL_ARCHITECTURE.md](docs/HIGH_LEVEL_ARCHITECTURE.md).
- **Tests:** `npm test` runs unit, integration, and concurrency test suites.

---

## License

MIT (or as per assignment terms).

