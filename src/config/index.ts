/**
 * Application configuration. In production use env vars (e.g. dotenv).
 */
export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432', 10),
    database: process.env.PG_DATABASE || 'airport_pooling',
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'postgres',
    maxPoolSize: parseInt(process.env.PG_POOL_SIZE || '20', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },

  /** Max detour as fraction of direct distance (e.g. 0.3 = 30% extra) */
  maxDetourFactor: parseFloat(process.env.MAX_DETOUR_FACTOR || '0.3'),
  /** Base fare per km (currency units) */
  baseFarePerKm: parseFloat(process.env.BASE_FARE_PER_KM || '2.5'),
  /** Pooling discount factor (e.g. 0.8 = 20% off when pooled) */
  poolingDiscountFactor: parseFloat(process.env.POOLING_DISCOUNT_FACTOR || '0.85'),
  /** Cab default seats */
  defaultCabSeats: 4,
  /** Cab default luggage capacity */
  defaultCabLuggage: 4,
};

export type Config = typeof config;
