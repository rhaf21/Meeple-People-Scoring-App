'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import UserMenu from './UserMenu';
import AuthModal from './AuthModal';

export default function Navigation() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [upcomingGameNightsCount, setUpcomingGameNightsCount] = useState(0);
  const pathname = usePathname();
  const { user, loading, isAdmin } = useAuth();

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    console.log('Saved theme:', savedTheme);
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Fetch upcoming game nights count
  useEffect(() => {
    fetchUpcomingGameNights();
  }, [user]);

  const fetchUpcomingGameNights = async () => {
    try {
      const response = await fetch('/api/game-nights');
      const data = await response.json();

      if (Array.isArray(data)) {
        const now = new Date();
        const upcoming = data.filter((gn: any) => {
          const isFuture = new Date(gn.scheduledDate) >= now;
          const notCancelled = gn.status !== 'cancelled';

          // Only count if user hasn't responded yet
          const hasNotResponded = user
            ? !gn.attendees.some((att: any) => att.playerId === user.id)
            : true; // Show all if not logged in

          return isFuture && notCancelled && hasNotResponded;
        });
        setUpcomingGameNightsCount(upcoming.length);
      }
    } catch (error) {
      console.error('Failed to fetch game nights:', error);
    }
  };

  const toggleDarkMode = () => {
    console.log('Toggle dark mode clicked, current mode:', isDarkMode);
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);

    if (newMode) {
      console.log('Enabling dark mode');
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      console.log('Disabling dark mode');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    console.log('HTML classes after toggle:', document.documentElement.className);
  };

  const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/players', label: 'Players' },
    { href: '/games', label: 'Games' },
    { href: '/game-nights', label: 'Game Nights' },
    { href: '/wheel', label: 'Wheel' },
    { href: '/history', label: 'History' },
  ];

  const isActive = (href: string) => {
    return pathname === href;
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors relative ${
                  isActive(item.href)
                    ? 'border-blue-500 text-gray-900 dark:text-gray-100'
                    : 'border-transparent text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {item.label}
                {item.href === '/game-nights' && upcomingGameNightsCount > 0 && !pathname.startsWith('/game-nights') && (
                  <span className="ml-1.5 inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold leading-none text-white bg-green-600 dark:bg-green-500 rounded-full animate-fast-pulse-glow">
                    {upcomingGameNightsCount}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Mobile: Hamburger */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Right side: Record Game CTA + Auth + Theme Toggle */}
          <div className="flex items-center space-x-3">
            {/* Record Game CTA - Always visible */}
            <Link
              href="/record"
              className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                isActive('/record')
                  ? 'bg-blue-700 dark:bg-blue-600 text-white'
                  : 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 hover:scale-105 active:scale-95'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">Record Game</span>
              <span className="sm:hidden">Record</span>
            </Link>

            {/* Auth UI */}
            {!loading && (
              user ? (
                <UserMenu />
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Login</span>
                </button>
              )
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {item.label}
                {item.href === '/game-nights' && upcomingGameNightsCount > 0 && !pathname.startsWith('/game-nights') && (
                  <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold leading-none text-white bg-green-600 dark:bg-green-500 rounded-full animate-fast-pulse-glow">
                    {upcomingGameNightsCount}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </nav>
  );
}
