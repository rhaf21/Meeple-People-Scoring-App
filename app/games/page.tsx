'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import ImageUpload from '@/components/ImageUpload';

interface Game {
  _id: string;
  name: string;
  imageUrl?: string;
  imagePublicId?: string;
  scoringMode: 'pointing' | 'winner-takes-all';
  pointsPerPlayer: number;
  isActive: boolean;
  createdAt: string;
  // BGG fields
  description?: string;
  yearPublished?: number;
  minPlayers?: number;
  maxPlayers?: number;
  playingTime?: number;
  minPlaytime?: number;
  maxPlaytime?: number;
  bggRating?: number;
  bggAverageWeight?: number;
  designers?: string[];
  categories?: string[];
  mechanics?: string[];
  bggUrl?: string;
  thumbnailUrl?: string;
}

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [gameName, setGameName] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [imagePublicId, setImagePublicId] = useState<string | undefined>(undefined);
  const [scoringMode, setScoringMode] = useState<'pointing' | 'winner-takes-all'>('pointing');
  const [pointsPerPlayer, setPointsPerPlayer] = useState(5);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'deactivated'>('active');
  const [viewingGame, setViewingGame] = useState<Game | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchGames();
  }, [activeTab]);

  async function fetchGames() {
    try {
      setLoading(true);
      const activeOnly = activeTab === 'active';
      const res = await fetch(`/api/games?activeOnly=${activeOnly}`);
      const data = await res.json();
      setGames(data);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingGame(null);
    setGameName('');
    setImageUrl(undefined);
    setImagePublicId(undefined);
    setScoringMode('pointing');
    setPointsPerPlayer(5);
    setError('');
    setShowModal(true);
  }

  function openEditModal(game: Game) {
    setEditingGame(game);
    setGameName(game.name);
    setImageUrl(game.imageUrl);
    setImagePublicId(game.imagePublicId);
    setScoringMode(game.scoringMode);
    setPointsPerPlayer(game.pointsPerPlayer);
    setError('');
    setShowModal(true);
  }

  function handleImageUpload(url: string, publicId: string) {
    setImageUrl(url);
    setImagePublicId(publicId);
  }

  async function handleSave() {
    if (!gameName.trim()) {
      setError('Game name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const url = editingGame ? `/api/games/${editingGame._id}` : '/api/games';
      const method = editingGame ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: gameName,
          imageUrl,
          imagePublicId,
          scoringMode,
          pointsPerPlayer,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to save game');
        return;
      }

      setShowModal(false);
      fetchGames();
    } catch (error) {
      setError('Failed to save game');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(game: Game) {
    const isCurrentlyActive = game.isActive !== false;
    const action = isCurrentlyActive ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} ${game.name}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/games/${game._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isCurrentlyActive }),
      });

      if (res.ok) {
        fetchGames();
      }
    } catch (error) {
      console.error(`Error ${action}ing game:`, error);
    }
  }

  // Treat games without isActive field as active (for backward compatibility)
  const filteredGames = games.filter((g) =>
    activeTab === 'active' ? (g.isActive !== false) : (g.isActive === false)
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Games</h1>
            <button
              onClick={openAddModal}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Add Game
            </button>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('active')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'active'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setActiveTab('deactivated')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'deactivated'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Deactivated
              </button>
            </nav>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Image</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Scoring Mode</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Points/Player</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredGames.map((game) => (
                      <tr
                        key={game._id}
                        onClick={() => {
                          setViewingGame(game);
                          setShowDetailsModal(true);
                        }}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-200 dark:bg-gray-600">
                            <Image
                              src={game.imageUrl || '/game-placeholder.svg'}
                              alt={game.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{game.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            game.scoringMode === 'pointing'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                          }`}>
                            {game.scoringMode === 'pointing' ? 'Pointing System' : 'Winner Takes All'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">{game.pointsPerPlayer}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(game);
                            }}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleActive(game);
                            }}
                            className={
                              game.isActive !== false
                                ? 'text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300'
                                : 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300'
                            }
                          >
                            {game.isActive !== false ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredGames.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-700 dark:text-gray-300">
                    {activeTab === 'active' ? 'No active games yet. Add your first game!' : 'No deactivated games.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Edit/Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {editingGame ? 'Edit Game' : 'Add Game'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Game Image
                </label>
                <ImageUpload
                  currentImageUrl={imageUrl || '/game-placeholder.svg'}
                  onUploadComplete={handleImageUpload}
                  type="game"
                  label="Upload Image"
                />
              </div>

              <div>
                <label htmlFor="gameName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Game Name
                </label>
                <input
                  type="text"
                  id="gameName"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="Enter game name"
                />
              </div>

              <div>
                <label htmlFor="scoringMode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Scoring Mode
                </label>
                <select
                  id="scoringMode"
                  value={scoringMode}
                  onChange={(e) => {
                    const mode = e.target.value as 'pointing' | 'winner-takes-all';
                    setScoringMode(mode);
                    setPointsPerPlayer(mode === 'winner-takes-all' ? 3 : 5);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                >
                  <option value="pointing">Pointing System</option>
                  <option value="winner-takes-all">Winner Takes All</option>
                </select>
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  {scoringMode === 'pointing'
                    ? '💡 Top 3 players earn points from a shared pool. 1st: 2/3 of pool, 2nd: 2/3 of remainder, 3rd: rest'
                    : '💡 Winner gets all points, others get 0'}
                </p>
              </div>

              <div>
                <label htmlFor="pointsPerPlayer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Points Per Player
                </label>
                <input
                  type="number"
                  id="pointsPerPlayer"
                  value={pointsPerPlayer}
                  onChange={(e) => setPointsPerPlayer(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  min="1"
                />
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  {scoringMode === 'pointing' ? 'Recommended: 5 points' : 'Recommended: 3 points'}
                </p>
              </div>

              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Details Modal */}
      {showDetailsModal && viewingGame && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-start">
              <div className="flex items-start space-x-4">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                  <Image
                    src={viewingGame.imageUrl || '/game-placeholder.svg'}
                    alt={viewingGame.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {viewingGame.name}
                  </h2>
                  {viewingGame.yearPublished && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Published: {viewingGame.yearPublished}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Description */}
              {viewingGame.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Description
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {viewingGame.description.replace(/<[^>]*>/g, '')}
                  </p>
                </div>
              )}

              {/* Game Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {viewingGame.minPlayers && viewingGame.maxPlayers && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Players</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {viewingGame.minPlayers}-{viewingGame.maxPlayers}
                    </p>
                  </div>
                )}

                {viewingGame.playingTime && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Playing Time</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {viewingGame.playingTime} min
                    </p>
                  </div>
                )}

                {viewingGame.bggRating && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">BGG Rating</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {viewingGame.bggRating.toFixed(1)} / 10
                    </p>
                  </div>
                )}

                {viewingGame.bggAverageWeight && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Complexity</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {viewingGame.bggAverageWeight.toFixed(1)} / 5
                    </p>
                  </div>
                )}
              </div>

              {/* Scoring Configuration */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Scoring Configuration
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      viewingGame.scoringMode === 'pointing'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                    }`}>
                      {viewingGame.scoringMode === 'pointing' ? 'Pointing System' : 'Winner Takes All'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Points Per Player</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {viewingGame.pointsPerPlayer}
                    </p>
                  </div>
                </div>
              </div>

              {/* Designers */}
              {viewingGame.designers && viewingGame.designers.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Designers
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {viewingGame.designers.join(', ')}
                  </p>
                </div>
              )}

              {/* Categories */}
              {viewingGame.categories && viewingGame.categories.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Categories
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {viewingGame.categories.map((category, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium rounded-full"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mechanics */}
              {viewingGame.mechanics && viewingGame.mechanics.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Mechanics
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {viewingGame.mechanics.map((mechanic, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-xs font-medium rounded-full"
                      >
                        {mechanic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* BGG Link & Attribution */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                {viewingGame.bggUrl && (
                  <a
                    href={viewingGame.bggUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <span>View on BoardGameGeek</span>
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <a
                    href="https://boardgamegeek.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Powered by BoardGameGeek
                  </a>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500 text-white font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
