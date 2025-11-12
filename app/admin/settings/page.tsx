'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/contexts/AuthContext';

interface SystemSettings {
  _id?: string;
  logoUrl?: string;
  logoPublicId?: string;
  faviconUrl?: string;
  faviconPublicId?: string;
  siteTitle: string;
  primaryColor: string;
}

export default function AdminSettings() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<SystemSettings>({
    siteTitle: 'Farty Meople Scoring App',
    primaryColor: '#2563eb',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      showMessage('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'logo');

    try {
      const response = await fetch('/api/admin/settings/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setSettings(data.settings);
        showMessage('success', 'Logo uploaded successfully');
      } else {
        showMessage('error', data.error || 'Failed to upload logo');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      showMessage('error', 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFavicon(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'favicon');

    try {
      const response = await fetch('/api/admin/settings/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setSettings(data.settings);
        showMessage('success', 'Favicon uploaded successfully');
      } else {
        showMessage('error', data.error || 'Failed to upload favicon');
      }
    } catch (error) {
      console.error('Error uploading favicon:', error);
      showMessage('error', 'Failed to upload favicon');
    } finally {
      setUploadingFavicon(false);
      if (faviconInputRef.current) faviconInputRef.current.value = '';
    }
  };

  const handleDeleteLogo = async () => {
    if (!confirm('Are you sure you want to delete the logo?')) return;

    try {
      const response = await fetch('/api/admin/settings/upload?type=logo', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setSettings(data.settings);
        showMessage('success', 'Logo deleted successfully');
      } else {
        showMessage('error', data.error || 'Failed to delete logo');
      }
    } catch (error) {
      console.error('Error deleting logo:', error);
      showMessage('error', 'Failed to delete logo');
    }
  };

  const handleDeleteFavicon = async () => {
    if (!confirm('Are you sure you want to delete the favicon?')) return;

    try {
      const response = await fetch('/api/admin/settings/upload?type=favicon', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setSettings(data.settings);
        showMessage('success', 'Favicon deleted successfully');
      } else {
        showMessage('error', data.error || 'Failed to delete favicon');
      }
    } catch (error) {
      console.error('Error deleting favicon:', error);
      showMessage('error', 'Failed to delete favicon');
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          siteTitle: settings.siteTitle,
          primaryColor: settings.primaryColor,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSettings(data);
        showMessage('success', 'Settings saved successfully');

        // Apply primary color to CSS variable
        document.documentElement.style.setProperty('--color-primary', settings.primaryColor);
      } else {
        showMessage('error', data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showMessage('error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
          <p className="mt-2 text-gray-700 dark:text-gray-300">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl text-gray-900 dark:text-gray-100">
          Branding & Settings
        </h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Customize your app's logo, favicon, title, and brand colors
        </p>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Logo Upload Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg text-gray-900 dark:text-gray-100 mb-4">Logo</h2>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="flex-shrink-0">
              {settings.logoUrl ? (
                <div className="relative">
                  <Image
                    src={settings.logoUrl}
                    alt="Logo Preview"
                    width={200}
                    height={60}
                    className="h-16 w-auto border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700"
                  />
                </div>
              ) : (
                <div className="w-48 h-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center justify-center text-gray-400 dark:text-gray-500">
                  No logo uploaded
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Upload your logo (PNG, JPG, WebP, max 5MB). Recommended height: 48-60px
              </p>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 cursor-pointer transition-colors">
                  {uploadingLogo ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Upload Logo
                    </>
                  )}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="hidden"
                  />
                </label>
                {settings.logoUrl && (
                  <button
                    onClick={handleDeleteLogo}
                    className="px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Favicon Upload Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg text-gray-900 dark:text-gray-100 mb-4">Favicon</h2>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="flex-shrink-0">
              {settings.faviconUrl ? (
                <div className="relative">
                  <Image
                    src={settings.faviconUrl}
                    alt="Favicon Preview"
                    width={32}
                    height={32}
                    className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center justify-center text-xs text-gray-400 dark:text-gray-500">
                  ?
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Upload your favicon (PNG, ICO, max 5MB). Will be resized to 32x32px
              </p>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 cursor-pointer transition-colors">
                  {uploadingFavicon ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Upload Favicon
                    </>
                  )}
                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/png,image/x-icon,image/vnd.microsoft.icon"
                    onChange={handleFaviconUpload}
                    disabled={uploadingFavicon}
                    className="hidden"
                  />
                </label>
                {settings.faviconUrl && (
                  <button
                    onClick={handleDeleteFavicon}
                    className="px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Site Title Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg text-gray-900 dark:text-gray-100 mb-4">Site Title</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            This appears in browser tabs and search results
          </p>
          <input
            type="text"
            value={settings.siteTitle}
            onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter site title"
          />
        </div>

        {/* Primary Color Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg text-gray-900 dark:text-gray-100 mb-4">Primary Brand Color</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Used for buttons, links, and accents throughout the app
          </p>
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={settings.primaryColor}
              onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
              className="h-12 w-24 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
            />
            <input
              type="text"
              value={settings.primaryColor}
              onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
              pattern="^#[0-9A-Fa-f]{6}$"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              placeholder="#2563eb"
            />
            <div
              className="h-12 w-12 rounded border border-gray-300 dark:border-gray-600"
              style={{ backgroundColor: settings.primaryColor }}
            ></div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
