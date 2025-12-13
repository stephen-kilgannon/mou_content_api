// src/models/content.model.ts

import database from '../utils/database';
import slugify from 'slugify';
import logger from '../utils/logger';

export interface IContent {
  id?: number;
  title: string;
  content: string;
  meta: {
    description: string;
    keywords: string[];
    author?: string;
    date?: Date;
    tags?: string[];
    imageUrl?: string;
  };
  slug?: string;
  created_at?: Date;
  updated_at?: Date;
}

class ContentModel {
  static async create(contentData: Omit<IContent, 'id' | 'created_at' | 'updated_at'>): Promise<IContent> {
    try {
      // Generate slug if not provided
      const slug = contentData.slug || slugify(contentData.title, { lower: true, strict: true });

      const query = `
        INSERT INTO content (title, content, meta, slug)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const values = [
        contentData.title,
        contentData.content,
        JSON.stringify(contentData.meta || {}),
        slug
      ];

      const result = await database.query(query, values);
      const content = result.rows[0];
      try {
        content.meta = typeof content.meta === 'string' ? JSON.parse(content.meta) : (content.meta || {});
      } catch (parseError) {
        logger.error('Failed to parse JSON from content:', parseError);
        content.meta = {};
      }

      return content;
    } catch (error) {
      logger.error('Failed to create content:', error);
      throw error;
    }
  }

  static async findAll(): Promise<IContent[]> {
    try {
      const query = 'SELECT * FROM content ORDER BY created_at DESC';
      const result = await database.query(query);

      return result.rows.map((row: any) => {
        try {
          return {
            ...row,
            meta: typeof row.meta === 'string' ? JSON.parse(row.meta) : (row.meta || {})
          };
        } catch (parseError) {
          logger.error('Failed to parse JSON from content row:', parseError);
          return {
            ...row,
            meta: {}
          };
        }
      });
    } catch (error) {
      logger.error('Failed to fetch all content:', error);
      throw error;
    }
  }

  static async findById(id: number): Promise<IContent | null> {
    try {
      const query = 'SELECT * FROM content WHERE id = $1';
      const result = await database.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      const content = result.rows[0];
      try {
        content.meta = typeof content.meta === 'string' ? JSON.parse(content.meta) : (content.meta || {});
      } catch (parseError) {
        logger.error('Failed to parse JSON from content:', parseError);
        content.meta = {};
      }

      return content;
    } catch (error) {
      logger.error('Failed to fetch content by ID:', error);
      throw error;
    }
  }

  static async findBySlug(slug: string): Promise<IContent | null> {
    try {
      const query = 'SELECT * FROM content WHERE slug = $1';
      const result = await database.query(query, [slug]);

      if (result.rows.length === 0) {
        return null;
      }

      const content = result.rows[0];
      try {
        content.meta = typeof content.meta === 'string' ? JSON.parse(content.meta) : (content.meta || {});
      } catch (parseError) {
        logger.error('Failed to parse JSON from content:', parseError);
        content.meta = {};
      }

      return content;
    } catch (error) {
      logger.error('Failed to fetch content by slug:', error);
      throw error;
    }
  }

  static async update(id: number, updates: Partial<IContent>): Promise<IContent | null> {
    try {
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (updates.title !== undefined) {
        setClauses.push(`title = $${paramCount}`);
        values.push(updates.title);
        paramCount++;
      }

      if (updates.content !== undefined) {
        setClauses.push(`content = $${paramCount}`);
        values.push(updates.content);
        paramCount++;
      }

      if (updates.meta !== undefined) {
        setClauses.push(`meta = $${paramCount}`);
        values.push(typeof updates.meta === 'string' ? updates.meta : JSON.stringify(updates.meta));
        paramCount++;
      }

      if (updates.slug !== undefined) {
        setClauses.push(`slug = $${paramCount}`);
        values.push(updates.slug);
        paramCount++;
      }

      if (setClauses.length === 0) {
        return await this.findById(id);
      }

      values.push(id);

      const query = `
        UPDATE content 
        SET ${setClauses.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await database.query(query, values);

      if (result.rows.length === 0) {
        return null;
      }

      const content = result.rows[0];
      try {
        content.meta = typeof content.meta === 'string' ? JSON.parse(content.meta) : (content.meta || {});
      } catch (parseError) {
        logger.error('Failed to parse JSON from content:', parseError);
        content.meta = {};
      }

      return content;
    } catch (error) {
      logger.error('Failed to update content:', error);
      throw error;
    }
  }

  static async delete(id: number): Promise<boolean> {
    try {
      const query = 'DELETE FROM content WHERE id = $1';
      const result = await database.query(query, [id]);

      return result.rowCount > 0;
    } catch (error) {
      logger.error('Failed to delete content:', error);
      throw error;
    }
  }

  static async deleteAll(): Promise<number> {
    try {
      const query = 'DELETE FROM content';
      const result = await database.query(query);

      return result.rowCount || 0;
    } catch (error) {
      logger.error('Failed to delete all content:', error);
      throw error;
    }
  }
}

export default ContentModel;
