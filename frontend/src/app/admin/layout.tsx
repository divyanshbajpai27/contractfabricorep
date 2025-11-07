'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check authentication on mount and route changes
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('admin_token')

        if (!token) {
          // No token found, redirect to login
          if (pathname !== '/admin/login') {
            router.push('/admin/login')
          }
          setIsLoading(false)
          return
        }

        // TODO: In a real implementation, validate the token with the backend
        // For now, we'll assume the token is valid
        setIsAuthenticated(true)

        // If user is on login page but already authenticated, redirect to dashboard
        if (pathname === '/admin/login') {
          router.push('/admin')
        }
      } catch (error) {
        console.error('Auth check error:', error)
        setError('Authentication check failed')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, pathname])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <ErrorMessage message={error} />
          <div className="mt-4 text-center">
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // If on login page, show without admin layout
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  // If not authenticated and not on login page, redirect will happen in useEffect
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Show admin layout with navigation
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <Link href="/admin" className="text-xl font-bold text-teal-600">
                  ContractFabrico Admin
                </Link>
              </div>

              {/* Navigation Links */}
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/admin"
                  className={cn(
                    'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium',
                    pathname === '/admin'
                      ? 'border-teal-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/templates"
                  className={cn(
                    'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium',
                    pathname?.startsWith('/admin/templates')
                      ? 'border-teal-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  Templates
                </Link>
                <Link
                  href="/admin/orders"
                  className={cn(
                    'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium',
                    pathname?.startsWith('/admin/orders')
                      ? 'border-teal-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  Orders
                </Link>
                <Link
                  href="/admin/analytics"
                  className={cn(
                    'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium',
                    pathname?.startsWith('/admin/analytics')
                      ? 'border-teal-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  Analytics
                </Link>
              </div>
            </div>

            {/* Right side items */}
            <div className="flex items-center space-x-4">
              {/* View Site Link */}
              <Link
                href="/"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                View Site
              </Link>

              {/* Logout Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  localStorage.removeItem('admin_token')
                  router.push('/admin/login')
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href="/admin"
              className={cn(
                'block pl-3 pr-4 py-2 border-l-4 text-base font-medium',
                pathname === '/admin'
                  ? 'bg-teal-50 border-teal-500 text-teal-700'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300'
              )}
            >
              Dashboard
            </Link>
            <Link
              href="/admin/templates"
              className={cn(
                'block pl-3 pr-4 py-2 border-l-4 text-base font-medium',
                pathname?.startsWith('/admin/templates')
                  ? 'bg-teal-50 border-teal-500 text-teal-700'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300'
              )}
            >
              Templates
            </Link>
            <Link
              href="/admin/orders"
              className={cn(
                'block pl-3 pr-4 py-2 border-l-4 text-base font-medium',
                pathname?.startsWith('/admin/orders')
                  ? 'bg-teal-50 border-teal-500 text-teal-700'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300'
              )}
            >
              Orders
            </Link>
            <Link
              href="/admin/analytics"
              className={cn(
                'block pl-3 pr-4 py-2 border-l-4 text-base font-medium',
                pathname?.startsWith('/admin/analytics')
                  ? 'bg-teal-50 border-teal-500 text-teal-700'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300'
              )}
            >
              Analytics
            </Link>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}

// Helper function for className conditional logic
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}