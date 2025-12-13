// src/controllers/content.controller.ts

import { Request, Response } from 'express';
import ContentModel from '../models/content.model';
import logger from '../utils/logger';

export const createContent = async (req: Request, res: Response) => {
  try {
    const contentData = req.body;
    const content = await ContentModel.create(contentData);
    logger.info(`Content created successfully with ID: ${content.id}`);
    res.status(201).json(content);
  } catch (error) {
    // Assert error as an instance of Error to access message safely
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to create content: ${errorMessage}`);
    res.status(500).json({ error: 'Failed to create content' });
  }
};

export const getAllContent = async (req: Request, res: Response) => {
  try {
    const contents = await ContentModel.findAll();
    logger.info(`Retrieved all content successfully. Total items: ${contents.length}`);
    res.status(200).json(contents);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to retrieve content: ${errorMessage}`);
    res.status(500).json({ error: 'Failed to retrieve content' });
  }
};

export const getContentBySlug = async (req: Request, res: Response) => {
  try {
    const content = await ContentModel.findBySlug(req.params.slug);
    if (!content) {
      logger.warn(`Content not found with slug: ${req.params.slug}`);
      return res.status(404).json({ error: 'Content not found' });
    }
    logger.info(`Retrieved content with slug: ${req.params.slug}`);
    res.status(200).json(content);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to retrieve content with slug: ${req.params.slug}. Error: ${errorMessage}`);
    res.status(500).json({ error: 'Failed to retrieve content' });
  }
};

export const getContentById = async (req: Request, res: Response) => {
  try {
    const content = await ContentModel.findById(parseInt(req.params.id));
    if (!content) {
      logger.warn(`Content not found with ID: ${req.params.id}`);
      return res.status(404).json({ error: 'Content not found' });
    }
    logger.info(`Retrieved content with ID: ${req.params.id}`);
    res.status(200).json(content);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to retrieve content with ID: ${req.params.id}. Error: ${errorMessage}`);
    res.status(500).json({ error: 'Failed to retrieve content' });
  }
};

export const deleteContent = async (req: Request, res: Response) => {
  try {
    const deleted = await ContentModel.delete(parseInt(req.params.id));
    if (!deleted) {
      logger.warn(`Content not found for deletion with ID: ${req.params.id}`);
      return res.status(404).json({ error: 'Content not found' });
    }
    logger.info(`Content with ID: ${req.params.id} deleted successfully.`);
    res.status(204).send();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to delete content with ID: ${req.params.id}. Error: ${errorMessage}`);
    res.status(500).json({ error: 'Failed to delete content' });
  }
};


export const cleanContent = async (req: Request, res: Response) => {
  if (process.env.NODE_ENV !== 'development') {
    logger.warn('Attempted to clean content in a non-development environment.');
    return res.status(403).json({ error: 'This action is only allowed in development mode.' });
  }
  try {
    const deletedCount = await ContentModel.deleteAll();
    logger.info(`All content has been cleaned. Deleted ${deletedCount} items.`);
    res.status(200).json({
      message: 'All content has been successfully deleted.',
      deletedCount: deletedCount,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to clean content: ${errorMessage}`);
    res.status(500).json({ error: 'Failed to clean content' });
  }
};
