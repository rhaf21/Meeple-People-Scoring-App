'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import ImageUpload from '@/components/ImageUpload';
import AuthModal from '@/components/AuthModal';
import RoleBadge from '@/components/RoleBadge';
import { useAuth } from '@/lib/contexts/AuthContext';

interface Player {
  _id: string;
  name: string;
  photoUrl?: string;
  photoPublicId?: string;
  isActive: boolean;
  profileClaimed: boolean;
  role?: 'admin' | 'user' | 'guest';
  createdAt: string;
  lastPlayedAt?: string;
}

export default function PlayersPage() {
  const { isAdmin, token } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [photoPublicId, setPhotoPublicId] = useState<string | undefined>(undefined);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  // Auth modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [claimingPlayerId, setClaimingPlayerId] = useState<string | undefined>(undefined);
  const [claimingPlayerName, setClaimingPlayerName] = useState<string | undefined>(undefined);

  // Permanent delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPlayers();
  }, [activeTab]);

  async function fetchPlayers() {
    try {
      setLoading(true);
      const activeOnly = activeTab === 'active';
      const res = await fetch(`/api/players?activeOnly=${activeOnly}`);
      const data = await res.json();
      setPlayers(data);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingPlayer(null);
    setPlayerName('');
    setPhotoUrl(undefined);
    setPhotoPublicId(undefined);
    setError('');
    setShowModal(true);
  }

  function openEditModal(player: Player) {
    setEditingPlayer(player);
    setPlayerName(player.name);
    setPhotoUrl(player.photoUrl);
    setPhotoPublicId(player.photoPublicId);
    setError('');
    setShowModal(true);
  }

  function handleImageUpload(url: string, publicId: string) {
    setPhotoUrl(url);
    setPhotoPublicId(publicId);
  }

  async function handleSave() {
    if (!playerName.trim()) {
      setError('Player name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const url = editingPlayer ? `/api/players/${editingPlayer._id}` : '/api/players';
      const method = editingPlayer ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: playerName,
          photoUrl,
          photoPublicId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to save player');
        return;
      }

      setShowModal(false);
      fetchPlayers();
    } catch (error) {
      setError('Failed to save player');
    } finally {
      setSaving(false);
    }
  }

  async function handleArchiveRestore(player: Player) {
    const isCurrentlyActive = player.isActive !== false;
    const action = isCurrentlyActive ? 'archive' : 'restore';
    if (!confirm(`Are you sure you want to ${action} ${player.name}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/players/${player._id}`, {
        method: isCurrentlyActive ? 'DELETE' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: isCurrentlyActive ? undefined : JSON.stringify({ isActive: true }),
      });

      if (res.ok) {
        fetchPlayers();
      }
    } catch (error) {
      console.error(`Error ${action}ing player:`, error);
    }
  }

  function openClaimModal(player: Player) {
    setClaimingPlayerId(player._id);
    setClaimingPlayerName(player.name);
    setIsAuthModalOpen(true);
  }

  function handleAuthModalClose() {
    setIsAuthModalOpen(false);
    setClaimingPlayerId(undefined);
    setClaimingPlayerName(undefined);
    // Refresh players to update claimed status
    fetchPlayers();
  }

  function openDeleteModal(player: Player) {
    setDeletingPlayer(player);
    setDeleteConfirmName('');
    setDeleteError('');
    setShowDeleteModal(true);
  }

  async function handlePermanentDelete() {
    if (!deletingPlayer) return;

    if (deleteConfirmName.trim() !== deletingPlayer.name) {
      setDeleteError('Player name does not match. Please type the exact name to confirm.');
      return;
    }

    setDeleting(true);
    setDeleteError('');

    try {
      const res = await fetch(`/api/players/${deletingPlayer._id}?permanent=true`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setDeleteError(data.error || 'Failed to delete player');
        return;
      }

      setShowDeleteModal(false);
      setDeletingPlayer(null);
      setDeleteConfirmName('');
      fetchPlayers();
    } catch (error) {
      setDeleteError('Failed to delete player');
    } finally {
      setDeleting(false);
    }
  }

  // Treat players without isActive field as active (for backward compatibility)
  const filteredPlayers = players.filter((p) =>
    activeTab === 'active' ? (p.isActive !== false) : (p.isActive === false)
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl text-gray-900 dark:text-gray-100">Players</h1>
            {isAdmin && (
              <button
                onClick={openAddModal}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Add Player
              </button>
            )}
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
                onClick={() => setActiveTab('archived')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'archived'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Archived
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Photo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Last Played</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredPlayers.map((player) => (
                      <tr key={player._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                            <Image
                              src={player.photoUrl || '/player-placeholder.svg'}
                              alt={player.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/players/${player._id}`}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                            >
                              {player.name}
                            </Link>
                            {player.role && player.role === 'admin' && <RoleBadge role={player.role} />}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {player.profileClaimed ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Claimed
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                              Unclaimed
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {player.lastPlayedAt ? new Date(player.lastPlayedAt).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {new Date(player.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          {/* Only show Claim Profile in Active tab */}
                          {activeTab === 'active' && !player.profileClaimed && (
                            <button
                              onClick={() => openClaimModal(player)}
                              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 font-semibold"
                            >
                              Claim Profile
                            </button>
                          )}
                          {/* Admin-only actions */}
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleArchiveRestore(player)}
                                className={
                                  player.isActive !== false
                                    ? 'text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300'
                                    : 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300'
                                }
                              >
                                {player.isActive !== false ? 'Archive' : 'Restore'}
                              </button>
                              {/* Show Permanently Delete button only in Archived tab */}
                              {activeTab === 'archived' && (
                                <button
                                  onClick={() => openDeleteModal(player)}
                                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-semibold"
                                >
                                  Permanently Delete
                                </button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredPlayers.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-700 dark:text-gray-300">
                    {activeTab === 'active' ? 'No active players yet. Add your first player!' : 'No archived players.'}
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
            <h2 className="text-xl text-gray-900 dark:text-gray-100 mb-4">
              {editingPlayer ? 'Edit Player' : 'Add Player'}
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Player Photo
              </label>
              <ImageUpload
                currentImageUrl={photoUrl || '/player-placeholder.svg'}
                onUploadComplete={handleImageUpload}
                type="player"
                label="Upload Photo"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Player Name
              </label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="Enter player name"
              />
              {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
            </div>

            <div className="flex justify-end space-x-3">
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

      {/* Auth Modal for Claiming Profiles */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={handleAuthModalClose}
        playerIdForClaim={claimingPlayerId}
        playerNameForClaim={claimingPlayerName}
      />

      {/* Permanent Delete Confirmation Modal */}
      {showDeleteModal && deletingPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl text-red-600 dark:text-red-400 mb-4">
              Permanently Delete Player
            </h2>

            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200 font-semibold mb-2">
                Warning: This action cannot be undone!
              </p>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1 list-disc list-inside">
                <li>The player <strong>{deletingPlayer.name}</strong> will be permanently deleted</li>
                <li>Their profile and statistics will be removed</li>
                <li>Game history will show &quot;[Deleted Player]&quot; instead of their name</li>
                <li>The player name will become available for reuse</li>
              </ul>
            </div>

            <div className="mb-4">
              <label htmlFor="deleteConfirmName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type <strong>{deletingPlayer.name}</strong> to confirm:
              </label>
              <input
                type="text"
                id="deleteConfirmName"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
                placeholder="Type player name"
                disabled={deleting}
              />
              {deleteError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{deleteError}</p>}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePermanentDelete}
                disabled={deleting || deleteConfirmName.trim() !== deletingPlayer.name}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
