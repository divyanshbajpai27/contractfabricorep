'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { SuccessMessage } from '@/components/ui/SuccessMessage'
import { adminApi } from '@/lib/api'
import type { Order } from '@/types'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  CurrencyDollarIcon,
  DocumentIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

type OrderStatus = 'all' | 'pending' | 'paid' | 'failed' | 'refunded'
type SortField = 'createdAt' | 'amount' | 'status' | 'customerEmail'
type SortDirection = 'asc' | 'desc'

interface FilterOptions {
  status: OrderStatus
  search: string
  sortField: SortField
  sortDirection: SortDirection
}

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Filter and sort state
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    search: '',
    sortField: 'createdAt',
    sortDirection: 'desc',
  })
  const [showFilters, setShowFilters] = useState(false)

  // Modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [isProcessingRefund, setIsProcessingRefund] = useState(false)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const ordersData = await adminApi.getOrders()
      setOrders(ordersData)
    } catch (error: any) {
      console.error('Orders loading error:', error)
      setError('Failed to load orders. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter and sort orders
  const getFilteredAndSortedOrders = (): Order[] => {
    let filtered = [...orders]

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status)
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(order =>
        order.customerEmail.toLowerCase().includes(searchLower) ||
        order.template.title.toLowerCase().includes(searchLower) ||
        order.id.toLowerCase().includes(searchLower)
      )
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[filters.sortField]
      let bValue: any = b[filters.sortField]

      if (filters.sortField === 'amount') {
        aValue = parseFloat(aValue as string)
        bValue = parseFloat(bValue as string)
      } else if (filters.sortField === 'createdAt') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      if (aValue < bValue) {
        return filters.sortDirection === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return filters.sortDirection === 'asc' ? 1 : -1
      }
      return 0
    })

    return filtered
  }

  const filteredOrders = getFilteredAndSortedOrders()

  // Handle sort change
  const handleSort = (field: SortField) => {
    setFilters(prev => ({
      ...prev,
      sortField: field,
      sortDirection: prev.sortField === field && prev.sortDirection === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Handle refund
  const handleRefund = async () => {
    if (!selectedOrder) return

    setIsProcessingRefund(true)
    setError(null)

    try {
      // TODO: Implement refund API call
      // await adminApi.processRefund(selectedOrder.id)

      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 2000))

      setSuccess(`Refund processed for order #${selectedOrder.id.slice(-8)}`)

      // Update order status locally
      setOrders(prev => prev.map(order =>
        order.id === selectedOrder.id
          ? { ...order, status: 'refunded' as const }
          : order
      ))

      setShowRefundModal(false)
      setSelectedOrder(null)
    } catch (error: any) {
      console.error('Refund error:', error)
      setError('Failed to process refund. Please try again.')
    } finally {
      setIsProcessingRefund(false)
    }
  }

  // Format functions
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

  const getSortIcon = (field: SortField) => {
    if (filters.sortField !== field) {
      return <div className="w-4 h-4" />
    }

    return filters.sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  if (isLoading && orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
        <p className="mt-2 text-gray-600">
          Manage customer orders, process refunds, and track payment status.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} />
        </div>
      )}
      {success && (
        <div className="mb-6">
          <SuccessMessage message={success} />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg border border-gray-200 mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="Search by email, template, or order ID..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as OrderStatus }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              {/* Refresh */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={loadOrders}
                  disabled={isLoading}
                  className="w-full"
                >
                  <ArrowPathIcon className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                  Refresh
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white shadow rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Orders ({filteredOrders.length})
            </h3>
          </div>

          {filteredOrders.length > 0 ? (
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center gap-1">
                          Date
                          {getSortIcon('createdAt')}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('customerEmail')}
                      >
                        <div className="flex items-center gap-1">
                          Customer
                          {getSortIcon('customerEmail')}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Template
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('amount')}
                      >
                        <div className="flex items-center gap-1">
                          Amount
                          {getSortIcon('amount')}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center gap-1">
                          Status
                          {getSortIcon('status')}
                        </div>
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {order.customerEmail}
                          </div>
                          <div className="text-sm text-gray-500">
                            #{order.id.slice(-8)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.template.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(order.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                            getStatusColor(order.status)
                          )}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order)
                                setShowOrderDetails(true)
                              }}
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Button>

                            {order.status === 'paid' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedOrder(order)
                                  setShowRefundModal(true)
                                }}
                              >
                                <CurrencyDollarIcon className="h-4 w-4" />
                              </Button>
                            )}

                            {order.pdfUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(order.pdfUrl, '_blank')}
                              >
                                <DocumentIcon className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filters.search || filters.status !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : 'No orders have been placed yet.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      <Modal
        isOpen={showOrderDetails}
        onClose={() => {
          setShowOrderDetails(false)
          setSelectedOrder(null)
        }}
        title="Order Details"
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Order Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Order Information</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Order ID</dt>
                    <dd className="mt-1 text-sm text-gray-900">#{selectedOrder.id.slice(-8)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        getStatusColor(selectedOrder.status)
                      )}>
                        {selectedOrder.status}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(selectedOrder.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Amount</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatCurrency(selectedOrder.amount)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Customer Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Customer Information</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedOrder.customerEmail}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Stripe Payment ID</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono">{selectedOrder.stripePaymentId}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Template Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Template Information</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Template</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedOrder.template.title}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Category</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedOrder.template.category}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Jurisdiction</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedOrder.template.jurisdiction}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Form Data */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Form Data</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <dl className="space-y-2">
                  {Object.entries(selectedOrder.formData).map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-sm font-medium text-gray-500 capitalize">
                        {key.replace(/_/g, ' ')}
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Download Links */}
            {(selectedOrder.pdfUrl || selectedOrder.docxUrl) && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Download Links</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex flex-col gap-3">
                    {selectedOrder.pdfUrl && (
                      <Button
                        variant="outline"
                        onClick={() => window.open(selectedOrder.pdfUrl, '_blank')}
                        className="w-full"
                      >
                        <DocumentIcon className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                    )}
                    {selectedOrder.docxUrl && (
                      <Button
                        variant="outline"
                        onClick={() => window.open(selectedOrder.docxUrl, '_blank')}
                        className="w-full"
                      >
                        <DocumentIcon className="h-4 w-4 mr-2" />
                        Download DOCX
                      </Button>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Download links expire on {formatDate(selectedOrder.downloadExpiry)}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowOrderDetails(false)
                  setSelectedOrder(null)
                }}
                className="flex-1"
              >
                Close
              </Button>

              {selectedOrder.status === 'paid' && (
                <Button
                  onClick={() => {
                    setShowOrderDetails(false)
                    setShowRefundModal(true)
                  }}
                  className="flex-1"
                >
                  Process Refund
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Refund Confirmation Modal */}
      <Modal
        isOpen={showRefundModal}
        onClose={() => {
          setShowRefundModal(false)
          setSelectedOrder(null)
        }}
        title="Process Refund"
        size="md"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-amber-800">Refund Confirmation</h4>
                  <p className="mt-1 text-sm text-amber-700">
                    You are about to process a full refund for order #{selectedOrder.id.slice(-8)}.
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Order Details</h4>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Order:</dt>
                  <dd className="text-sm text-gray-900">#{selectedOrder.id.slice(-8)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Customer:</dt>
                  <dd className="text-sm text-gray-900">{selectedOrder.customerEmail}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Amount:</dt>
                  <dd className="text-sm font-medium text-gray-900">{formatCurrency(selectedOrder.amount)}</dd>
                </div>
              </dl>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRefundModal(false)
                  setSelectedOrder(null)
                }}
                disabled={isProcessingRefund}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRefund}
                loading={isProcessingRefund}
                disabled={isProcessingRefund}
                className="flex-1"
              >
                {isProcessingRefund ? 'Processing...' : 'Process Refund'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}