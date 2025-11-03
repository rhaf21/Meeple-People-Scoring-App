import { NextResponse } from 'next/server';
import connectDB from '@/lib/utils/db';
import GameSession from '@/lib/models/GameSession';
import Player from '@/lib/models/Player';

interface PlayerAward {
  playerId: string;
  playerName: string;
  playerPhoto?: string;
  totalPoints: number;
  gamesPlayed: number;
}

export async function GET() {
  try {
    await connectDB();

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get sessions from the last week
    const weekSessions = await GameSession.find({
      playedAt: { $gte: oneWeekAgo },
    });

    // Get sessions from the last month
    const monthSessions = await GameSession.find({
      playedAt: { $gte: oneMonthAgo },
    });

    // Calculate player of the week
    const weekPlayerPoints = new Map<string, { points: number; games: number; name: string }>();
    weekSessions.forEach((session) => {
      session.results.forEach((result: any) => {
        const playerId = result.playerId.toString();
        const existing = weekPlayerPoints.get(playerId) || { points: 0, games: 0, name: result.playerName };
        weekPlayerPoints.set(playerId, {
          points: existing.points + result.pointsEarned,
          games: existing.games + 1,
          name: result.playerName,
        });
      });
    });

    // Calculate player of the month
    const monthPlayerPoints = new Map<string, { points: number; games: number; name: string }>();
    monthSessions.forEach((session) => {
      session.results.forEach((result: any) => {
        const playerId = result.playerId.toString();
        const existing = monthPlayerPoints.get(playerId) || { points: 0, games: 0, name: result.playerName };
        monthPlayerPoints.set(playerId, {
          points: existing.points + result.pointsEarned,
          games: existing.games + 1,
          name: result.playerName,
        });
      });
    });

    // Find top 3 players for week
    const weekTopPlayers: PlayerAward[] = Array.from(weekPlayerPoints.entries())
      .map(([playerId, data]) => ({
        playerId,
        playerName: data.name,
        playerPhoto: undefined,
        totalPoints: data.points,
        gamesPlayed: data.games,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 3);

    // Find top 3 players for month
    const monthTopPlayers: PlayerAward[] = Array.from(monthPlayerPoints.entries())
      .map(([playerId, data]) => ({
        playerId,
        playerName: data.name,
        playerPhoto: undefined,
        totalPoints: data.points,
        gamesPlayed: data.games,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 3);

    // Fetch player photos for all winners
    const allPlayerIds = [...weekTopPlayers, ...monthTopPlayers].map(p => p.playerId);
    const players = await Player.find({ _id: { $in: allPlayerIds } });
    const playerPhotoMap = new Map(players.map(p => [p._id.toString(), p.photoUrl]));

    // Add photos to week top players
    weekTopPlayers.forEach(player => {
      player.playerPhoto = playerPhotoMap.get(player.playerId);
    });

    // Add photos to month top players
    monthTopPlayers.forEach(player => {
      player.playerPhoto = playerPhotoMap.get(player.playerId);
    });

    return NextResponse.json({
      playerOfWeek: weekTopPlayers.length > 0 ? weekTopPlayers : null,
      playerOfMonth: monthTopPlayers.length > 0 ? monthTopPlayers : null,
    });
  } catch (error) {
    console.error('Error fetching player awards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player awards' },
      { status: 500 }
    );
  }
}
