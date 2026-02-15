// test/e2e/app.ts
// Express app for E2E testing (without starting server)

import express from 'express';
import cors from 'cors';
import contentRoutes from '../../src/routes/content.routes';
import objectRoutes from '../../src/routes/object.routes';

const createTestApp = () => {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'content-api',
      version: '1.0.0'
    });
  });

  // Routes
  app.use('/api/content', contentRoutes);
  app.use('/api/objects', objectRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  // Error handler
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Test App Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  return app;
};

export default createTestApp;
