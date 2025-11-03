'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface PlayerStats {
  _id: string;
  playerName: string;
  playerPhoto?: string;
  totalGames: number;
  totalPoints: number;
  wins: number;
  winRate: number;
}

interface MonthlyLeaderboardProps {
  overallData: PlayerStats[];
  players: Array<{ _id: string; name: string; photoUrl?: string }>;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

type SortColumn = 'points' | 'games' | 'wins' | 'winRate';
type SortDirection = 'asc' | 'desc';

export default function MonthlyLeaderboard({ overallData, players }: MonthlyLeaderboardProps) {
  const [viewMode, setViewMode] = useState<'overall' | 'monthly'>('overall');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortColumn>('points');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Fetch monthly data when month/year changes
  useEffect(() => {
    if (viewMode === 'monthly') {
      fetchMonthlyData();
    }
  }, [viewMode, selectedMonth, selectedYear]);

  async function fetchMonthlyData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/stats/leaderboard/monthly?month=${selectedMonth}&year=${selectedYear}&limit=10`);
      const data = await res.json();
      setMonthlyData(data);
    } catch (error) {
      console.error('Error fetching monthly leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }

  function goToPreviousMonth() {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  }

  function goToNextMonth() {
    // Don't allow future months
    if (selectedYear === currentYear && selectedMonth === currentMonth) {
      return;
    }

    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  }

  const isNextDisabled = selectedYear === currentYear && selectedMonth === currentMonth;

  // Helper function to get player photo by name
  const getPlayerPhoto = (playerName: string): string => {
    const player = players.find(p => p.name === playerName);
    return player?.photoUrl || '/player-placeholder.svg';
  };

  // Handle column sorting
  function handleSort(column: SortColumn) {
    if (sortBy === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to descending
      setSortBy(column);
      setSortDirection('desc');
    }
  }

  // Get and sort display data
  const displayData = viewMode === 'overall' ? overallData : monthlyData;

  const sortedData = [...displayData].sort((a, b) => {
    let aValue: number;
    let bValue: number;

    switch (sortBy) {
      case 'points':
        aValue = a.totalPoints;
        bValue = b.totalPoints;
        break;
      case 'games':
        aValue = a.totalGames;
        bValue = b.totalGames;
        break;
      case 'wins':
        aValue = a.wins;
        bValue = b.wins;
        break;
      case 'winRate':
        aValue = a.winRate;
        bValue = b.winRate;
        break;
    }

    if (sortDirection === 'asc') {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 card-hover animate-fadeInUp">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Leaderboard</h2>
        <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('overall')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'overall'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Overall
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'monthly'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Month Navigation (only when monthly view) */}
      {viewMode === 'monthly' && (
        <div className="flex items-center justify-between mb-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <span className="text-gray-700 dark:text-gray-300">←</span>
          </button>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
          </span>
          <button
            onClick={goToNextMonth}
            disabled={isNextDisabled}
            className={`p-2 rounded-lg transition-colors ${
              isNextDisabled
                ? 'opacity-30 cursor-not-allowed'
                : 'hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <span className="text-gray-700 dark:text-gray-300">→</span>
          </button>
        </div>
      )}

      {/* Leaderboard Table */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </div>
      ) : displayData.length === 0 ? (
        <p className="text-gray-700 dark:text-gray-300 text-center py-8">
          {viewMode === 'monthly'
            ? `No games played in ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`
            : 'No stats available yet. Play some games!'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Rank</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Player</th>
                <th
                  onClick={() => handleSort('points')}
                  className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                >
                  <span className="inline-flex items-center justify-center gap-1">
                    Points
                    {sortBy === 'points' && (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        {sortDirection === 'asc' ? (
                          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        )}
                      </svg>
                    )}
                  </span>
                </th>
                <th
                  onClick={() => handleSort('games')}
                  className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                >
                  <span className="inline-flex items-center justify-center gap-1">
                    Games
                    {sortBy === 'games' && (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        {sortDirection === 'asc' ? (
                          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        )}
                      </svg>
                    )}
                  </span>
                </th>
                <th
                  onClick={() => handleSort('wins')}
                  className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                >
                  <span className="inline-flex items-center justify-center gap-1">
                    Wins
                    {sortBy === 'wins' && (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        {sortDirection === 'asc' ? (
                          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        )}
                      </svg>
                    )}
                  </span>
                </th>
                <th
                  onClick={() => handleSort('winRate')}
                  className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                >
                  <span className="inline-flex items-center justify-center gap-1">
                    Win Rate
                    {sortBy === 'winRate' && (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        {sortDirection === 'asc' ? (
                          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        )}
                      </svg>
                    )}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedData.map((player, index) => (
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
                          src={player.playerPhoto || getPlayerPhoto(player.playerName)}
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
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-gray-100 font-semibold">{player.totalPoints}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">{player.totalGames}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">{player.wins}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">{(player.winRate * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
