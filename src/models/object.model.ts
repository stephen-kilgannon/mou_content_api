// src/models/object.model.ts

import mongoose, { Document, Schema } from 'mongoose';

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

export interface IObject extends Document {
    title: string;
    description: string;
    userId: string | null;
    dueDate: Date | null;
    type: string;
    metadata: Record<string, any>;
    items: IContentItem[];
    upvotes: number;
    downvotes: number;
    createdAt: Date;
    updatedAt: Date;
}

const ContentItemSchema: Schema = new Schema({
    type: {
        type: String,
        enum: ['task', 'journal', 'event'],
        required: true
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'completed', 'in-progress'],
        default: 'pending'
    },
    completed: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed, default: {} }
}, { _id: false });

const ObjectSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        userId: { type: String, default: null },
        dueDate: { type: Date, default: null },
        type: { type: String, default: 'object' },
        metadata: { type: Schema.Types.Mixed, default: {} },
        items: [ContentItemSchema],
        upvotes: { type: Number, default: 0 },
        downvotes: { type: Number, default: 0 }
    },
    {
        timestamps: true,
    }
);

// Index for better query performance
ObjectSchema.index({ title: 'text', description: 'text' });
ObjectSchema.index({ type: 1 });
ObjectSchema.index({ userId: 1 });
ObjectSchema.index({ createdAt: -1 });

export default mongoose.model<IObject>('Object', ObjectSchema);