'use client'

import React, { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  HomeIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)

    // In a production environment, you would also send this to an error tracking service
    // like Sentry, LogRocket, or similar
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false,
      })
    }
  }, [error])

  // Determine if this is a network error
  const isNetworkError = error.message.includes('fetch') ||
                        error.message.includes('network') ||
                        error.message.includes('Failed to load')

  // Determine if this is a development error
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-red-100 p-4">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-600" />
          </div>
        </div>

        {/* Main Content */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            We're sorry, but an unexpected error occurred.
          </p>

          {/* Error Details for Development */}
          {isDevelopment && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
              <h3 className="text-sm font-medium text-red-800 mb-2">Error Details (Development)</h3>
              <details className="text-xs text-red-700">
                <summary className="cursor-pointer font-medium mb-2">Click to expand</summary>
                <div className="mt-2 space-y-2">
                  <p><strong>Message:</strong> {error.message}</p>
                  <p><strong>Stack:</strong></p>
                  <pre className="whitespace-pre-wrap bg-red-100 p-2 rounded text-xs overflow-auto max-h-32">
                    {error.stack}
                  </pre>
                  {error.digest && (
                    <p><strong>Digest:</strong> {error.digest}</p>
                  )}
                </div>
              </details>
            </div>
          )}

          {/* Error Message */}
          <ErrorMessage
            message={isNetworkError
              ? "Network error. Please check your internet connection and try again."
              : "An unexpected error occurred. Please try again or contact support if the problem persists."
            }
          />

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            <Button
              onClick={reset}
              className="w-full"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Try Again
            </Button>

            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              <HomeIcon className="h-4 w-4 mr-2" />
              Go to Homepage
            </Button>
          </div>

          {/* Help Options */}
          <div className="mt-8 p-6 bg-white rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Need assistance?
            </h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-3">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">Email Support</p>
                  <a
                    href="mailto:support@contractfabrico.com"
                    className="text-teal-600 hover:text-teal-500"
                  >
                    support@contractfabrico.com
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ArrowPathIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">What you can try:</p>
                  <ul className="mt-1 text-left">
                    <li>• Refresh the page</li>
                    <li>• Check your internet connection</li>
                    <li>• Try using a different browser</li>
                    <li>• Clear your browser cache</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Error Reference */}
          {error.digest && !isDevelopment && (
            <div className="mt-6">
              <p className="text-xs text-gray-500">
                Error Reference: {error.digest}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Please include this reference when contacting support.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 text-center text-sm text-gray-500">
        <p>&copy; 2024 ContractFabrico. All rights reserved.</p>
      </div>
    </div>
  )
}