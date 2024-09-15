import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import contentRoutes from './routes/content.routes';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON bodies

// Routes
app.use('/api/content', contentRoutes);

// Database Connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/contentdb';

mongoose
  .connect(mongoURI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Start the server after successful DB connection
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });
