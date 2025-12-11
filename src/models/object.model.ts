// src/models/object.model.ts

import database from '../utils/database';
import logger from '../utils/logger';

export interface IContentItem {
    type: 'task' | 'journal' | 'event';
    title: string;
    description: string;
    status: 'pending' | 'completed' | 'in-progress';
    completed: boolean;
    metadata: {
        tags?: string[];
        frequency?: string;
        'the check'?: string;
        'the promise'?: string;
        location?: string;
        [key: string]: any;
    };
}

export interface IObject {
    id?: number;
    title: string;
    description: string;
    user_id: string | null;
    due_date: Date | null;
    type: string;
    metadata: Record<string, any>;
    items: IContentItem[];
    upvotes: number;
    downvotes: number;
    created_at?: Date;
    updated_at?: Date;
}

class ObjectModel {
    static async create(objectData: Omit<IObject, 'id' | 'created_at' | 'updated_at'>): Promise<IObject> {
        try {
            const query = `
                INSERT INTO objects (title, description, user_id, due_date, type, metadata, items, upvotes, downvotes)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `;

            const values = [
                objectData.title,
                objectData.description,
                objectData.user_id,
                objectData.due_date,
                objectData.type || 'object',
                JSON.stringify(objectData.metadata || {}),
                JSON.stringify(objectData.items || []),
                objectData.upvotes || 0,
                objectData.downvotes || 0
            ];

            const result = await database.query(query, values);
            const obj = result.rows[0];
            try {
                obj.metadata = typeof obj.metadata === 'string' ? JSON.parse(obj.metadata) : (obj.metadata || {});
                obj.items = typeof obj.items === 'string' ? JSON.parse(obj.items) : (obj.items || []);
            } catch (parseError) {
                logger.error('Failed to parse JSON from database:', parseError);
                obj.metadata = {};
                obj.items = [];
            }

            return obj;
        } catch (error) {
            logger.error('Failed to create object:', error);
            throw error;
        }
    }

    static async findAll(filter: any = {}, limit: number = 50, offset: number = 0): Promise<{ objects: IObject[], total: number }> {
        try {
            const whereClauses: string[] = [];
            const values: any[] = [];
            let paramCount = 1;

            if (filter.type) {
                whereClauses.push(`type = $${paramCount}`);
                values.push(filter.type);
                paramCount++;
            }

            if (filter.user_id) {
                whereClauses.push(`user_id = $${paramCount}`);
                values.push(filter.user_id);
                paramCount++;
            }

            const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

            // Get total count
            const countQuery = `SELECT COUNT(*) FROM objects ${whereClause}`;
            const countResult = await database.query(countQuery, values);
            const total = parseInt(countResult.rows[0].count);

            // Get objects with pagination
            values.push(limit, offset);
            const query = `
                SELECT * FROM objects 
                ${whereClause}
                ORDER BY created_at DESC 
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `;

            const result = await database.query(query, values);

            const objects = result.rows.map((row: any) => {
                try {
                    return {
                        ...row,
                        metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : (row.metadata || {}),
                        items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || [])
                    };
                } catch (parseError) {
                    logger.error('Failed to parse JSON from database row:', parseError);
                    return {
                        ...row,
                        metadata: {},
                        items: []
                    };
                }
            });

            return { objects, total };
        } catch (error) {
            logger.error('Failed to fetch all objects:', error);
            throw error;
        }
    }

    static async findById(id: number): Promise<IObject | null> {
        try {
            const query = 'SELECT * FROM objects WHERE id = $1';
            const result = await database.query(query, [id]);

            if (result.rows.length === 0) {
                return null;
            }

            const obj = result.rows[0];
            try {
                obj.metadata = typeof obj.metadata === 'string' ? JSON.parse(obj.metadata) : (obj.metadata || {});
                obj.items = typeof obj.items === 'string' ? JSON.parse(obj.items) : (obj.items || []);
            } catch (parseError) {
                logger.error('Failed to parse JSON from database:', parseError);
                obj.metadata = {};
                obj.items = [];
            }

            return obj;
        } catch (error) {
            logger.error('Failed to fetch object by ID:', error);
            throw error;
        }
    }

    static async update(id: number, updates: Partial<IObject>): Promise<IObject | null> {
        try {
            const setClauses: string[] = [];
            const values: any[] = [];
            let paramCount = 1;

            if (updates.title !== undefined) {
                setClauses.push(`title = $${paramCount}`);
                values.push(updates.title);
                paramCount++;
            }

            if (updates.description !== undefined) {
                setClauses.push(`description = $${paramCount}`);
                values.push(updates.description);
                paramCount++;
            }

            if (updates.user_id !== undefined) {
                setClauses.push(`user_id = $${paramCount}`);
                values.push(updates.user_id);
                paramCount++;
            }

            if (updates.due_date !== undefined) {
                setClauses.push(`due_date = $${paramCount}`);
                values.push(updates.due_date);
                paramCount++;
            }

            if (updates.type !== undefined) {
                setClauses.push(`type = $${paramCount}`);
                values.push(updates.type);
                paramCount++;
            }

            if (updates.metadata !== undefined) {
                setClauses.push(`metadata = $${paramCount}`);
                values.push(typeof updates.metadata === 'string' ? updates.metadata : JSON.stringify(updates.metadata));
                paramCount++;
            }

            if (updates.items !== undefined) {
                setClauses.push(`items = $${paramCount}`);
                values.push(typeof updates.items === 'string' ? updates.items : JSON.stringify(updates.items));
                paramCount++;
            }

            if (updates.upvotes !== undefined) {
                setClauses.push(`upvotes = $${paramCount}`);
                values.push(updates.upvotes);
                paramCount++;
            }

            if (updates.downvotes !== undefined) {
                setClauses.push(`downvotes = $${paramCount}`);
                values.push(updates.downvotes);
                paramCount++;
            }

            if (setClauses.length === 0) {
                return await this.findById(id);
            }

            values.push(id);

            const query = `
                UPDATE objects 
                SET ${setClauses.join(', ')}
                WHERE id = $${paramCount}
                RETURNING *
            `;

            const result = await database.query(query, values);

            if (result.rows.length === 0) {
                return null;
            }

            const obj = result.rows[0];
            try {
                obj.metadata = typeof obj.metadata === 'string' ? JSON.parse(obj.metadata) : (obj.metadata || {});
                obj.items = typeof obj.items === 'string' ? JSON.parse(obj.items) : (obj.items || []);
            } catch (parseError) {
                logger.error('Failed to parse JSON from database:', parseError);
                obj.metadata = {};
                obj.items = [];
            }

            return obj;
        } catch (error) {
            logger.error('Failed to update object:', error);
            throw error;
        }
    }

    static async updateVotes(id: number, type: 'upvote' | 'downvote'): Promise<IObject | null> {
        try {
            const field = type === 'upvote' ? 'upvotes' : 'downvotes';
            const query = `
                UPDATE objects 
                SET ${field} = ${field} + 1
                WHERE id = $1
                RETURNING *
            `;

            const result = await database.query(query, [id]);

            if (result.rows.length === 0) {
                return null;
            }

            const obj = result.rows[0];
            try {
                obj.metadata = typeof obj.metadata === 'string' ? JSON.parse(obj.metadata) : (obj.metadata || {});
                obj.items = typeof obj.items === 'string' ? JSON.parse(obj.items) : (obj.items || []);
            } catch (parseError) {
                logger.error('Failed to parse JSON from database:', parseError);
                obj.metadata = {};
                obj.items = [];
            }

            return obj;
        } catch (error) {
            logger.error('Failed to update votes:', error);
            throw error;
        }
    }

    static async delete(id: number): Promise<boolean> {
        try {
            const query = 'DELETE FROM objects WHERE id = $1';
            const result = await database.query(query, [id]);

            return result.rowCount > 0;
        } catch (error) {
            logger.error('Failed to delete object:', error);
            throw error;
        }
    }

    static async deleteAll(): Promise<number> {
        try {
            const query = 'DELETE FROM objects';
            const result = await database.query(query);

            return result.rowCount || 0;
        } catch (error) {
            logger.error('Failed to delete all objects:', error);
            throw error;
        }
    }
}

export default ObjectModel;