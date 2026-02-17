import cron from 'node-cron';
import { runMatching } from './services/booking-service';

/**
 * Start the cron job to run matching algorithm periodically.
 * Default: every 10 seconds.
 */
export function startMatchingCron() {
  console.log('Starting ride matching cron job...');
  
  // Run every 10 seconds
  cron.schedule('*/10 * * * * *', async () => {
    try {
      const result = await runMatching();
      if (result.ridesCreated > 0 || result.bookingsMatched > 0) {
        console.log(`[Cron] Matched: ${result.bookingsMatched} bookings into ${result.ridesCreated} rides.`);
      }
    } catch (error) {
      console.error('[Cron] Matching failed:', error);
    }
  });
}
