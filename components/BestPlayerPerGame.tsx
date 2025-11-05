'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

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
  bestPlayer: BestPlayerData;
}

export default function BestPlayerPerGame() {
  const [champions, setChampions] = useState<GameChampion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChampions() {
      try {
        const res = await fetch('/api/stats/best-per-game');
        const data = await res.json();
        setChampions(data);
      } catch (error) {
        console.error('Error fetching game champions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchChampions();
  }, []);

  if (loading) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl text-gray-900 dark:text-gray-100 mb-4">Game Champions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 animate-pulse">
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (champions.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl text-gray-900 dark:text-gray-100 mb-4">Game Champions</h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Play some games to see champions emerge! 🏆
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 animate-fadeIn">
      <h2 className="text-2xl text-gray-900 dark:text-gray-100 mb-4">Game Champions</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {champions.map((champion, idx) => (
          <div
            key={champion.gameId}
            className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all duration-300 overflow-hidden card-hover animate-fadeInUp aspect-square flex flex-col"
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            {/* Game Image */}
            <div className="relative flex-1 bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700">
              <Image
                src={champion.gameImage || '/game-placeholder.svg'}
                alt={champion.gameName}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-2 left-3">
                <h3 className="text-white text-lg drop-shadow-lg">
                  {champion.gameName}
                </h3>
              </div>
              <div className="absolute top-2 right-2 bg-yellow-400 dark:bg-yellow-500 rounded-full p-2 shadow-lg">
                <span className="text-xl">👑</span>
              </div>
            </div>

            {/* Best Player Info */}
            <div className="p-3">
              <div className="flex items-center space-x-2">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0 ring-2 ring-yellow-400 dark:ring-yellow-500">
                  <Image
                    src={champion.bestPlayer.playerPhoto || '/player-placeholder.svg'}
                    alt={champion.bestPlayer.playerName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {champion.bestPlayer.playerName}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {champion.bestPlayer.totalPoints} pts
                    </span>
                    <span>•</span>
                    <span className="truncate">{champion.bestPlayer.totalGames} games</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
