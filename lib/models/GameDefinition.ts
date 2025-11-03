import mongoose, { Document, Schema } from 'mongoose';

export type ScoringMode = 'pointing' | 'winner-takes-all';

export interface IGameDefinition extends Document {
  name: string;
  scoringMode: ScoringMode;
  pointsPerPlayer: number;
  imageUrl?: string;
  imagePublicId?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

const GameDefinitionSchema = new Schema<IGameDefinition>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    scoringMode: {
      type: String,
      required: true,
      enum: ['pointing', 'winner-takes-all'],
      default: 'pointing',
    },
    pointsPerPlayer: {
      type: Number,
      required: true,
      default: function() {
        // Default is 5 for pointing system, 3 for winner-takes-all
        return this.scoringMode === 'winner-takes-all' ? 3 : 5;
      },
    },
    imageUrl: {
      type: String,
    },
    imagePublicId: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes (name already indexed via unique: true)
GameDefinitionSchema.index({ isActive: 1 });

export default mongoose.models.GameDefinition || mongoose.model<IGameDefinition>('GameDefinition', GameDefinitionSchema);
