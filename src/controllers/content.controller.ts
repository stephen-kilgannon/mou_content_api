// src/controllers/content.controller.ts

import { Request, Response } from 'express';
import Content from '../models/content.model';
import logger from '../utils/logger';

export const createContent = async (req: Request, res: Response) => {
  try {
    const contentData = req.body;
    const content = new Content(contentData);
    await content.save();
    logger.info(`Content created successfully with ID: ${content._id}`);
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
    const contents = await Content.find().sort({ createdAt: -1 });
    logger.info(`Retrieved all content successfully. Total items: ${contents.length}`);
    res.status(200).json(contents);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to retrieve content: ${errorMessage}`);
    res.status(500).json({ error: 'Failed to retrieve content' });
  }
};

export const getContentById = async (req: Request, res: Response) => {
  try {
    const content = await Content.findById(req.params.id);
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
