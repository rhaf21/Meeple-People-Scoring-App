'use client';

import { useState } from 'react';
import ImageUpload from './ImageUpload';

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayerAdded: (playerId: string) => void;
}

export default function AddPlayerModal({ isOpen, onClose, onPlayerAdded }: AddPlayerModalProps) {
  const [playerName, setPlayerName] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [photoPublicId, setPhotoPublicId] = useState<string | undefined>(undefined);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: playerName,
          photoUrl,
          photoPublicId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to add player');
        return;
      }

      // Reset form
      setPlayerName('');
      setPhotoUrl(undefined);
      setPhotoPublicId(undefined);
      setError('');

      // Notify parent with new player ID
      onPlayerAdded(data._id);
      onClose();
    } catch (error) {
      setError('Failed to add player');
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    if (!saving) {
      setPlayerName('');
      setPhotoUrl(undefined);
      setPhotoPublicId(undefined);
      setError('');
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Add Player
        </h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Player Photo (Optional)
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
            autoFocus
          />
          {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
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
  );
}
