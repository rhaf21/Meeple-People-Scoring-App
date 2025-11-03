import mongoose, { Document, Schema } from 'mongoose';

export interface IPlayer extends Document {
  name: string;
  photoUrl?: string;
  photoPublicId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastPlayedAt?: Date;
}

const PlayerSchema = new Schema<IPlayer>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    photoUrl: {
      type: String,
    },
    photoPublicId: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastPlayedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes (name already indexed via unique: true)
PlayerSchema.index({ lastPlayedAt: -1 });
PlayerSchema.index({ isActive: 1 });

export default mongoose.models.Player || mongoose.model<IPlayer>('Player', PlayerSchema);
