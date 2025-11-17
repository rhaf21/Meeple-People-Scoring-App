import mongoose, { Document, Schema } from 'mongoose';

export type ScoringMode = 'pointing' | 'winner-takes-all';

export interface IGameDefinition extends Document {
  name: string;
  scoringMode: ScoringMode;
  pointsPerPlayer: number;
  imageUrl?: string;
  imagePublicId?: string;

  // BGG Integration fields
  bggId?: number;
  description?: string;
  yearPublished?: number;
  minPlayers?: number;
  maxPlayers?: number;
  playingTime?: number; // in minutes
  minPlaytime?: number;
  maxPlaytime?: number;
  minAge?: number;
  designers?: string[];
  artists?: string[];
  publishers?: string[];
  categories?: string[];
  mechanics?: string[];
  bggRating?: number;
  bggAverageWeight?: number; // Complexity rating
  bggUrl?: string;
  thumbnailUrl?: string;

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

    // BGG Integration fields
    bggId: {
      type: Number,
      sparse: true,
      unique: true,
    },
    description: {
      type: String,
    },
    yearPublished: {
      type: Number,
    },
    minPlayers: {
      type: Number,
    },
    maxPlayers: {
      type: Number,
    },
    playingTime: {
      type: Number, // Average playing time in minutes
    },
    minPlaytime: {
      type: Number,
    },
    maxPlaytime: {
      type: Number,
    },
    minAge: {
      type: Number,
    },
    designers: {
      type: [String],
      default: [],
    },
    artists: {
      type: [String],
      default: [],
    },
    publishers: {
      type: [String],
      default: [],
    },
    categories: {
      type: [String],
      default: [],
    },
    mechanics: {
      type: [String],
      default: [],
    },
    bggRating: {
      type: Number,
    },
    bggAverageWeight: {
      type: Number, // 1-5 complexity rating
    },
    bggUrl: {
      type: String,
    },
    thumbnailUrl: {
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

// Indexes (name and bggId already indexed via unique: true)
GameDefinitionSchema.index({ isActive: 1 });

// Clear cached model to ensure schema updates are applied
if (mongoose.models.GameDefinition) {
  delete mongoose.models.GameDefinition;
}

export default mongoose.model<IGameDefinition>('GameDefinition', GameDefinitionSchema);
