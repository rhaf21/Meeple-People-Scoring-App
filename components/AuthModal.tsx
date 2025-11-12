'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/contexts/AuthContext';
import { api } from '@/lib/api/client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerIdForClaim?: string; // If claiming a specific profile
  playerNameForClaim?: string; // Pre-filled player name
}

type Step = 'choose-action' | 'select-player' | 'email' | 'otp' | 'success';
type AuthMode = 'login' | 'claim';

interface Player {
  _id: string;
  name: string;
  photoUrl?: string;
  profileClaimed: boolean;
}

export default function AuthModal({ isOpen, onClose, playerIdForClaim, playerNameForClaim }: AuthModalProps) {
  const { login } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [step, setStep] = useState<Step>(playerIdForClaim ? 'email' : 'choose-action');
  const [email, setEmail] = useState('');
  const [otp, setOTP] = useState('');
  const [playerId, setPlayerId] = useState(playerIdForClaim || '');
  const [selectedPlayerName, setSelectedPlayerName] = useState(playerNameForClaim || '');
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOTP, setDevOTP] = useState(''); // For development

  // Fetch players when modal opens (only for claim flow)
  useEffect(() => {
    if (isOpen && authMode === 'claim' && step === 'select-player') {
      fetchPlayers();
    }
  }, [isOpen, authMode, step]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  const fetchPlayers = async () => {
    try {
      const data: any = await api.getPlayers();
      // Only show active, unclaimed profiles for claiming
      const unclaimedPlayers = data.filter((p: Player) => p.profileClaimed === false);
      setPlayers(unclaimedPlayers);
    } catch (err) {
      console.error('Error fetching players:', err);
    }
  };

  const filteredPlayers = players.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectPlayer = (player: Player) => {
    setPlayerId(player._id);
    setSelectedPlayerName(player.name);
    setStep('email');
  };

  const startLoginFlow = () => {
    setAuthMode('login');
    setStep('email');
    setPlayerId(''); // Clear playerId for login flow
  };

  const startClaimFlow = () => {
    setAuthMode('claim');
    setStep('select-player');
  };

  if (!isOpen) return null;

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // For login mode, playerId will be empty - backend will find by email
      const response: any = await api.sendOTP(email, playerId);

      // In development, show the OTP
      if (response.dev_otp) {
        setDevOTP(response.dev_otp);
      }

      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response: any = await api.verifyOTP(email, playerId, otp);

      login(response.token, response.player);
      setStep('success');

      setTimeout(() => {
        onClose();
        // Reset form
        setStep(playerIdForClaim ? 'email' : 'choose-action');
        setAuthMode('login');
        setEmail('');
        setOTP('');
        setPlayerId('');
        setDevOTP('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      // Reset form
      setTimeout(() => {
        setStep(playerIdForClaim ? 'email' : 'choose-action');
        setAuthMode('login');
        setEmail('');
        setOTP('');
        setError('');
        setDevOTP('');
        setSearchQuery('');
        if (!playerIdForClaim) {
          setPlayerId('');
          setSelectedPlayerName('');
        }
      }, 300);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-white/30 dark:bg-gray-900/30 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 animate-fadeInUp">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl text-gray-900 dark:text-gray-100">
            {step === 'choose-action' && 'Welcome'}
            {step === 'select-player' && 'Select Your Profile'}
            {step === 'email' && (authMode === 'login' ? 'Login' : (playerIdForClaim ? 'Claim Profile' : `Claim as ${selectedPlayerName}`))}
            {step === 'otp' && 'Enter OTP'}
            {step === 'success' && 'Success!'}
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Step 0: Choose Action (Login or Claim) */}
          {step === 'choose-action' && (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                Choose how you'd like to continue
              </p>

              <button
                onClick={startLoginFlow}
                className="w-full flex items-center justify-center px-6 py-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Login with Email
              </button>

              <button
                onClick={startClaimFlow}
                className="w-full flex items-center justify-center px-6 py-4 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Claim a Profile
              </button>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                First time? Claim your profile to get started.<br/>
                Already have an account? Login with your email.
              </p>
            </div>
          )}

          {/* Step 1: Select Player (Claim Flow Only) */}
          {step === 'select-player' && (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Select your player profile to claim it with your email
              </p>

              {/* Search Input */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search players..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />

              {/* Player List */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredPlayers.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    {searchQuery ? 'No players found' : 'No unclaimed profiles available'}
                  </p>
                ) : (
                  filteredPlayers.map((player) => (
                    <button
                      key={player._id}
                      onClick={() => selectPlayer(player)}
                      className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                        {player.photoUrl ? (
                          <Image
                            src={player.photoUrl}
                            alt={player.name}
                            width={48}
                            height={48}
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold text-lg">
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{player.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Click to claim</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Step 2: Email */}
          {step === 'email' && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              {authMode === 'claim' && selectedPlayerName && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Claiming profile for: <span className="font-bold">{selectedPlayerName}</span>
                  </p>
                </div>
              )}

              {authMode === 'login' && (
                <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Enter the email address you used to claim your profile
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  disabled={loading}
                  autoFocus
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  We'll send a 6-digit verification code to this email
                </p>
              </div>

              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                {authMode === 'claim' && !playerIdForClaim && (
                  <button
                    type="button"
                    onClick={() => { setStep('select-player'); setError(''); }}
                    disabled={loading}
                    className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Back
                  </button>
                )}
                {authMode === 'login' && !playerIdForClaim && (
                  <button
                    type="button"
                    onClick={() => { setStep('choose-action'); setError(''); }}
                    disabled={loading}
                    className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Back
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className={`${(authMode === 'claim' && !playerIdForClaim) || (authMode === 'login' && !playerIdForClaim) ? 'flex-1' : 'w-full'} bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-gray-600 dark:text-gray-400">
                  We've sent a 6-digit code to
                </p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{email}</p>
              </div>

              {devOTP && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 p-3 rounded text-center">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">
                    Development Mode - Your OTP: <span className="text-2xl font-bold">{devOTP}</span>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 text-center text-2xl font-bold tracking-widest border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  disabled={loading}
                  autoFocus
                />
              </div>

              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setStep('email'); setError(''); }}
                  disabled={loading}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </form>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4 animate-bounce">✅</div>
              <h3 className="text-2xl text-gray-900 dark:text-gray-100 mb-2">
                Welcome!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {authMode === 'claim' ? "You've successfully claimed your profile" : "You've successfully logged in"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
