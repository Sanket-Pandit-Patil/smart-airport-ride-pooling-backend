import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import bookingsRouter from './routes/bookings';
import ridesRouter from './routes/rides';
import passengersRouter from './routes/passengers';
import healthRouter from './routes/health';
import path from 'path';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';

const swaggerPath = path.join(__dirname, 'swagger.json');
const swaggerDocument = fs.existsSync(swaggerPath)
  ? JSON.parse(fs.readFileSync(swaggerPath, 'utf-8'))
  : { openapi: '3.0.0', info: { title: 'Smart Airport Ride Pooling API', version: '1.0.0' }, paths: {} };

const app = express();
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

app.use('/api/bookings', bookingsRouter);
app.use('/api/rides', ridesRouter);
app.use('/api/passengers', passengersRouter);
app.use('/health', healthRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (req, res) => {
  res.json({
    name: 'Smart Airport Ride Pooling API',
    version: '1.0.0',
    docs: '/api-docs',
    health: '/health',
  });
});

export default app;
