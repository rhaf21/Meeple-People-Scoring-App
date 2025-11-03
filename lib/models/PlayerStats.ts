import mongoose, { Document, Schema, Types } from 'mongoose';

interface IOverallStats {
  totalGames: number;
  totalPoints: number;
  averagePoints: number;
  wins: number;
  podiums: number;
  winRate: number;
}

interface IByPlayerCount {
  totalGames: number;
  totalPoints: number;
  averagePoints: number;
  wins: number;
}

interface IGameStats {
  gameId: Types.ObjectId;
  gameName: string;
  totalGames: number;
  totalPoints: number;
  averagePoints: number;
  wins: number;
  podiums: number;
  byPlayerCount: Map<number, IByPlayerCount>;
}

export interface IPlayerStats extends Document {
  playerId: Types.ObjectId;
  playerName: string;
  overall: IOverallStats;
  gameStats: IGameStats[];
  lastUpdated: Date;
}

const PlayerStatsSchema = new Schema<IPlayerStats>(
  {
    playerId: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
      unique: true,
    },
    playerName: {
      type: String,
      required: true,
    },
    overall: {
      totalGames: { type: Number, default: 0 },
      totalPoints: { type: Number, default: 0 },
      averagePoints: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      podiums: { type: Number, default: 0 },
      winRate: { type: Number, default: 0 },
    },
    gameStats: [
      {
        gameId: {
          type: Schema.Types.ObjectId,
          ref: 'GameDefinition',
          required: true,
        },
        gameName: { type: String, required: true },
        totalGames: { type: Number, default: 0 },
        totalPoints: { type: Number, default: 0 },
        averagePoints: { type: Number, default: 0 },
        wins: { type: Number, default: 0 },
        podiums: { type: Number, default: 0 },
        byPlayerCount: {
          type: Map,
          of: {
            totalGames: { type: Number, default: 0 },
            totalPoints: { type: Number, default: 0 },
            averagePoints: { type: Number, default: 0 },
            wins: { type: Number, default: 0 },
          },
        },
      },
    ],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes (playerId index is created automatically by unique: true)
PlayerStatsSchema.index({ 'overall.totalPoints': -1 });
PlayerStatsSchema.index({ 'gameStats.gameId': 1 });

export default mongoose.models.PlayerStats || mongoose.model<IPlayerStats>('PlayerStats', PlayerStatsSchema);
