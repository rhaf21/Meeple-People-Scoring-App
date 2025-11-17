import { NextResponse } from 'next/server';
import connectDB from '@/lib/utils/db';
import GameDefinition from '@/lib/models/GameDefinition';
import PlayerStats from '@/lib/models/PlayerStats';
import Player from '@/lib/models/Player';

interface BestPlayerData {
  playerId: string;
  playerName: string;
  playerPhoto?: string;
  totalPoints: number;
  totalGames: number;
}

interface GameChampion {
  gameId: string;
  gameName: string;
  gameImage?: string;
  bestPlayer: BestPlayerData | null;
}

export async function GET() {
  try {
    await connectDB();

    const MIN_GAMES_THRESHOLD = 2;

    // Get all active games
    const games = await GameDefinition.find({ isActive: true });

    if (games.length === 0) {
      return NextResponse.json([]);
    }

    // Get all player stats
    const allPlayerStats = await PlayerStats.find({});

    const gameChampions: GameChampion[] = [];

    for (const game of games) {
      const gameIdStr = (game._id as any).toString();

      // Find all players who have played this game with at least MIN_GAMES_THRESHOLD games
      const qualifiedPlayers: BestPlayerData[] = [];

      for (const playerStat of allPlayerStats) {
        const gameStat = playerStat.gameStats.find(
          (gs: any) => gs.gameId.toString() === gameIdStr
        );

        if (gameStat && gameStat.totalGames >= MIN_GAMES_THRESHOLD) {
          qualifiedPlayers.push({
            playerId: playerStat.playerId.toString(),
            playerName: playerStat.playerName,
            totalPoints: gameStat.totalPoints,
            totalGames: gameStat.totalGames,
          });
        }
      }

      // Sort by total points descending and get the best player
      qualifiedPlayers.sort((a, b) => b.totalPoints - a.totalPoints);
      const bestPlayer = qualifiedPlayers[0] || null;

      // Fetch player photo if we have a best player
      if (bestPlayer) {
        const player = await Player.findById(bestPlayer.playerId);
        if (player && player.photoUrl) {
          bestPlayer.playerPhoto = player.photoUrl;
        }
      }

      // Only include games that have a qualified best player
      if (bestPlayer) {
        gameChampions.push({
          gameId: (game._id as any).toString(),
          gameName: game.name,
          gameImage: game.imageUrl,
          bestPlayer,
        });
      }
    }

    return NextResponse.json(gameChampions);
  } catch (error) {
    console.error('Error fetching best players per game:', error);
    return NextResponse.json(
      { error: 'Failed to fetch best players per game' },
      { status: 500 }
    );
  }
}
