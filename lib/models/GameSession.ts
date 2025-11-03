import mongoose, { Document, Schema, Types } from 'mongoose';
import { ScoringMode } from './GameDefinition';

export interface IGameResult {
  playerId: Types.ObjectId;
  playerName: string;
  rank: number;
  score?: number;
  pointsEarned: number;
}

export interface IGameSession extends Document {
  gameId: Types.ObjectId;
  gameName: string;
  scoringMode: ScoringMode;
  playerCount: number;
  playedAt: Date;
  results: IGameResult[];
  totalPointsPool: number;
  createdAt: Date;
  updatedAt: Date;
}

const GameSessionSchema = new Schema<IGameSession>(
  {
    gameId: {
      type: Schema.Types.ObjectId,
      ref: 'GameDefinition',
      required: true,
    },
    gameName: {
      type: String,
      required: true,
    },
    scoringMode: {
      type: String,
      required: true,
      enum: ['pointing', 'winner-takes-all'],
    },
    playerCount: {
      type: Number,
      required: true,
      min: 1,
    },
    playedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    results: [
      {
        playerId: {
          type: Schema.Types.ObjectId,
          ref: 'Player',
          required: true,
        },
        playerName: {
          type: String,
          required: true,
        },
        rank: {
          type: Number,
          required: true,
          min: 1,
        },
        score: {
          type: Number,
        },
        pointsEarned: {
          type: Number,
          required: true,
          default: 0,
        },
      },
    ],
    totalPointsPool: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
GameSessionSchema.index({ gameId: 1 });
GameSessionSchema.index({ playedAt: -1 });
GameSessionSchema.index({ playerCount: 1 });
GameSessionSchema.index({ 'results.playerId': 1 });
GameSessionSchema.index({ gameId: 1, playerCount: 1 });

export default mongoose.models.GameSession || mongoose.model<IGameSession>('GameSession', GameSessionSchema);
