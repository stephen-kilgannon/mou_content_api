import { Request, Response } from 'express';
import Content from '../models/content.model';

export const createContent = async (req: Request, res: Response) => {
  try {
    const contentData = req.body;
    const content = new Content(contentData);
    await content.save();
    res.status(201).json(content);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create content' });
  }
};

export const getAllContent = async (req: Request, res: Response) => {
  try {
    const contents = await Content.find().sort({ createdAt: -1 });
    res.status(200).json(contents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve content' });
  }
};

export const getContentById = async (req: Request, res: Response) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    res.status(200).json(content);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve content' });
  }
};
