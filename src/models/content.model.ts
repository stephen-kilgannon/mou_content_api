// src/models/content.model.ts

import mongoose, { Document, Schema } from 'mongoose';
import slugify from 'slugify';

interface IContent extends Document {
  title: string;
  content: string;
  meta: {
    description: string;
    keywords: string;
  };
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContentSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    meta: {
      description: { type: String, required: true },
      keywords: { type: String, required: true },
    },
    slug: { type: String},
  },
  {
    timestamps: true,
  }
);

// Middleware to generate slug from title if slug is not provided
ContentSchema.pre<IContent>('save', function (next) {
  if (!this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

export default mongoose.model<IContent>('Content', ContentSchema);
