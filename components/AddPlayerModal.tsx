'use client';

import { useState, useEffect } from 'react';
import ImageUpload from './ImageUpload';
import { api } from '@/lib/api/client';

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
      const data = await api.createPlayer({
        name: playerName,
        photoUrl,
        photoPublicId,
      });

      // Reset form
      setPlayerName('');
      setPhotoUrl(undefined);
      setPhotoPublicId(undefined);
      setError('');

      // Notify parent with new player ID
      onPlayerAdded((data as any)._id);
      onClose();
    } catch (error: any) {
      setError(error.message || 'Failed to add player');
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

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-white/30 dark:bg-gray-900/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl text-gray-900 dark:text-gray-100 mb-4">
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
