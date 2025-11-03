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
                      <tr key={game._id}>
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
                            onClick={() => openEditModal(game)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleActive(game)}
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

      {/* Modal */}
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
    </div>
  );
}
