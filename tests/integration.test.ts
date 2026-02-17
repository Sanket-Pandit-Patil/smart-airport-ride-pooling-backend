/**
 * Integration tests for Smart Airport Ride Pooling API.
 * Tests all endpoints and core functionality.
 * Run with: npm test
 */

// When running tests locally with Docker Compose the DB is exposed on host port 5433.
process.env.PG_HOST = process.env.PG_HOST || '127.0.0.1';
process.env.PG_PORT = process.env.PG_PORT || '5433';

// allow longer network/DB startup time
jest.setTimeout(60000);
import request from 'supertest';
import app from '../src/app';
import { getPool } from '../src/db/pool';

const pool = getPool();

describe('Integration - End-to-end API', () => {
  beforeAll(async () => {
    // Wait for DB to be reachable (retry for up to ~30s)
    const maxAttempts = 12;
    let attempt = 0;
    while (attempt < maxAttempts) {
      try {
        // simple query
        await pool.query('SELECT 1');
        break;
      } catch (err) {
        console.error('DB connection attempt failed:', (err as any) && (err as any).message ? (err as any).message : err);
        attempt++;
        // wait 2s
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    if (attempt === maxAttempts) {
      throw new Error('Database not reachable after retries');
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  it('health endpoint returns OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('creates and retrieves a passenger', async () => {
    const create = await request(app).post('/api/passengers').send({ name: 'Integration Test User' });
    expect(create.status).toBe(201);
    expect(create.body.success).toBe(true);
    const id = create.body.data.id;

    const get = await request(app).get(`/api/passengers/${id}`);
    expect(get.status).toBe(200);
    expect(get.body.data.id).toBe(id);
  });

  it('creates a booking and cancels it', async () => {
    // create passenger
    const p = await request(app).post('/api/passengers').send({ name: 'Booking User' });
    const passengerId = p.body.data.id;

    // create booking
    const bookingResp = await request(app)
      .post('/api/bookings')
      .send({
        passengerId,
        pickup: { lat: 28.5355, lng: 77.391 },
        dropoff: { lat: 28.6139, lng: 77.209 },
        luggageCount: 1,
      });
    expect(bookingResp.status).toBe(201);
    const bookingId = bookingResp.body.data.id || bookingResp.body.data.bookingId;
    console.log('Created booking:', JSON.stringify(bookingResp.body));
    console.log('bookingId:', bookingId);

    // get booking
    const getBooking = await request(app).get(`/api/bookings/${bookingId}`);
    expect(getBooking.status).toBe(200);

    // cancel booking
    const cancel = await request(app).delete(`/api/bookings/${bookingId}`).send({ version: getBooking.body.data.version });
    expect(cancel.status).toBe(200);
  });

  it('runs matching endpoint', async () => {
    const res = await request(app).post('/api/rides/match');
    expect([200, 201]).toContain(res.status);
  });
});
