'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { adminApi } from '@/lib/api'
import type { Order, Template, RevenueAnalytics } from '@/types'
import {
  ChartBarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'

interface StatCard {
  title: string
  value: string | number
  change?: string
  changeType?: 'increase' | 'decrease'
  icon: React.ReactNode
  href?: string
}

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [topTemplates, setTopTemplates] = useState<Template[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Load analytics data
      const analyticsData = await adminApi.getAnalytics()
      setAnalytics(analyticsData)

      // Load recent orders
      const ordersData = await adminApi.getOrders()
      setRecentOrders(ordersData.slice(0, 5)) // Show only 5 most recent

      // Load top templates (extracted from analytics)
      if (analyticsData?.topTemplates) {
        setTopTemplates(analyticsData.topTemplates.map(item => item.template))
      }
    } catch (error: any) {
      console.error('Dashboard data loading error:', error)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'refunded':
        return <ExclamationCircleIcon className="h-5 w-5 text-gray-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'refunded':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorMessage message={error} />
        <div className="mt-4">
          <Button onClick={loadDashboardData}>Try Again</Button>
        </div>
      </div>
    )
  }

  // Prepare stat cards
  const statCards: StatCard[] = [
    {
      title: 'Total Revenue',
      value: formatCurrency(analytics?.totalRevenue || 0),
      change: '+12.5%',
      changeType: 'increase',
      icon: <CurrencyDollarIcon className="h-6 w-6 text-teal-600" />,
      href: '/admin/analytics',
    },
    {
      title: 'Total Orders',
      value: analytics?.totalOrders || 0,
      change: '+8.2%',
      changeType: 'increase',
      icon: <DocumentTextIcon className="h-6 w-6 text-blue-600" />,
      href: '/admin/orders',
    },
    {
      title: 'Average Order Value',
      value: formatCurrency(analytics?.averageOrderValue || 0),
      change: '+3.1%',
      changeType: 'increase',
      icon: <ChartBarIcon className="h-6 w-6 text-purple-600" />,
      href: '/admin/analytics',
    },
    {
      title: 'Active Templates',
      value: topTemplates.length,
      change: '+2',
      changeType: 'increase',
      icon: <UsersIcon className="h-6 w-6 text-green-600" />,
      href: '/admin/templates',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome to the ContractFabrico admin dashboard. Here's an overview of your business performance.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-white overflow-hidden shadow rounded-lg border border-gray-200"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {stat.icon}
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.title}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      {stat.change && (
                        <div
                          className={`ml-2 flex items-baseline text-sm font-semibold ${
                            stat.changeType === 'increase'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {stat.changeType === 'increase' ? (
                            <svg
                              className="self-center flex-shrink-0 h-5 w-5 text-green-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="self-center flex-shrink-0 h-5 w-5 text-red-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                          <span>{stat.change}</span>
                        </div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            {stat.href && (
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link
                    href={stat.href}
                    className="font-medium text-teal-700 hover:text-teal-900"
                  >
                    View all →
                  </Link>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white shadow rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
              <Link
                href="/admin/orders"
                className="text-sm text-teal-600 hover:text-teal-500"
              >
                View all
              </Link>
            </div>

            {recentOrders.length > 0 ? (
              <div className="flow-root">
                <ul className="-my-5 divide-y divide-gray-200">
                  {recentOrders.map((order) => (
                    <li key={order.id} className="py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {getStatusIcon(order.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {order.template.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.customerEmail} • {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(order.amount)}
                          </p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
                <p className="mt-1 text-sm text-gray-500">No orders have been placed yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Templates */}
        <div className="bg-white shadow rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Top Templates</h3>
              <Link
                href="/admin/templates"
                className="text-sm text-teal-600 hover:text-teal-500"
              >
                Manage templates
              </Link>
            </div>

            {topTemplates.length > 0 ? (
              <div className="flow-root">
                <ul className="-my-5 divide-y divide-gray-200">
                  {topTemplates.map((template) => {
                    const templateStats = analytics?.topTemplates.find(
                      (item) => item.template.id === template.id
                    )

                    return (
                      <li key={template.id} className="py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {template.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              {template.category} • {formatCurrency(template.price)}
                            </p>
                          </div>
                          {templateStats && (
                            <div className="flex-shrink-0 text-right">
                              <p className="text-sm font-medium text-gray-900">
                                {templateStats.count} sold
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatCurrency(templateStats.revenue)}
                              </p>
                            </div>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No templates</h3>
                <p className="mt-1 text-sm text-gray-500">No templates have been created yet.</p>
                <div className="mt-6">
                  <Link href="/admin/templates">
                    <Button size="sm">Create Template</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white shadow rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/templates/new">
              <Button className="w-full">
                Create Template
              </Button>
            </Link>
            <Link href="/admin/orders">
              <Button variant="outline" className="w-full">
                View Orders
              </Button>
            </Link>
            <Link href="/admin/analytics">
              <Button variant="outline" className="w-full">
                View Analytics
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full"
              onClick={loadDashboardData}
            >
              Refresh Data
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}