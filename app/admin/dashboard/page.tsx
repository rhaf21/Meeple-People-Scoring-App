'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';

interface Stats {
  players: {
    total: number;
    active: number;
    claimed: number;
    admins: number;
  };
  games: {
    total: number;
    active: number;
    mostPlayed: Array<{
      _id: string;
      gameName: string;
      timesPlayed: number;
    }>;
  };
  sessions: {
    total: number;
    recent: any[];
  };
}

export default function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchStats();
    }
  }, [token]);

  async function fetchStats() {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Overview of your board game tracking system
        </p>
      </div>

      {stats && (
        <>
          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Total Players */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Players
                </h3>
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                {stats.players.total}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
                {stats.players.active} active
              </p>
            </div>

            {/* Claimed Profiles */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Claimed Profiles
                </h3>
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                {stats.players.claimed}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
                {stats.players.admins} admins
              </p>
            </div>

            {/* Total Games */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Games
                </h3>
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                {stats.games.total}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
                {stats.games.active} active
              </p>
            </div>

            {/* Game Sessions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Game Sessions
                </h3>
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                {stats.sessions.total}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
                All time
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Link
              href="/admin/users"
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    Manage Users
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                    View and manage user roles
                  </p>
                </div>
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-blue-500 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            <Link
              href="/players"
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    View Players
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                    See all players and stats
                  </p>
                </div>
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-blue-500 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            <Link
              href="/games"
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    Manage Games
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Add or edit games
                  </p>
                </div>
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-blue-500 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>

          {/* Most Played Games */}
          {stats.games.mostPlayed && stats.games.mostPlayed.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-6 sm:mb-8">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-base sm:text-lg text-gray-900 dark:text-gray-100">
                  Most Played Games
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Top 5 games by number of sessions
                </p>
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {stats.games.mostPlayed.map((game, index) => (
                    <div
                      key={game._id}
                      className="flex items-center justify-between py-2 sm:py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 ${
                          index === 0
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                            : index === 1
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            : index === 2
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        }`}>
                          <span className="text-sm sm:text-base font-bold">#{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">
                            {game.gameName}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            Played {game.timesPlayed} {game.timesPlayed === 1 ? 'time' : 'times'}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs sm:text-sm font-semibold">
                          {game.timesPlayed}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recent Sessions */}
          {stats.sessions.recent && stats.sessions.recent.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-base sm:text-lg text-gray-900 dark:text-gray-100">
                  Recent Activity
                </h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {stats.sessions.recent.slice(0, 5).map((session: any) => (
                    <div
                      key={session._id}
                      className="flex items-center justify-between py-2 sm:py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">
                          {session.gameId?.name || 'Unknown Game'}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          {session.results?.length || 0} players •{' '}
                          {new Date(session.playedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Link
                        href="/history"
                        className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline flex-shrink-0"
                      >
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
