// src/controllers/object.controller.ts

import { Request, Response } from 'express';
import ObjectModel from '../models/object.model';
import logger from '../utils/logger';

export const createObject = async (req: Request, res: Response) => {
    try {
        const {
            title,
            description,
            userId = null,
            dueDate = null,
            type = "object",
            metadata = {},
            items = [],
            upvotes = 0,
            downvotes = 0
        } = req.body;

        // Validate required fields
        if (!title || !description) {
            return res.status(400).json({
                error: 'Title and description are required'
            });
        }

        // Ensure metadata and items are proper objects/arrays
        const cleanMetadata = typeof metadata === 'object' && metadata !== null ? metadata : {};
        const cleanItems = Array.isArray(items) ? items : [];

        const objectData = await ObjectModel.create({
            title,
            description,
            user_id: userId,
            due_date: dueDate ? new Date(dueDate) : null,
            type,
            metadata: cleanMetadata,
            items: cleanItems,
            upvotes,
            downvotes
        });

        logger.info(`Object created successfully with ID: ${objectData.id}`);
        res.status(201).json(objectData);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to create object: ${errorMessage}`);
        res.status(500).json({ error: 'Failed to create object' });
    }
};

export const getAllObjects = async (req: Request, res: Response) => {
    try {
        const { type, userId, limit = 50, offset = 0 } = req.query;

        const filter: any = {};
        if (type) filter.type = type;
        if (userId) filter.user_id = userId;

        const result = await ObjectModel.findAll(filter, Number(limit), Number(offset));

        logger.info(`Retrieved objects successfully. Total items: ${result.objects.length}`);
        res.status(200).json({
            objects: result.objects,
            pagination: {
                total: result.total,
                limit: Number(limit),
                offset: Number(offset),
                hasMore: result.total > Number(offset) + Number(limit)
            }
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to retrieve objects: ${errorMessage}`);
        res.status(500).json({ error: 'Failed to retrieve objects' });
    }
};

export const getObjectById = async (req: Request, res: Response) => {
    try {
        const object = await ObjectModel.findById(parseInt(req.params.id));
        if (!object) {
            logger.warn(`Object not found with ID: ${req.params.id}`);
            return res.status(404).json({ error: 'Object not found' });
        }
        logger.info(`Retrieved object with ID: ${req.params.id}`);
        res.status(200).json(object);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to retrieve object with ID: ${req.params.id}. Error: ${errorMessage}`);
        res.status(500).json({ error: 'Failed to retrieve object' });
    }
};

export const updateObject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Remove fields that shouldn't be updated directly
        delete updates.id;
        delete updates.created_at;
        delete updates.updated_at;

        // Convert userId to user_id for database consistency
        if (updates.userId !== undefined) {
            updates.user_id = updates.userId;
            delete updates.userId;
        }

        if (updates.dueDate !== undefined) {
            updates.due_date = updates.dueDate;
            delete updates.dueDate;
        }

        const object = await ObjectModel.update(parseInt(id), updates);

        if (!object) {
            logger.warn(`Object not found with ID: ${id}`);
            return res.status(404).json({ error: 'Object not found' });
        }

        logger.info(`Updated object with ID: ${id}`);
        res.status(200).json(object);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to update object with ID: ${req.params.id}. Error: ${errorMessage}`);
        res.status(500).json({ error: 'Failed to update object' });
    }
};

export const deleteObject = async (req: Request, res: Response) => {
    try {
        const deleted = await ObjectModel.delete(parseInt(req.params.id));
        if (!deleted) {
            logger.warn(`Object not found with ID: ${req.params.id}`);
            return res.status(404).json({ error: 'Object not found' });
        }
        logger.info(`Deleted object with ID: ${req.params.id}`);
        res.status(200).json({ message: 'Object deleted successfully' });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to delete object with ID: ${req.params.id}. Error: ${errorMessage}`);
        res.status(500).json({ error: 'Failed to delete object' });
    }
};

export const updateObjectVotes = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { type } = req.body; // 'upvote' or 'downvote'

        if (!['upvote', 'downvote'].includes(type)) {
            return res.status(400).json({ error: 'Vote type must be "upvote" or "downvote"' });
        }

        const object = await ObjectModel.updateVotes(parseInt(id), type);

        if (!object) {
            logger.warn(`Object not found with ID: ${id}`);
            return res.status(404).json({ error: 'Object not found' });
        }

        logger.info(`${type} recorded for object with ID: ${id}`);
        res.json({
            message: `${type} recorded successfully`,
            upvotes: object.upvotes,
            downvotes: object.downvotes
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to update votes for object with ID: ${req.params.id}. Error: ${errorMessage}`);
        res.status(500).json({ error: 'Failed to update votes' });
    }
};

export const updateObjectItem = async (req: Request, res: Response) => {
    try {
        const { id, itemIndex } = req.params;
        const updates = req.body;

        const object = await ObjectModel.findById(parseInt(id));
        if (!object) {
            logger.warn(`Object not found with ID: ${id}`);
            return res.status(404).json({ error: 'Object not found' });
        }

        const index = parseInt(itemIndex);
        if (index < 0 || index >= object.items.length) {
            return res.status(400).json({ error: 'Invalid item index' });
        }

        // Update the specific item
        Object.assign(object.items[index], updates);

        // Update the entire object with the modified items array
        const updatedObject = await ObjectModel.update(parseInt(id), { items: object.items });

        logger.info(`Updated item ${index} for object with ID: ${id}`);
        res.json({
            message: 'Item updated successfully',
            item: updatedObject?.items[index]
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to update item for object with ID: ${req.params.id}. Error: ${errorMessage}`);
        res.status(500).json({ error: 'Failed to update item' });
    }
};

export const cleanObjects = async (req: Request, res: Response) => {
    try {
        const deletedCount = await ObjectModel.deleteAll();
        logger.info(`Cleaned all objects. Deleted count: ${deletedCount}`);
        res.status(200).json({
            message: 'All objects cleaned successfully',
            deletedCount: deletedCount
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to clean objects: ${errorMessage}`);
        res.status(500).json({ error: 'Failed to clean objects' });
    }
};