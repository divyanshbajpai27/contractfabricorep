'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { adminApi } from '@/lib/api'
import type { RevenueAnalytics, Order, Template } from '@/types'
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  CalendarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface TimeRange {
  label: string
  value: '7d' | '30d' | '90d' | '1y'
}

export default function AdminAnalytics() {
  const [isLoading, setIsLoading] = useState(true)
  const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(null)
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange['value']>('30d')
  const [error, setError] = useState<string | null>(null)

  const timeRanges: TimeRange[] = [
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 90 days', value: '90d' },
    { label: 'Last year', value: '1y' },
  ]

  useEffect(() => {
    loadAnalyticsData()
  }, [selectedTimeRange])

  const loadAnalyticsData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Load analytics data
      const analyticsData = await adminApi.getAnalytics()
      setAnalytics(analyticsData)

      // Load all orders for detailed analysis
      const ordersData = await adminApi.getOrders()
      setAllOrders(ordersData)
    } catch (error: any) {
      console.error('Analytics loading error:', error)
      setError('Failed to load analytics data. Please try again.')
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
    })
  }

  // Filter orders based on selected time range
  const getFilteredOrders = (): Order[] => {
    if (!allOrders.length) return []

    const now = new Date()
    const filterDate = new Date()

    switch (selectedTimeRange) {
      case '7d':
        filterDate.setDate(now.getDate() - 7)
        break
      case '30d':
        filterDate.setDate(now.getDate() - 30)
        break
      case '90d':
        filterDate.setDate(now.getDate() - 90)
        break
      case '1y':
        filterDate.setFullYear(now.getFullYear() - 1)
        break
    }

    return allOrders.filter(order => new Date(order.createdAt) >= filterDate)
  }

  const filteredOrders = getFilteredOrders()

  // Calculate additional metrics
  const calculateConversionMetrics = () => {
    const totalOrders = filteredOrders.filter(order => order.status === 'paid').length
    const totalAmount = filteredOrders
      .filter(order => order.status === 'paid')
      .reduce((sum, order) => sum + order.amount, 0)

    const ordersByCategory = filteredOrders.reduce((acc, order) => {
      const category = order.template.category
      if (!acc[category]) {
        acc[category] = { count: 0, revenue: 0 }
      }
      if (order.status === 'paid') {
        acc[category].count += 1
        acc[category].revenue += order.amount
      }
      return acc
    }, {} as Record<string, { count: number; revenue: number }>)

    return { totalOrders, totalAmount, ordersByCategory }
  }

  const { totalOrders, totalAmount, ordersByCategory } = calculateConversionMetrics()

  // Generate simple chart data (bars)
  const generateRevenueBars = () => {
    const days = selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : selectedTimeRange === '90d' ? 90 : 365
    const barCount = Math.min(days, 12) // Show max 12 bars for readability

    const bars = []
    const now = new Date()

    for (let i = barCount - 1; i >= 0; i--) {
      const date = new Date(now)

      if (selectedTimeRange === '7d') {
        date.setDate(date.getDate() - i)
      } else if (selectedTimeRange === '30d') {
        date.setDate(date.getDate() - (i * Math.floor(30 / barCount)))
      } else if (selectedTimeRange === '90d') {
        date.setDate(date.getDate() - (i * Math.floor(90 / barCount)))
      } else {
        date.setMonth(date.getMonth() - Math.floor(12 / barCount))
      }

      const dayOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.createdAt)
        return orderDate.toDateString() === date.toDateString() && order.status === 'paid'
      })

      const revenue = dayOrders.reduce((sum, order) => sum + order.amount, 0)

      bars.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue,
        orders: dayOrders.length,
      })
    }

    return bars
  }

  const revenueBars = generateRevenueBars()
  const maxRevenue = Math.max(...revenueBars.map(bar => bar.revenue), 1)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorMessage message={error} />
        <div className="mt-4">
          <Button onClick={loadAnalyticsData}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-2 text-gray-600">
            Detailed insights into your contract template business performance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as TimeRange['value'])}
              className="rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
            >
              {timeRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="outline"
            onClick={loadAnalyticsData}
            disabled={isLoading}
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-teal-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Revenue
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(totalAmount)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Orders
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {totalOrders}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Average Order Value
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {totalOrders > 0 ? formatCurrency(totalAmount / totalOrders) : formatCurrency(0)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUpIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Conversion Rate
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {filteredOrders.length > 0
                        ? `${Math.round((totalOrders / filteredOrders.length) * 100)}%`
                        : '0%'
                      }
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white shadow rounded-lg border border-gray-200 mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Overview</h3>

          {revenueBars.length > 0 ? (
            <div className="space-y-4">
              {/* Chart Bars */}
              <div className="relative h-64">
                <div className="absolute inset-0 flex items-end justify-between gap-2">
                  {revenueBars.map((bar, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-teal-100 rounded-t relative group cursor-pointer">
                        <div
                          className="bg-teal-500 rounded-t transition-all duration-300 hover:bg-teal-600"
                          style={{
                            height: `${(bar.revenue / maxRevenue) * 100}%`,
                            minHeight: bar.revenue > 0 ? '4px' : '0'
                          }}
                        >
                          {/* Tooltip */}
                          {bar.revenue > 0 && (
                            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {formatCurrency(bar.revenue)}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* X-axis labels */}
              <div className="flex justify-between gap-2">
                {revenueBars.map((bar, index) => (
                  <div key={index} className="flex-1 text-center">
                    <p className="text-xs text-gray-500 truncate">{bar.date}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No data</h3>
              <p className="mt-1 text-sm text-gray-500">No revenue data available for the selected time period.</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Orders by Category */}
        <div className="bg-white shadow rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Orders by Category</h3>

            {Object.keys(ordersByCategory).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(ordersByCategory).map(([category, data]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{category}</span>
                        <span className="text-sm text-gray-500">{data.count} orders</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-teal-500 h-2 rounded-full"
                          style={{
                            width: `${(data.revenue / Math.max(...Object.values(ordersByCategory).map(d => d.revenue))) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(data.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No categories</h3>
                <p className="mt-1 text-sm text-gray-500">No category data available for the selected time period.</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Performing Templates */}
        <div className="bg-white shadow rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Templates</h3>

            {analytics?.topTemplates?.length > 0 ? (
              <div className="space-y-4">
                {analytics.topTemplates.slice(0, 5).map((item, index) => (
                  <div key={item.template.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-8 h-8 bg-teal-100 rounded-full">
                        <span className="text-sm font-medium text-teal-800">{index + 1}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.template.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.template.category} • {item.count} sold
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(item.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No templates</h3>
                <p className="mt-1 text-sm text-gray-500">No template performance data available.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mt-8 bg-white shadow rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h3>

          {filteredOrders.length > 0 ? (
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Template
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.slice(0, 10).map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{order.id.slice(-8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.template.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.customerEmail}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(order.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.status === 'paid' ? 'bg-green-100 text-green-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions</h3>
              <p className="mt-1 text-sm text-gray-500">No transactions found for the selected time period.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}