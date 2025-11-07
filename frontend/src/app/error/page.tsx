'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { SuccessMessage } from '@/components/ui/SuccessMessage'

export default function ErrorPage() {
  const searchParams = useSearchParams()
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    // Get error message from URL params
    const errorParam = searchParams.get('message')
    const cancelled = searchParams.get('cancelled')

    if (cancelled === 'true') {
      setMessage('Payment was cancelled. You can try again when you\'re ready.')
    } else if (errorParam) {
      // Decode URL-encoded message
      try {
        setMessage(decodeURIComponent(errorParam))
      } catch {
        setMessage('An error occurred during payment processing.')
      }
    } else {
      setMessage('An error occurred during payment processing.')
    }
  }, [searchParams])

  const handleRetryPayment = () => {
    // In a real app, you might store the template and form data in session/local storage
    // to allow the user to retry the payment
    window.history.back()
  }

  const errorTypes = [
    {
      pattern: /cancelled/i,
      title: 'Payment Cancelled',
      description: 'You cancelled the payment process. No charges were made.',
      type: 'warning'
    },
    {
      pattern: /declined|failed/i,
      title: 'Payment Failed',
      description: 'Your payment could not be processed. Please check your payment details and try again.',
      type: 'error'
    },
    {
      pattern: /network|timeout/i,
      title: 'Network Error',
      description: 'There was a problem connecting to our payment service. Please check your internet connection and try again.',
      type: 'error'
    },
    {
      pattern: /expired/i,
      title: 'Session Expired',
      description: 'The payment session has expired. Please start over to complete your purchase.',
      type: 'error'
    }
  ]

  const getErrorInfo = (errorMsg: string) => {
    for (const errorType of errorTypes) {
      if (errorType.pattern.test(errorMsg)) {
        return errorType
      }
    }
    return {
      title: 'Payment Error',
      description: errorMsg || 'An unexpected error occurred during payment processing.',
      type: 'error'
    }
  }

  const errorInfo = getErrorInfo(message)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Error Header */}
        <div className="text-center mb-8">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            errorInfo.type === 'warning'
              ? 'bg-yellow-100'
              : 'bg-red-100'
          }`}>
            <svg
              className={`h-8 w-8 ${
                errorInfo.type === 'warning'
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {errorInfo.type === 'warning' ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              )}
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {errorInfo.title}
          </h1>
          <p className="text-lg text-gray-600">
            {errorInfo.description}
          </p>
        </div>

        {/* Error Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">What happened?</h2>
            <div className="space-y-3 text-gray-600">
              <p>
                {message && (
                  <span className="block p-3 bg-gray-50 rounded-md border border-gray-200 text-sm font-mono">
                    {message}
                  </span>
                )}
              </p>
            </div>

            {/* Next Steps */}
            <div className="mt-6">
              <h3 className="font-medium text-gray-900 mb-3">What you can do:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                {errorInfo.type === 'warning' ? (
                  <>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Try again when you're ready to complete the purchase
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      No charges were made to your payment method
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Check your payment details and try again
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Contact your bank if you suspect an issue with your card
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Try a different payment method
                    </li>
                  </>
                )}
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Contact support if the problem persists
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Support Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-blue-900">Need Help?</h3>
              <p className="mt-1 text-blue-700">
                Our support team is here to help you complete your purchase. Contact us at:
              </p>
              <div className="mt-2 space-y-1 text-sm text-blue-700">
                <p><strong>Email:</strong> support@contractfabrico.com</p>
                <p><strong>Phone:</strong> 1-800-CONTRACT</p>
                <p><strong>Hours:</strong> Monday-Friday, 9 AM - 6 PM EST</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={handleRetryPayment} className="w-full sm:w-auto">
            Try Payment Again
          </Button>
          <Link href="/templates">
            <Button variant="outline" className="w-full sm:w-auto">
              Browse Templates
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="w-full sm:w-auto">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}