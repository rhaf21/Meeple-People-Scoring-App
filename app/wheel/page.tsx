'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import WheelOfGames from '@/components/WheelOfGames';

interface Game {
  _id: string;
  name: string;
  imageUrl?: string;
  scoringMode: string;
  pointsPerPlayer: number;
  isActive: boolean;
}

export default function WheelPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [includedGameIds, setIncludedGameIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [autoRemoveWinner, setAutoRemoveWinner] = useState(false);

  useEffect(() => {
    fetchGames();
  }, []);

  async function fetchGames() {
    try {
      const res = await fetch('/api/games?activeOnly=true');
      const data = await res.json();
      setGames(data);

      // By default, include all games
      const allIds = new Set<string>(data.map((g: Game) => g._id));
      setIncludedGameIds(allIds);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggleGame(gameId: string) {
    const newSet = new Set(includedGameIds);
    if (newSet.has(gameId)) {
      newSet.delete(gameId);
    } else {
      newSet.add(gameId);
    }
    setIncludedGameIds(newSet);
  }

  function includeAll() {
    const allIds = new Set<string>(games.map(g => g._id));
    setIncludedGameIds(allIds);
  }

  function excludeAll() {
    setIncludedGameIds(new Set<string>());
  }

  function handleSpinComplete(winner: Game) {
    if (autoRemoveWinner) {
      const newSet = new Set(includedGameIds);
      newSet.delete(winner._id);
      setIncludedGameIds(newSet);
    }
  }

  const includedGames = games.filter(g => includedGameIds.has(g._id));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 animate-fadeIn">
            Wheel of Games 🎡
          </h1>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
              <p className="mt-2 text-gray-700 dark:text-gray-300">Loading games...</p>
            </div>
          ) : games.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <p className="text-gray-700 dark:text-gray-300">
                No games available. Add some games first!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Game Selection Panel */}
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 card-hover animate-fadeInUp">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Select Games
                    </h2>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {includedGameIds.size} selected
                    </span>
                  </div>

                  <div className="flex space-x-2 mb-4">
                    <button
                      onClick={includeAll}
                      className="flex-1 px-3 py-2 text-sm bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
                    >
                      Include All
                    </button>
                    <button
                      onClick={excludeAll}
                      className="flex-1 px-3 py-2 text-sm bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
                    >
                      Exclude All
                    </button>
                  </div>

                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={autoRemoveWinner}
                        onChange={(e) => setAutoRemoveWinner(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Auto-remove winner after spin
                      </span>
                    </label>
                  </div>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {games.map((game) => {
                      const isIncluded = includedGameIds.has(game._id);
                      return (
                        <div
                          key={game._id}
                          className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                            isIncluded
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              isIncluded
                                ? 'text-gray-900 dark:text-gray-100'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {isIncluded && '✓ '}{game.name}
                            </p>
                          </div>
                          <button
                            onClick={() => toggleGame(game._id)}
                            className={`ml-3 px-3 py-1 text-xs font-medium rounded transition-colors ${
                              isIncluded
                                ? 'bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400'
                                : 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400'
                            }`}
                          >
                            {isIncluded ? 'Exclude' : 'Include'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Wheel Panel */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 card-hover animate-fadeInUp animate-delay-100 flex items-center justify-center min-h-[600px]">
                  {includedGames.length === 0 ? (
                    <div className="text-center">
                      <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
                        No games selected
                      </p>
                      <p className="text-gray-500 dark:text-gray-500 text-sm">
                        Include at least 2 games to spin the wheel
                      </p>
                    </div>
                  ) : (
                    <WheelOfGames games={includedGames} onSpinComplete={handleSpinComplete} />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
