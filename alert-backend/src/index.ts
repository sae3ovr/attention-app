import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import incidentRoutes from './routes/incidents';
import familyRoutes from './routes/family';
import chainRoutes from './routes/chains';
import trackingRoutes from './routes/tracking';
import sosRoutes from './routes/sos';
import cameraRoutes from './routes/cameras';

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:8081,http://localhost:8080').split(',');

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok', version: '1.0.0' }));

app.use('/auth', authRoutes);
app.use('/incidents', incidentRoutes);
app.use('/family', familyRoutes);
app.use('/chains', chainRoutes);
app.use('/tracked-items', trackingRoutes);
app.use('/sos', sosRoutes);
app.use('/cameras', cameraRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS not allowed' });
  }
  const status = (err as any).status || 500;
  res.status(status).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Alert.io API running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
