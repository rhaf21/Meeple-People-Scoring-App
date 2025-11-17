'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function ProfileRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user && user.id) {
        // Preserve query parameters (success/error messages from OAuth)
        const queryString = searchParams.toString();
        const destination = queryString
          ? `/players/${user.id}?${queryString}`
          : `/players/${user.id}`;

        router.replace(destination);
      } else {
        // Not logged in, redirect to home
        router.replace('/');
      }
    }
  }, [user, loading, router, searchParams]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Redirecting to your profile...</p>
      </div>
    </div>
  );
}
