/**
 * Sample test data for local development and evaluation.
 * Run after migrations: npm run seed
 */
import { getPool } from './pool';
import { ensureDefaultCabs } from '../repositories/cab-repository';
import { createPassenger } from '../repositories/passenger-repository';
import { createBooking } from '../repositories/booking-repository';

const pool = getPool();

async function seed() {
  await ensureDefaultCabs();

  const names = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'];
  const passengers: string[] = [];
  for (const name of names) {
    const p = await createPassenger(name);
    passengers.push(p.id);
  }

  // Airport area (example: 28.5355, 77.3910) to various Delhi locations
  const airport = { lat: 28.5355, lng: 77.391 };
  const locations = [
    { lat: 28.6139, lng: 77.209 },   // Connaught Place
    { lat: 28.7041, lng: 77.1025 },  // Gurgaon
    { lat: 28.5355, lng: 77.391 },   // Near airport
    { lat: 28.6519, lng: 77.2315 },  // North Delhi
    { lat: 28.5244, lng: 77.1855 },  // South Delhi
  ];

  for (let i = 0; i < passengers.length; i++) {
    const pickup = airport;
    const dropoff = locations[i % locations.length];
    await createBooking(
      passengers[i],
      pickup.lat,
      pickup.lng,
      dropoff.lat,
      dropoff.lng,
      i % 3
    );
  }

  console.log('Seed complete: %d passengers, %d bookings', passengers.length, passengers.length);
  await pool.end();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
