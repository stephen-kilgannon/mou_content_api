// src/index.ts

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import morgan from 'morgan';
import contentRoutes from './routes/content.routes';
import logger from './utils/logger';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON bodies

// Morgan middleware for logging HTTP requests
app.use(morgan('combined', { stream: { write: (message: string) => logger.info(message.trim()) } }));

// Routes
app.use('/api/content', contentRoutes);

// Database Connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/contentdb';

mongoose
  .connect(mongoURI)
  .then(() => {
    logger.info('Connected to MongoDB');
    // Start the server after successful DB connection
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    logger.error(`MongoDB connection error: ${error}`);
  });
