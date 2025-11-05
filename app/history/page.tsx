'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

interface Player {
  _id: string;
  name: string;
  photoUrl?: string;
  isActive: boolean;
}

interface GameResult {
  playerId: string;
  playerName: string;
  rank: number;
  score?: number;
  pointsEarned: number;
}

interface GameSession {
  _id: string;
  gameName: string;
  scoringMode: string;
  playerCount: number;
  playedAt: string;
  results: GameResult[];
  totalPointsPool: number;
}

export default function HistoryPage() {
  const { isAdmin } = useAuth();
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [sessionsRes, playersRes] = await Promise.all([
        fetch('/api/sessions?limit=100'),
        fetch('/api/players'),
      ]);
      const sessionsData = await sessionsRes.json();
      const playersData = await playersRes.json();
      setSessions(sessionsData);
      setPlayers(playersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Helper function to get player photo by name
  const getPlayerPhoto = (playerName: string): string => {
    const player = players.find(p => p.name === playerName);
    return player?.photoUrl || '/player-placeholder.svg';
  }

  async function handleDelete(sessionId: string) {
    if (!confirm('Are you sure you want to delete this game session? This will also recalculate player stats.')) {
      return;
    }

    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }

  function exportToCSV() {
    const headers = ['Date', 'Game', 'Scoring Mode', 'Players', 'Winner', 'Points Pool'];
    const rows = sessions.map((session) => {
      const winner = session.results.find((r) => r.rank === 1);
      return [
        new Date(session.playedAt).toLocaleDateString(),
        session.gameName,
        session.scoringMode,
        session.playerCount.toString(),
        winner?.playerName || 'N/A',
        session.totalPointsPool.toString(),
      ];
    });

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportToJSON() {
    const jsonContent = JSON.stringify(sessions, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-history-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleExpanded(sessionId: string) {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h1 className="text-3xl text-gray-900 dark:text-gray-100">Game History</h1>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
              >
                Export CSV
              </button>
              <button
                onClick={exportToJSON}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
              >
                Export JSON
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <p className="text-gray-700 dark:text-gray-300 mb-4">No games recorded yet.</p>
              <a
                href="/record"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
              >
                Record Your First Game
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session._id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 flex-wrap gap-2">
                          <h3 className="text-lg text-gray-900 dark:text-gray-100">{session.gameName}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            session.scoringMode === 'pointing'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                          }`}>
                            {session.scoringMode === 'pointing' ? 'Pointing' : 'Winner Takes All'}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                          <span>{new Date(session.playedAt).toLocaleDateString()} at {new Date(session.playedAt).toLocaleTimeString()}</span>
                          <span>{session.playerCount} players</span>
                          <span>{session.totalPointsPool} points pool</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleExpanded(session._id)}
                          className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                        >
                          {expandedSession === session._id ? 'Hide Details' : 'Show Details'}
                        </button>
                        {/* Admin-only delete button */}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(session._id)}
                            className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Winner Preview */}
                    <div className="mt-3 flex items-center space-x-2 text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Winner:</span>
                      <div className="flex items-center space-x-2">
                        <div className="relative w-6 h-6 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                          <Image
                            src={getPlayerPhoto(session.results.find((r) => r.rank === 1)?.playerName || '')}
                            alt={session.results.find((r) => r.rank === 1)?.playerName || ''}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span className="text-gray-900 dark:text-gray-100">
                          {session.results.find((r) => r.rank === 1)?.playerName || 'N/A'} ({session.results.find((r) => r.rank === 1)?.pointsEarned || 0} pts)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedSession === session._id && (
                    <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-700/50">
                      <h4 className="text-gray-900 dark:text-gray-100 mb-3">Results:</h4>
                      <div className="space-y-2">
                        {session.results
                          .sort((a, b) => a.rank - b.rank)
                          .map((result) => (
                            <div key={result.playerId} className="flex justify-between items-center py-2 px-4 bg-white dark:bg-gray-800 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <span className="font-bold text-gray-700 dark:text-gray-300 w-8">
                                  {result.rank === 1 && '🥇'}
                                  {result.rank === 2 && '🥈'}
                                  {result.rank === 3 && '🥉'}
                                  {result.rank > 3 && `#${result.rank}`}
                                </span>
                                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                                  <Image
                                    src={getPlayerPhoto(result.playerName)}
                                    alt={result.playerName}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <span className="font-medium text-gray-900 dark:text-gray-100">{result.playerName}</span>
                              </div>
                              <div className="flex items-center space-x-4">
                                {result.score !== undefined && (
                                  <span className="text-sm text-gray-600 dark:text-gray-400">Score: {result.score}</span>
                                )}
                                <span className="font-semibold text-blue-600 dark:text-blue-400">{result.pointsEarned} pts</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
