/**
 * Sample test data for local development and evaluation.
 * Run after migrations: npm run seed
 * 
 * Generates:
 * - 20 passengers with realistic names
 * - 50 bookings with various luggage counts
 * - Clustered routes (airport to city zones)
 * - Scenarios to test pooling, detour constraints, and pricing
 */
import { getPool } from './pool';
import { ensureDefaultCabs } from '../repositories/cab-repository';
import { createPassenger } from '../repositories/passenger-repository';
import { createBooking } from '../repositories/booking-repository';

const pool = getPool();

async function seed() {
  await ensureDefaultCabs();

  // Realistic passenger names
  const names = [
    'Alice Johnson', 'Bob Smith', 'Carol Davis', 'Dave Wilson', 'Eve Martinez',
    'Frank Thomas', 'Grace Lee', 'Henry Brown', 'Ivy Garcia', 'Jack Robinson',
    'Karen White', 'Leo Anderson', 'Maria Lopez', 'Nathan Taylor', 'Olivia Jones',
    'Paul Jackson', 'Quinn Martin', 'Rachel Harris', 'Sam Thompson', 'Tina Moore',
  ];

  const passengers: string[] = [];
  console.log('Creating passengers...');
  for (const name of names) {
    const p = await createPassenger(name);
    passengers.push(p.id);
  }
  console.log(`✓ Created ${passengers.length} passengers`);

  // Airport location (Delhi Indira Gandhi International)
  const airport = { lat: 28.5355, lng: 77.391 };

  // Target zones (realistic Delhi destinations)
  const zones = [
    { name: 'Connaught Place (CP)', lat: 28.6139, lng: 77.209 },       // Central Delhi
    { name: 'Gurgaon (South)', lat: 28.4089, lng: 77.0585 },            // South
    { name: 'Noida', lat: 28.5921, lng: 77.2064 },                      // East
    { name: 'Dwarka', lat: 28.5921, lng: 77.045 },                      // West
    { name: 'North Delhi', lat: 28.7041, lng: 77.1025 },                // North
    { name: 'South Delhi', lat: 28.5244, lng: 77.1855 },                // South Delhi
    { name: 'Chikhalwadi', lat: 28.45, lng: 77.35 },                    // Central SE
  ];

  // Test scenarios for various pooling situations
  const testScenarios = [
    // Scenario 1: Close bookings (should pool together easily)
    {
      count: 5,
      luggage: [0, 1, 1, 2, 0],
      zones: [zones[0], zones[0], zones[0], zones[0], zones[0]], // All to Connaught Place
      description: 'Close bookings (should pool)',
    },
    // Scenario 2: Medium distance bookings
    {
      count: 4,
      luggage: [1, 1, 2, 1],
      zones: [zones[1], zones[1], zones[1], zones[1]], // All to Gurgaon
      description: 'Medium distance bookings',
    },
    // Scenario 3: Far bookings (may not pool due to detour)
    {
      count: 3,
      luggage: [2, 2, 1],
      zones: [zones[2], zones[3], zones[4]], // Different zones
      description: 'Far destinations (detour constraints)',
    },
    // Scenario 4: High luggage (capacity constraints)
    {
      count: 4,
      luggage: [3, 3, 2, 2],
      zones: [zones[0], zones[0], zones[0], zones[1]], // Some pooling
      description: 'High luggage (capacity test)',
    },
    // Scenario 5: Mixed (realistic distribution)
    {
      count: 15,
      luggage: [0, 1, 1, 2, 0, 1, 2, 1, 3, 0, 1, 1, 2, 1, 0],
      zones: Array.from({ length: 15 }, (_, i) => zones[i % zones.length]),
      description: 'Mixed bookings (realistic)',
    },
    // Scenario 6: Large luggage (1-2 passengers per cab)
    {
      count: 4,
      luggage: [4, 4, 4, 3],
      zones: [zones[0], zones[0], zones[1], zones[1]],
      description: 'Max luggage (limited pooling)',
    },
    // Scenario 7: Solo travelers
    {
      count: 5,
      luggage: [0, 0, 0, 0, 0],
      zones: [zones[0], zones[1], zones[2], zones[3], zones[4]],
      description: 'Solo travelers',
    },
  ];

  console.log('\nCreating bookings...');
  let bookingCount = 0;
  let passengerIdx = 0;

  for (const scenario of testScenarios) {
    console.log(`  Scenario: ${scenario.description}`);
    for (let i = 0; i < scenario.count; i++) {
      const passenger = passengers[passengerIdx % passengers.length];
      passengerIdx++;

      const dropoff = scenario.zones[i];
      const luggage = scenario.luggage[i];

      await createBooking(
        passenger,
        airport.lat,
        airport.lng,
        dropoff.lat,
        dropoff.lng,
        luggage
      );
      bookingCount++;

      // Add slight random variation to coordinates to simulate real data
      // (but keep them clustered by zone)
      if (i < scenario.count - 1) {
        const variation = 0.001 * (Math.random() - 0.5);
        scenario.zones[i] = {
          name: dropoff.name,
          lat: dropoff.lat + variation,
          lng: dropoff.lng + variation,
        };
      }
    }
  }

  console.log(`✓ Created ${bookingCount} bookings\n`);

  // Summary statistics
  console.log('Seed Summary:');
  console.log(`  Passengers: ${passengers.length}`);
  console.log(`  Bookings: ${bookingCount}`);
  console.log(`  Zones: ${zones.length}`);
  console.log(`  All bookings are PENDING (ready for matching)\n`);
  console.log('Next steps:');
  console.log('  1. Run: npm run dev');
  console.log('  2. Open: http://localhost:3000/api-docs');
  console.log('  3. Try: POST /api/rides/match\n');

  await pool.end();
}

seed().catch((e) => {
  console.error('Seed error:', e);
  process.exit(1);
});
