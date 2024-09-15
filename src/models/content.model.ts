import mongoose, { Document, Schema } from 'mongoose';

export interface IContent extends Document {
  title: string;
  meta: {
    description: string;
    keywords: string;
  };
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContentSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    meta: {
      description: { type: String, required: false },
      keywords: { type: String, required: false },
    },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IContent>('Content', ContentSchema);
