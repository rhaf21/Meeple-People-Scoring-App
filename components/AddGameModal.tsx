'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api/client';

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGameAdded: (gameId: string) => void;
}

interface BGGGame {
  id: number;
  name: string;
  yearPublished?: number;
  type: string;
}

interface BGGGameDetails {
  id: number;
  name: string;
  description: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  yearPublished?: number;
  minPlayers?: number;
  maxPlayers?: number;
  playingTime?: number;
  designers: string[];
  categories: string[];
  mechanics: string[];
  bggRating?: number;
  bggAverageWeight?: number;
  bggUrl?: string;
}

type Step = 'search' | 'preview' | 'configure';

export default function AddGameModal({ isOpen, onClose, onGameAdded }: AddGameModalProps) {
  const [step, setStep] = useState<Step>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BGGGame[]>([]);
  const [selectedGame, setSelectedGame] = useState<BGGGameDetails | null>(null);
  const [scoringMode, setScoringMode] = useState<'pointing' | 'winner-takes-all'>('pointing');
  const [pointsPerPlayer, setPointsPerPlayer] = useState(5);
  const [searching, setSearching] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      await handleSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setError('');

    try {
      const results: any = await api.searchBGG(searchQuery);
      setSearchResults(results);
    } catch (err: any) {
      setError(err.message || 'Failed to search BoardGameGeek');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const selectGame = async (game: BGGGame) => {
    setLoadingDetails(true);
    setError('');

    try {
      const details: any = await api.getBGGGame(game.id);
      setSelectedGame(details);
      setStep('preview');
    } catch (err: any) {
      setError(err.message || 'Failed to load game details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSave = async () => {
    if (!selectedGame) return;

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedGame.name,
          scoringMode,
          pointsPerPlayer,
          // BGG data
          bggId: selectedGame.id,
          description: selectedGame.description,
          yearPublished: selectedGame.yearPublished,
          minPlayers: selectedGame.minPlayers,
          maxPlayers: selectedGame.maxPlayers,
          playingTime: selectedGame.playingTime,
          designers: selectedGame.designers,
          categories: selectedGame.categories,
          mechanics: selectedGame.mechanics,
          bggRating: selectedGame.bggRating,
          bggAverageWeight: selectedGame.bggAverageWeight,
          imageUrl: selectedGame.imageUrl,
          thumbnailUrl: selectedGame.thumbnailUrl,
          bggUrl: selectedGame.bggUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to add game');
        return;
      }

      // Reset and close
      handleClose();
      onGameAdded(data._id);
    } catch (error) {
      setError('Failed to add game');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving && !loadingDetails) {
      setStep('search');
      setSearchQuery('');
      setSearchResults([]);
      setSelectedGame(null);
      setScoringMode('pointing');
      setPointsPerPlayer(5);
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {step === 'search' && 'Search BoardGameGeek'}
              {step === 'preview' && 'Game Details'}
              {step === 'configure' && 'Configure Scoring'}
            </h2>
            <button
              onClick={handleClose}
              disabled={saving || loadingDetails}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Step 1: Search */}
          {step === 'search' && (
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for a board game..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Search BoardGameGeek for official game data
                </p>
              </div>

              {searching && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">Searching BoardGameGeek...</p>
                </div>
              )}

              {searchResults.length > 0 && !searching && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Found {searchResults.length} results:
                  </p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {searchResults.map((game) => (
                      <button
                        key={game.id}
                        onClick={() => selectGame(game)}
                        disabled={loadingDetails}
                        className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                      >
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {game.name}
                        </p>
                        {game.yearPublished && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            ({game.yearPublished})
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchQuery && !searching && searchResults.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No games found. Try a different search term.
                </div>
              )}

              {loadingDetails && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">Loading game details...</p>
                </div>
              )}

              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && selectedGame && (
            <div className="space-y-6">
              {/* Game Header */}
              <div className="flex gap-4">
                {selectedGame.imageUrl && (
                  <div className="flex-shrink-0">
                    <Image
                      src={selectedGame.imageUrl}
                      alt={selectedGame.name}
                      width={150}
                      height={150}
                      className="rounded-lg object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {selectedGame.name}
                  </h3>
                  {selectedGame.yearPublished && (
                    <p className="text-gray-600 dark:text-gray-400">({selectedGame.yearPublished})</p>
                  )}
                  {selectedGame.designers.length > 0 && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      By {selectedGame.designers.join(', ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Game Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {selectedGame.minPlayers && selectedGame.maxPlayers && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Players</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {selectedGame.minPlayers}-{selectedGame.maxPlayers}
                    </p>
                  </div>
                )}
                {selectedGame.playingTime && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Time</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {selectedGame.playingTime} min
                    </p>
                  </div>
                )}
                {selectedGame.bggRating && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">BGG Rating</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {selectedGame.bggRating.toFixed(1)}
                    </p>
                  </div>
                )}
                {selectedGame.bggAverageWeight && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Complexity</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {selectedGame.bggAverageWeight.toFixed(1)}/5
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedGame.description && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Description</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-4">
                    {selectedGame.description}
                  </p>
                </div>
              )}

              {/* Configure Scoring */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Configure Scoring</h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Scoring Mode
                    </label>
                    <select
                      value={scoringMode}
                      onChange={(e) => {
                        const mode = e.target.value as 'pointing' | 'winner-takes-all';
                        setScoringMode(mode);
                        setPointsPerPlayer(mode === 'winner-takes-all' ? 3 : 5);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="pointing">Pointing System</option>
                      <option value="winner-takes-all">Winner Takes All</option>
                    </select>
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      {scoringMode === 'pointing'
                        ? '💡 Top 3 players earn points. 1st: 2/3 of pool, 2nd: 2/3 of remainder, 3rd: rest'
                        : '💡 Winner gets all points, others get 0'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Points Per Player
                    </label>
                    <input
                      type="number"
                      value={pointsPerPlayer}
                      onChange={(e) => setPointsPerPlayer(parseInt(e.target.value) || 5)}
                      min="1"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-end space-x-3">
            {step === 'preview' && (
              <>
                <button
                  onClick={() => { setStep('search'); setSelectedGame(null); }}
                  disabled={saving}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg disabled:opacity-50"
                >
                  {saving ? 'Adding Game...' : 'Add Game'}
                </button>
              </>
            )}
            {step === 'search' && (
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
