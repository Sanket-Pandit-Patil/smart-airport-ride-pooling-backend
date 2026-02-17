const autocannon = require('autocannon');

console.log('Starting autocannon load test: 60s with 100 connections against http://localhost:3000');

const instance = autocannon({
  url: 'http://localhost:3000',
  connections: 100,
  duration: 60,
  timeout: 20,
  requests: [
    { method: 'GET', path: '/health' },
    { method: 'POST', path: '/api/passengers', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'lt-' + Math.floor(Math.random() * 1000000) }) },
    { method: 'POST', path: '/api/bookings', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ passengerId: '00000000-0000-0000-0000-000000000000', pickup: { lat: 28.5355, lng: 77.391 }, dropoff: { lat: 28.6139, lng: 77.209 }, luggageCount: 0 }) }
  ]
});

autocannon.track(instance, { renderProgressBar: true });

instance.on('done', () => {
  console.log('Load test finished');
});
