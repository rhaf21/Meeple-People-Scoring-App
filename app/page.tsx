'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import PlayerAwards from '@/components/PlayerAwards';
import BestPlayerPerGame from '@/components/BestPlayerPerGame';
import MonthlyLeaderboard from '@/components/MonthlyLeaderboard';

interface PlayerStats {
  _id: string;
  playerName: string;
  overall: {
    totalGames: number;
    totalPoints: number;
    averagePoints: number;
    wins: number;
    podiums: number;
    winRate: number;
  };
}

interface Player {
  _id: string;
  name: string;
  photoUrl?: string;
  isActive: boolean;
}

interface Session {
  _id: string;
  gameName: string;
  playerCount: number;
  playedAt: string;
  results: Array<{
    playerName: string;
    rank: number;
    pointsEarned: number;
  }>;
}

export default function Dashboard() {
  const [leaderboard, setLeaderboard] = useState<PlayerStats[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [recentGames, setRecentGames] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [leaderboardRes, sessionsRes, playersRes] = await Promise.all([
          fetch('/api/stats/leaderboard/overall?limit=10'),
          fetch('/api/sessions?limit=5'),
          fetch('/api/players'),
        ]);

        const leaderboardData = await leaderboardRes.json();
        const sessionsData = await sessionsRes.json();
        const playersData = await playersRes.json();

        setLeaderboard(leaderboardData);
        setRecentGames(sessionsData);
        setPlayers(playersData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Helper function to get player photo by name
  const getPlayerPhoto = (playerName: string): string => {
    const player = players.find(p => p.name === playerName);
    return player?.photoUrl || '/player-placeholder.svg';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 animate-fadeIn">Dashboard</h1>

          {/* Player Awards */}
          <PlayerAwards />

          {/* Game Champions */}
          <BestPlayerPerGame />

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
              <p className="mt-2 text-gray-700 dark:text-gray-300">Loading...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Leaderboard with Monthly View */}
              <MonthlyLeaderboard
                overallData={leaderboard.map(p => ({
                  _id: p._id,
                  playerName: p.playerName,
                  playerPhoto: getPlayerPhoto(p.playerName),
                  totalGames: p.overall.totalGames,
                  totalPoints: p.overall.totalPoints,
                  wins: p.overall.wins,
                  winRate: p.overall.winRate,
                }))}
                players={players}
              />

              {/* Recent Games */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 card-hover animate-fadeInUp animate-delay-200">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Games</h2>
                {recentGames.length === 0 ? (
                  <p className="text-gray-700 dark:text-gray-300 text-center py-8">No games played yet.</p>
                ) : (
                  <div className="space-y-4">
                    {recentGames.map((session, idx) => (
                      <div key={session._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 hover:shadow-md hover:scale-[1.02] animate-fadeInUp" style={{animationDelay: `${0.1 * idx}s`}}>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{session.gameName}</h3>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {new Date(session.playedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                          {session.results.slice(0, 3).map((result, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span>
                                {idx === 0 && '🥇 '}
                                {idx === 1 && '🥈 '}
                                {idx === 2 && '🥉 '}
                                {result.playerName}
                              </span>
                              <span className="font-medium">{result.pointsEarned} pts</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeIn">
            <Link
              href="/record"
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-lg text-center button-hover shadow-lg"
            >
              Record New Game
            </Link>
            <Link
              href="/players"
              className="bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-semibold py-4 px-6 rounded-lg text-center button-hover shadow-lg"
            >
              Manage Players
            </Link>
            <Link
              href="/history"
              className="bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-semibold py-4 px-6 rounded-lg text-center button-hover shadow-lg"
            >
              View History
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
