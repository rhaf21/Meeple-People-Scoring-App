'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean; // If true, requires admin role. If false, just requires login.
}

export default function ProtectedRoute({ children, requireAdmin = true }: ProtectedRouteProps) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in - redirect to home
        router.push('/');
      } else if (requireAdmin && !isAdmin) {
        // Logged in but not admin - redirect to home
        router.push('/');
      }
    }
  }, [user, loading, isAdmin, requireAdmin, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <p className="mt-4 text-gray-700 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // If not logged in or not authorized, don't render children (redirect will happen in useEffect)
  if (!user || (requireAdmin && !isAdmin)) {
    return null;
  }

  // User is authorized, render children
  return <>{children}</>;
}
