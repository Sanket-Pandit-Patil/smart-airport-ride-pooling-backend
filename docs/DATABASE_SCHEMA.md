# Database Schema and Indexing Strategy

## ER Overview

- **passengers** – user making a booking
- **bookings** – one trip request (pickup, dropoff, luggage, status, optional ride_id)
- **cabs** – vehicle (seats, luggage_capacity)
- **rides** – one cab trip; aggregates multiple bookings
- **ride_waypoints** – ordered pickup/dropoff points for a ride

## Tables

### passengers
| Column     | Type         | Notes        |
|-----------|--------------|-------------|
| id        | UUID PK      | default uuid_generate_v4() |
| name      | VARCHAR(255) | NOT NULL     |
| created_at| TIMESTAMPTZ  | default now() |

### cabs
| Column          | Type        | Notes        |
|-----------------|------------|-------------|
| id              | UUID PK    | default uuid_generate_v4() |
| seats           | INTEGER    | NOT NULL, default 4 |
| luggage_capacity| INTEGER    | NOT NULL, default 4 |
| created_at      | TIMESTAMPTZ| default now() |

### rides
| Column           | Type         | Notes        |
|------------------|-------------|-------------|
| id               | UUID PK     | default uuid_generate_v4() |
| cab_id           | UUID FK→cabs| NOT NULL     |
| total_distance_km| DECIMAL(10,4) | nullable   |
| total_fare       | DECIMAL(12,2) | nullable   |
| status           | VARCHAR(20) | ACTIVE, COMPLETED, CANCELLED |
| created_at       | TIMESTAMPTZ | default now() |
| updated_at       | TIMESTAMPTZ | default now() |

### bookings
| Column       | Type         | Notes        |
|-------------|--------------|-------------|
| id          | UUID PK      | default uuid_generate_v4() |
| passenger_id| UUID FK→passengers | NOT NULL |
| pickup_lat  | DECIMAL(10,7) | NOT NULL  |
| pickup_lng  | DECIMAL(10,7) | NOT NULL  |
| dropoff_lat | DECIMAL(10,7) | NOT NULL  |
| dropoff_lng | DECIMAL(10,7) | NOT NULL  |
| luggage_count | INTEGER   | NOT NULL, default 0 |
| status      | VARCHAR(20) | PENDING, MATCHED, CANCELLED, COMPLETED |
| ride_id     | UUID FK→rides | nullable (set when MATCHED) |
| created_at  | TIMESTAMPTZ | default now() |
| updated_at  | TIMESTAMPTZ | default now() |
| version     | INTEGER     | NOT NULL, default 0 (optimistic lock) |

### ride_waypoints
| Column       | Type        | Notes        |
|-------------|-------------|-------------|
| id          | UUID PK     | default uuid_generate_v4() |
| ride_id     | UUID FK→rides| NOT NULL     |
| booking_id  | UUID FK→bookings | NOT NULL |
| sequence    | INTEGER     | NOT NULL (order in route) |
| lat, lng    | DECIMAL(10,7) | NOT NULL  |
| waypoint_type | VARCHAR(10) | PICKUP, DROPOFF |

## Indexing Strategy

| Table           | Index | Purpose |
|-----------------|-------|--------|
| bookings        | (passenger_id) | Lookup by passenger |
| bookings        | (status) | Match job: `WHERE status = 'PENDING'` |
| bookings        | (ride_id) | List bookings per ride |
| bookings        | (created_at) | FIFO ordering for matching |
| bookings        | (pickup_lat, pickup_lng) | Optional geo queries |
| rides           | (cab_id) | Cab’s rides |
| rides           | (status) | Filter ACTIVE rides |
| ride_waypoints  | (ride_id) | Waypoints for a ride |

Matching path: `bookings` filtered by `status = 'PENDING'` and ordered by `created_at` uses the status and created_at indexes; `FOR UPDATE SKIP LOCKED` minimizes lock contention.

## Migrations

- Location: `src/db/migrations/`
- Up: `npm run migrate:up` (uses `scripts/run-migrations.js` and PG_* env)
- Down: `node node_modules/node-pg-migrate/bin/node-pg-migrate down` (with DATABASE_URL set)
