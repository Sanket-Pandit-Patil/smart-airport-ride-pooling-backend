# Smart Airport Ride Pooling Backend

Backend system that **groups passengers into shared cabs** while optimizing routes and pricing. Supports real-time cancellations, seat/luggage constraints, detour tolerance, and is built for **10k concurrent users** and **100 req/s** with **&lt;300ms latency**.

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

## Setup and Run (Local)

### Prerequisites

- **Node.js** 18+
- **PostgreSQL** 14+ (running locally or Docker)

### Option A: Run with Docker (recommended for quick setup)

Prerequisite: Docker Desktop (Windows).

```bash
docker compose up --build
```

Then open:
- Swagger UI: `http://localhost:3000/api-docs`
- Health: `http://localhost:3000/health`

To stop:

```bash
docker compose down
```

If you want to reset the DB fully:

```bash
docker compose down -v
```

### 1. Clone and install

```bash
cd Hintro
npm install
```

### 2. Database

Create a database and set env (or use `.env` from `.env.example`):

```bash
# Windows (PowerShell)
$env:PG_HOST="localhost"
$env:PG_PORT="5432"
$env:PG_DATABASE="airport_pooling"
$env:PG_USER="postgres"
$env:PG_PASSWORD="postgres"

# Create DB (psql or pgAdmin)
createdb airport_pooling
```

### 3. Run migrations

```bash
npm run migrate:up
```

### 4. Seed sample data (optional)

```bash
npm run seed
```

### 5. Start server

```bash
npm run dev
# or
npm run build && npm start
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

## Sample Test Data / Quick Test

After `npm run seed` you have 10 passengers and 10 PENDING bookings. Example flow:

```bash
# 1) Run matching
curl -X POST http://localhost:3000/api/rides/match

# 2) List rides (use an id from DB or from a booking)
curl http://localhost:3000/api/bookings/<booking-id>
# then
curl http://localhost:3000/api/rides/<ride-id>

# 3) Cancel a booking (use version from GET booking)
curl -X DELETE http://localhost:3000/api/bookings/<booking-id> -H "Content-Type: application/json" -d "{\"version\": 0}"
```

Sample request bodies:

**Create passenger**
```json
{ "name": "Alice" }
```

**Create booking**
```json
{
  "passengerId": "<passenger-uuid>",
  "pickup":  { "lat": 28.5355, "lng": 77.391 },
  "dropoff": { "lat": 28.6139, "lng": 77.209 },
  "luggageCount": 1
}
```

**Cancel booking**
```json
{ "version": 0 }
```

---

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

## Evaluation Notes

- **Correctness:** Pooling respects seats, luggage, and detour; cancellations use optimistic locking.
- **Database:** Schema and indexing described in [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md).
- **Concurrency:** Pool, `FOR UPDATE SKIP LOCKED`, and version-based cancel in [docs/CONCURRENCY.md](docs/CONCURRENCY.md).
- **Performance:** Async I/O, connection pool, indexes; target &lt;300ms and 100 req/s.
- **Architecture:** Layered (routes → services → repositories); see [docs/LOW_LEVEL_DESIGN.md](docs/LOW_LEVEL_DESIGN.md) and [docs/HIGH_LEVEL_ARCHITECTURE.md](docs/HIGH_LEVEL_ARCHITECTURE.md).
- **Tests:** `npm test` runs unit tests for algorithm and pricing.

---

## License

MIT (or as per assignment terms).
