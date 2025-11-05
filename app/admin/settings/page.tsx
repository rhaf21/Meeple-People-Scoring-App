'use client';

export default function AdminSettings() {
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl text-gray-900 dark:text-gray-100">
          Settings
        </h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
          System configuration and preferences
        </p>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sm:p-12 text-center border border-gray-200 dark:border-gray-700">
        <svg
          className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 dark:text-gray-500 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <h2 className="text-xl sm:text-2xl text-gray-900 dark:text-gray-100 mb-2">
          Coming Soon
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
          System settings and configuration options will be available here in a future update.
        </p>

        {/* Placeholder Settings Preview */}
        <div className="mt-6 sm:mt-8 text-left max-w-md mx-auto">
          <h3 className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-4">
            Planned Features:
          </h3>
          <ul className="space-y-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Email notification preferences
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Default game scoring settings
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Data backup and export
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              System maintenance tools
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Activity logs and audit trail
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
