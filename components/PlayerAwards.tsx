'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface PlayerAward {
  playerId: string;
  playerName: string;
  playerPhoto?: string;
  totalPoints: number;
  gamesPlayed: number;
}

interface AwardsData {
  playerOfWeek: PlayerAward[] | null;
  playerOfMonth: PlayerAward[] | null;
}

export default function PlayerAwards() {
  const [awards, setAwards] = useState<AwardsData>({ playerOfWeek: null, playerOfMonth: null });
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    async function fetchAwards() {
      try {
        const res = await fetch('/api/stats/awards');
        const data = await res.json();
        setAwards(data);

        // Show confetti if there's a player of the week
        if (data.playerOfWeek && data.playerOfWeek.length > 0) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }
      } catch (error) {
        console.error('Error fetching awards:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAwards();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!awards.playerOfWeek && !awards.playerOfMonth) {
    return null;
  }

  return (
    <>
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'][Math.floor(Math.random() * 5)],
              }}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Player of the Week - EMPHASIZED */}
        {awards.playerOfWeek && awards.playerOfWeek.length > 0 && (
          <div className="relative bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 dark:from-yellow-500 dark:via-yellow-600 dark:to-yellow-700 rounded-xl shadow-2xl p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-3xl animate-fadeInUp overflow-hidden">
            {/* Sparkle effects */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-white drop-shadow-lg flex items-center">
                  <span className="text-3xl mr-2 animate-bounce">🏆</span>
                  Player of the Week
                </h3>
                <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                  NEW!
                </span>
              </div>

              <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-300 rounded-full blur-md animate-pulse"></div>
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-xl">
                    <Image
                      src={awards.playerOfWeek[0].playerPhoto || '/player-placeholder.svg'}
                      alt={awards.playerOfWeek[0].playerName}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

                <div className="flex-1">
                  <p className="text-2xl font-bold text-white drop-shadow-md">{awards.playerOfWeek[0].playerName}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1">
                      <p className="text-sm text-white/80">Points</p>
                      <p className="text-xl font-bold text-white">{awards.playerOfWeek[0].totalPoints}</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1">
                      <p className="text-sm text-white/80">Games</p>
                      <p className="text-xl font-bold text-white">{awards.playerOfWeek[0].gamesPlayed}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2nd and 3rd place */}
              {awards.playerOfWeek.length > 1 && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {/* 2nd place */}
                  {awards.playerOfWeek[1] && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">🥈</span>
                        <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/50">
                          <Image
                            src={awards.playerOfWeek[1].playerPhoto || '/player-placeholder.svg'}
                            alt={awards.playerOfWeek[1].playerName}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{awards.playerOfWeek[1].playerName}</p>
                          <p className="text-xs text-white/80">{awards.playerOfWeek[1].totalPoints} pts</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3rd place */}
                  {awards.playerOfWeek[2] && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">🥉</span>
                        <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/50">
                          <Image
                            src={awards.playerOfWeek[2].playerPhoto || '/player-placeholder.svg'}
                            alt={awards.playerOfWeek[2].playerName}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{awards.playerOfWeek[2].playerName}</p>
                          <p className="text-xs text-white/80">{awards.playerOfWeek[2].totalPoints} pts</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Player of the Month */}
        {awards.playerOfMonth && awards.playerOfMonth.length > 0 && (
          <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 dark:from-purple-600 dark:via-purple-700 dark:to-indigo-700 rounded-xl shadow-xl p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white drop-shadow-lg flex items-center">
                <span className="text-2xl mr-2">🥇</span>
                Player of the Month
              </h3>
            </div>

            <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-3 border-white shadow-lg">
                <Image
                  src={awards.playerOfMonth[0].playerPhoto || '/player-placeholder.svg'}
                  alt={awards.playerOfMonth[0].playerName}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex-1">
                <p className="text-xl font-bold text-white drop-shadow-md">{awards.playerOfMonth[0].playerName}</p>
                <div className="flex items-center space-x-3 mt-2">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1">
                    <p className="text-xs text-white/80">Points</p>
                    <p className="text-lg font-bold text-white">{awards.playerOfMonth[0].totalPoints}</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1">
                    <p className="text-xs text-white/80">Games</p>
                    <p className="text-lg font-bold text-white">{awards.playerOfMonth[0].gamesPlayed}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2nd and 3rd place */}
            {awards.playerOfMonth.length > 1 && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                {/* 2nd place */}
                {awards.playerOfMonth[1] && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">🥈</span>
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/50">
                        <Image
                          src={awards.playerOfMonth[1].playerPhoto || '/player-placeholder.svg'}
                          alt={awards.playerOfMonth[1].playerName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{awards.playerOfMonth[1].playerName}</p>
                        <p className="text-xs text-white/80">{awards.playerOfMonth[1].totalPoints} pts</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3rd place */}
                {awards.playerOfMonth[2] && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">🥉</span>
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/50">
                        <Image
                          src={awards.playerOfMonth[2].playerPhoto || '/player-placeholder.svg'}
                          alt={awards.playerOfMonth[2].playerName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{awards.playerOfMonth[2].playerName}</p>
                        <p className="text-xs text-white/80">{awards.playerOfMonth[2].totalPoints} pts</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
