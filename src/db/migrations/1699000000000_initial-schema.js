/**
 * Initial database schema for Smart Airport Ride Pooling.
 * Run with: npm run migrate:up
 */

exports.up = (pgm) => {
  pgm.createExtension('uuid-ossp', { ifNotExists: true });

  pgm.createTable('cabs', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    seats: { type: 'integer', notNull: true, default: 4 },
    luggage_capacity: { type: 'integer', notNull: true, default: 4 },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
  });

  pgm.createTable('passengers', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    name: { type: 'varchar(255)', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
  });

  pgm.createTable('rides', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    cab_id: { type: 'uuid', notNull: true, references: 'cabs(id)', onDelete: 'CASCADE' },
    total_distance_km: { type: 'decimal(10,4)' },
    total_fare: { type: 'decimal(12,2)' },
    status: { type: 'varchar(20)', notNull: true, default: 'ACTIVE' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
  });

  pgm.createTable('bookings', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    passenger_id: { type: 'uuid', notNull: true, references: 'passengers(id)', onDelete: 'CASCADE' },
    pickup_lat: { type: 'decimal(10,7)', notNull: true },
    pickup_lng: { type: 'decimal(10,7)', notNull: true },
    dropoff_lat: { type: 'decimal(10,7)', notNull: true },
    dropoff_lng: { type: 'decimal(10,7)', notNull: true },
    luggage_count: { type: 'integer', notNull: true, default: 0 },
    status: { type: 'varchar(20)', notNull: true, default: 'PENDING' },
    ride_id: { type: 'uuid', references: 'rides(id)', onDelete: 'SET NULL' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    version: { type: 'integer', notNull: true, default: 0 },
  });

  pgm.createTable('ride_waypoints', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    ride_id: { type: 'uuid', notNull: true, references: 'rides(id)', onDelete: 'CASCADE' },
    booking_id: { type: 'uuid', notNull: true, references: 'bookings(id)', onDelete: 'CASCADE' },
    sequence: { type: 'integer', notNull: true },
    lat: { type: 'decimal(10,7)', notNull: true },
    lng: { type: 'decimal(10,7)', notNull: true },
    waypoint_type: { type: 'varchar(10)', notNull: true },
  });

  pgm.createIndex('bookings', 'passenger_id');
  pgm.createIndex('bookings', 'status');
  pgm.createIndex('bookings', 'ride_id');
  pgm.createIndex('bookings', 'created_at');
  pgm.createIndex('bookings', ['pickup_lat', 'pickup_lng']);
  pgm.createIndex('rides', 'cab_id');
  pgm.createIndex('rides', 'status');
  pgm.createIndex('ride_waypoints', 'ride_id');
};

exports.down = (pgm) => {
  pgm.dropTable('ride_waypoints');
  pgm.dropTable('bookings');
  pgm.dropTable('rides');
  pgm.dropTable('passengers');
  pgm.dropTable('cabs');
};
