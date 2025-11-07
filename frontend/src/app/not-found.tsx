'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import {
  DocumentTextIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* 404 Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <DocumentTextIcon className="h-24 w-24 text-gray-300" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-gray-600">404</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Page Not Found
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link href="/">
            <Button className="w-full">
              <HomeIcon className="h-4 w-4 mr-2" />
              Go Back Home
            </Button>
          </Link>

          <Link href="/templates">
            <Button variant="outline" className="w-full">
              <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
              Browse Templates
            </Button>
          </Link>
        </div>

        {/* Help Section */}
        <div className="mt-12 p-6 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-center mb-3">
            <QuestionMarkCircleIcon className="h-8 w-8 text-teal-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Looking for something specific?
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Here are some popular pages you might find helpful:
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/" className="text-teal-600 hover:text-teal-500">
                → Home - Contract generation platform
              </Link>
            </li>
            <li>
              <Link href="/templates" className="text-teal-600 hover:text-teal-500">
                → Templates - Browse legal document templates
              </Link>
            </li>
            <li>
              <Link href="/success" className="text-teal-600 hover:text-teal-500">
                → Success - Recent purchase confirmation
              </Link>
            </li>
            <li>
              <Link href="/admin/login" className="text-teal-600 hover:text-teal-500">
                → Admin Login - Administrative access
              </Link>
            </li>
          </ul>
        </div>

        {/* Report Issue */}
        <div className="mt-8">
          <p className="text-xs text-gray-500">
            If you believe this is an error, please{' '}
            <a
              href="mailto:support@contractfabrico.com"
              className="text-teal-600 hover:text-teal-500 underline"
            >
              contact our support team
            </a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 text-center text-sm text-gray-500">
        <p>&copy; 2024 ContractFabrico. All rights reserved.</p>
      </div>
    </div>
  )
}