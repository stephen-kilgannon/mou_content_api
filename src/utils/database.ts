// src/utils/database.ts

import { Pool, PoolClient } from 'pg';
import logger from './logger';

class Database {
    private pool: Pool;

    constructor() {
        this.pool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'contentdb',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'password',
            max: 20, // Maximum number of connections
            idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
            connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection could not be established
        });

        // Handle pool errors
        this.pool.on('error', (err) => {
            logger.error('Unexpected error on idle client', err);
            process.exit(-1);
        });
    }

    async connect(): Promise<void> {
        try {
            const client = await this.pool.connect();
            logger.info('Connected to PostgreSQL database');
            client.release();
        } catch (error) {
            logger.error('Failed to connect to PostgreSQL database:', error);
            throw error;
        }
    }

    async query(text: string, params?: any[]): Promise<any> {
        const start = Date.now();
        try {
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            logger.debug('Executed query', { text, duration, rows: result.rowCount });
            return result;
        } catch (error) {
            logger.error('Database query error:', { text, params, error });
            throw error;
        }
    }

    async getClient(): Promise<PoolClient> {
        return await this.pool.connect();
    }

    async close(): Promise<void> {
        await this.pool.end();
        logger.info('Database connection pool closed');
    }

    // Initialize database tables
    async initializeTables(): Promise<void> {
        try {
            // Create content table
            await this.query(`
        CREATE TABLE IF NOT EXISTS content (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          meta JSONB DEFAULT '{}',
          slug VARCHAR(255) UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

            // Create objects table
            await this.query(`
        CREATE TABLE IF NOT EXISTS objects (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          user_id VARCHAR(255),
          due_date TIMESTAMP,
          type VARCHAR(100) DEFAULT 'object',
          metadata JSONB DEFAULT '{}',
          items JSONB DEFAULT '[]',
          upvotes INTEGER DEFAULT 0,
          downvotes INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

            // Create indexes for better performance
            await this.query(`
        CREATE INDEX IF NOT EXISTS idx_content_slug ON content(slug);
        CREATE INDEX IF NOT EXISTS idx_content_created_at ON content(created_at);
        CREATE INDEX IF NOT EXISTS idx_objects_type ON objects(type);
        CREATE INDEX IF NOT EXISTS idx_objects_user_id ON objects(user_id);
        CREATE INDEX IF NOT EXISTS idx_objects_created_at ON objects(created_at);
      `);

            // Create trigger to update updated_at timestamp
            await this.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql';
      `);

            await this.query(`
        DROP TRIGGER IF EXISTS update_content_updated_at ON content;
        CREATE TRIGGER update_content_updated_at 
        BEFORE UPDATE ON content 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);

            await this.query(`
        DROP TRIGGER IF EXISTS update_objects_updated_at ON objects;
        CREATE TRIGGER update_objects_updated_at 
        BEFORE UPDATE ON objects 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);

            logger.info('Database tables initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize database tables:', error);
            throw error;
        }
    }
}

// Export singleton instance
const database = new Database();
export default database;