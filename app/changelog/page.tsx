'use client';

import Link from 'next/link';

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-4"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Changelog
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track all updates, improvements, and bug fixes to Meeple People
          </p>
        </div>

        {/* Version 1.2.0 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Version 1.2.0
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Google Calendar Integration & Email Notifications
              </p>
            </div>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-medium rounded-full">
              Latest
            </span>
          </div>

          {/* New Features */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
              <span className="mr-2">✨</span> New Features
            </h3>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <span className="mr-2 mt-1">•</span>
                <span>Google Calendar integration for game nights with OAuth 2.0 authentication</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1">•</span>
                <span>Two-way RSVP sync between app and Google Calendar (automatic polling every 30 seconds)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1">•</span>
                <span>Email notifications for game night invitations using Resend API</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1">•</span>
                <span>Calendar connection management in player profile page</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1">•</span>
                <span>Automatic calendar event creation when organizer creates game nights</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1">•</span>
                <span>Profile redirect route (/profile) for OAuth callback handling</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1">•</span>
                <span>Game night status filters: Scheduled (default), In Progress, Completed & Cancelled, All Statuses</span>
              </li>
            </ul>
          </div>

          {/* Improvements */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
              <span className="mr-2">🔧</span> Improvements
            </h3>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <span className="mr-2 mt-1">•</span>
                <span>Separated email notifications from calendar integration (emails work independently)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1">•</span>
                <span>Calendar URL now included in invitation emails with "View in Google Calendar" button</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1">•</span>
                <span>Automatic sync for calendar responses (Calendar → App) with 30-second polling</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1">•</span>
                <span>Connected players can sync their RSVPs to calendar (App → Calendar) using their own credentials</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1">•</span>
                <span>Graceful handling for players without Google Calendar connection</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1">•</span>
                <span>Calendar creation reordered to happen before email sending</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1">•</span>
                <span>Added Calendar Integration section to player profile page</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1">•</span>
                <span>Enhanced email templates with HTML formatting and calendar links</span>
              </li>
            </ul>
          </div>

          {/* Bug Fixes */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
              <span className="mr-2">🐛</span> Bug Fixes
            </h3>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <span className="mr-2 mt-1">•</span>
                <span>Fixed GameDefinition schema registration errors (MissingSchemaError)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1">•</span>
                <span>Fixed tree-shaking issues with model imports using <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">void</code> keyword</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1">•</span>
                <span>Corrected RSVP sync to use player credentials instead of organizer's (fixes Google Calendar API errors)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1">•</span>
                <span>Fixed Next.js 16 async params handling in dynamic routes</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1">•</span>
                <span>Updated GameDefinition model to use cache-clearing pattern</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1">•</span>
                <span>Fixed TypeScript errors in stats endpoints with proper type assertions</span>
              </li>
            </ul>
          </div>

          {/* Technical Details */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Technical Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <span className="font-medium">New Files:</span>
                <ul className="mt-1 space-y-1 ml-4">
                  <li>• lib/services/googleCalendarService.ts</li>
                  <li>• lib/services/emailService.ts</li>
                  <li>• lib/utils/encryption.ts</li>
                  <li>• components/GoogleCalendarButton.tsx</li>
                  <li>• app/api/auth/google/*</li>
                  <li>• app/api/game-nights/[id]/sync-rsvp/route.ts</li>
                  <li>• app/profile/page.tsx</li>
                </ul>
              </div>
              <div>
                <span className="font-medium">Modified Files:</span>
                <ul className="mt-1 space-y-1 ml-4">
                  <li>• lib/models/GameNight.ts</li>
                  <li>• lib/models/Player.ts</li>
                  <li>• lib/models/GameDefinition.ts</li>
                  <li>• app/api/game-nights/route.ts</li>
                  <li>• app/game-nights/page.tsx</li>
                  <li>• app/players/[id]/page.tsx</li>
                  <li>• lib/api/client.ts</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Future placeholder */}
        <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>Previous versions will be documented here as the app evolves</p>
        </div>
      </div>
    </div>
  );
}
