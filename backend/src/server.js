import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './config/db.js';
import { env } from './config/env.js';

import authRoutes from './routes/auth.js';
import experimentRoutes from './routes/experiments.js';
import equipmentRoutes from './routes/equipment.js';
import labRoutes from './routes/labs.js';
import reservationRoutes from './routes/reservations.js';
import datasetRoutes from './routes/datasets.js';
import notificationRoutes from './routes/notifications.js';
import analyticsRoutes from './routes/analytics.js';
import userRoutes from './routes/users.js';
import auditRoutes from './routes/audit.js';

import { notFound, errorHandler } from './middleware/error.js';
import { initSocket } from './utils/socket.js';

const app = express();
const server = http.createServer(app);

app.use(helmet());

const allowedOrigins = new Set([
  env.clientUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
]);

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.has(origin) ||
        env.clientUrl === '*' ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com')
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) =>
  res.json({ ok: true, service: 'researchflow-api', time: new Date().toISOString() })
);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/experiments', experimentRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit', auditRoutes);

// Error middleware
app.use(notFound);
app.use(errorHandler);

// Socket initialization
initSocket(server);

// Start server if not running in test runner
if (process.env.NODE_ENV !== 'test') {
  connectDB()
    .then(() => {
      server.listen(env.port, () => {
        console.log(`ResearchFlow API listening on port ${env.port} (${env.nodeEnv})`);
      });
    })
    .catch((err) => {
      console.error('Database connection failed:', err);
      process.exit(1);
    });
}

export { app, server };
export default app;
