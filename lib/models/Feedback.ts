import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type FeedbackCategory = 'Bug Report' | 'Feature Request' | 'Improvement' | 'General Feedback';
export type FeedbackPriority = 'Low' | 'Medium' | 'High';
export type FeedbackStatus = 'New' | 'In Progress' | 'Completed' | 'Dismissed';

export interface IFeedbackComment {
  text: string;
  authorId: Types.ObjectId;
  authorName: string;
  authorRole: 'user' | 'admin';
  createdAt: Date;
}

export interface IFeedback extends Document {
  message: string;
  category: FeedbackCategory;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  userEmail?: string;
  userId?: Types.ObjectId;
  userName?: string;
  comments: IFeedbackComment[];
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    message: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Bug Report', 'Feature Request', 'Improvement', 'General Feedback'],
      default: 'General Feedback',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['New', 'In Progress', 'Completed', 'Dismissed'],
      default: 'New',
    },
    userEmail: {
      type: String,
      default: null,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
      default: null,
    },
    userName: {
      type: String,
      default: null,
    },
    comments: {
      type: [
        {
          text: { type: String, required: true },
          authorId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
          authorName: { type: String, required: true },
          authorRole: { type: String, enum: ['user', 'admin'], required: true },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
FeedbackSchema.index({ status: 1 });
FeedbackSchema.index({ category: 1 });
FeedbackSchema.index({ createdAt: -1 });
FeedbackSchema.index({ userId: 1 });

const Feedback: Model<IFeedback> =
  mongoose.models.Feedback ||
  mongoose.model<IFeedback>('Feedback', FeedbackSchema);

export default Feedback;
