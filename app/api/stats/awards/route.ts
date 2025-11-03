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

    // Find top player for week
    let playerOfWeek: PlayerAward | null = null;
    let maxWeekPoints = 0;
    weekPlayerPoints.forEach((data, playerId) => {
      if (data.points > maxWeekPoints) {
        maxWeekPoints = data.points;
        playerOfWeek = {
          playerId,
          playerName: data.name,
          totalPoints: data.points,
          gamesPlayed: data.games,
        };
      }
    });

    // Find top player for month
    let playerOfMonth: PlayerAward | null = null;
    let maxMonthPoints = 0;
    monthPlayerPoints.forEach((data, playerId) => {
      if (data.points > maxMonthPoints) {
        maxMonthPoints = data.points;
        playerOfMonth = {
          playerId,
          playerName: data.name,
          totalPoints: data.points,
          gamesPlayed: data.games,
        };
      }
    });

    // Fetch player photos if we have winners
    if (playerOfWeek) {
      const player = await Player.findById((playerOfWeek as PlayerAward).playerId);
      if (player && player.photoUrl) {
        (playerOfWeek as PlayerAward).playerPhoto = player.photoUrl;
      }
    }

    if (playerOfMonth) {
      const player = await Player.findById((playerOfMonth as PlayerAward).playerId);
      if (player && player.photoUrl) {
        (playerOfMonth as PlayerAward).playerPhoto = player.photoUrl;
      }
    }

    return NextResponse.json({
      playerOfWeek,
      playerOfMonth,
    });
  } catch (error) {
    console.error('Error fetching player awards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player awards' },
      { status: 500 }
    );
  }
}
