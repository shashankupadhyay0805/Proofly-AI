import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import tutorRoutes from './routes/tutorRoutes.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan('dev'));

  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use('/api', tutorRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

