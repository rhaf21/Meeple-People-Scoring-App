'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Dashboard</h1>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
              <p className="mt-2 text-gray-700 dark:text-gray-300">Loading...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Overall Leaderboard */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Overall Leaderboard</h2>
                {leaderboard.length === 0 ? (
                  <p className="text-gray-700 dark:text-gray-300 text-center py-8">No stats available yet. Play some games!</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead>
                        <tr>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Rank</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Player</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Points</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Games</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Wins</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {leaderboard.map((player, index) => (
                          <tr key={player._id} className={index === 0 ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}>
                            <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                              {index === 0 && '🥇'}
                              {index === 1 && '🥈'}
                              {index === 2 && '🥉'}
                              {index > 2 && `#${index + 1}`}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-3">
                                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                                  <Image
                                    src={getPlayerPhoto(player.playerName)}
                                    alt={player.playerName}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {player.playerName}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-gray-100 font-semibold">{player.overall.totalPoints}</td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">{player.overall.totalGames}</td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">{player.overall.wins}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Recent Games */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Games</h2>
                {recentGames.length === 0 ? (
                  <p className="text-gray-700 dark:text-gray-300 text-center py-8">No games played yet.</p>
                ) : (
                  <div className="space-y-4">
                    {recentGames.map((session) => (
                      <div key={session._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
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
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/record"
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-lg text-center transition-colors"
            >
              Record New Game
            </Link>
            <Link
              href="/players"
              className="bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-semibold py-4 px-6 rounded-lg text-center transition-colors"
            >
              Manage Players
            </Link>
            <Link
              href="/history"
              className="bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-semibold py-4 px-6 rounded-lg text-center transition-colors"
            >
              View History
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
