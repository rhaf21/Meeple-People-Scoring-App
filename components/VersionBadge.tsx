'use client';

import Link from 'next/link';

export default function VersionBadge() {
  const version = 'v1.2.1';

  return (
    <Link
      href="/changelog"
      className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded border border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500"
      title="View changelog"
    >
      <svg
        className="w-3 h-3 mr-1"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      {version}
    </Link>
  );
}
