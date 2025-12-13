// src/index.ts

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import contentRoutes from './routes/content.routes';
import objectRoutes from './routes/object.routes';
import logger from './utils/logger';
import database from './utils/database';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
// Increase the limit for JSON payloads
app.use(express.json({ limit: '50mb' }));
// Increase the limit for URL-encoded payloads
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Morgan middleware for logging HTTP requests
app.use(morgan('combined', { stream: { write: (message: string) => logger.info(message.trim()) } }));

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

// Database Connection and Server Start
const startServer = async () => {
  try {
    // Connect to PostgreSQL
    await database.connect();

    // Initialize database tables
    await database.initializeTables();

    // Start the server after successful DB connection
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
    });
  } catch (error) {
    logger.error(`Database connection error: ${error}`);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await database.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await database.close();
  process.exit(0);
});

startServer();
