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

        const objectData = new ObjectModel({
            title,
            description,
            userId,
            dueDate: dueDate ? new Date(dueDate) : null,
            type,
            metadata,
            items,
            upvotes,
            downvotes
        });

        await objectData.save();
        logger.info(`Object created successfully with ID: ${objectData._id}`);
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
        if (userId) filter.userId = userId;

        const objects = await ObjectModel.find(filter)
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip(Number(offset));

        const total = await ObjectModel.countDocuments(filter);

        logger.info(`Retrieved objects successfully. Total items: ${objects.length}`);
        res.status(200).json({
            objects,
            pagination: {
                total,
                limit: Number(limit),
                offset: Number(offset),
                hasMore: total > Number(offset) + Number(limit)
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
        const object = await ObjectModel.findById(req.params.id);
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
        delete updates._id;
        delete updates.createdAt;
        delete updates.updatedAt;

        const object = await ObjectModel.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

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
        const object = await ObjectModel.findByIdAndDelete(req.params.id);
        if (!object) {
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

        const updateField = type === 'upvote' ? { $inc: { upvotes: 1 } } : { $inc: { downvotes: 1 } };

        const object = await ObjectModel.findByIdAndUpdate(
            id,
            updateField,
            { new: true }
        );

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

        const object = await ObjectModel.findById(id);
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
        await object.save();

        logger.info(`Updated item ${index} for object with ID: ${id}`);
        res.json({
            message: 'Item updated successfully',
            item: object.items[index]
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to update item for object with ID: ${req.params.id}. Error: ${errorMessage}`);
        res.status(500).json({ error: 'Failed to update item' });
    }
};

export const cleanObjects = async (req: Request, res: Response) => {
    try {
        const result = await ObjectModel.deleteMany({});
        logger.info(`Cleaned all objects. Deleted count: ${result.deletedCount}`);
        res.status(200).json({
            message: 'All objects cleaned successfully',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to clean objects: ${errorMessage}`);
        res.status(500).json({ error: 'Failed to clean objects' });
    }
};