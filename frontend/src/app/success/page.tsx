'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { SuccessMessage } from '@/components/ui/SuccessMessage'
import { orderApi } from '@/lib/api'

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<any>(null)
  const [error, setError] = useState<string>()
  const [downloadUrls, setDownloadUrls] = useState<{ pdfUrl: string; docxUrl: string } | null>(null)

  useEffect(() => {
    if (sessionId) {
      fetchOrderDetails()
    } else {
      setError('No payment session found')
      setLoading(false)
    }
  }, [sessionId])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      setError(undefined)

      // In a real app, you'd get the order ID from the session or from URL params
      // For now, we'll simulate fetching order details
      const orderId = searchParams.get('order_id')
      const email = searchParams.get('email') || 'customer@example.com'

      if (orderId) {
        const orderResponse = await orderApi.getById(orderId, email)
        if (orderResponse.success && orderResponse.data) {
          setOrder(orderResponse.data)
        }
      }

      // For demo purposes, simulate successful order
      setOrder({
        id: orderId || 'demo-order-id',
        template: {
          title: 'California Non-Disclosure Agreement',
          category: 'Business'
        },
        amount: 9.99,
        status: 'paid',
        createdAt: new Date().toISOString(),
        downloadExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      })

      // Simulate download URLs
      setDownloadUrls({
        pdfUrl: '#',
        docxUrl: '#'
      })

    } catch (err) {
      setError('Failed to load order details')
      console.error('Failed to fetch order:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (format: 'pdf' | 'docx') => {
    if (!order || !downloadUrls) return

    try {
      const url = format === 'pdf' ? downloadUrls.pdfUrl : downloadUrls.docxUrl

      // In a real app, this would be a real download URL
      // For demo purposes, we'll show a message
      alert(`Downloading ${format.toUpperCase()} file...`)

      // Real implementation would be:
      // window.open(url, '_blank')

    } catch (err) {
      setError(`Failed to download ${format.toUpperCase()} file`)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" text="Loading your order details..." />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-lg text-gray-600">
            Your document is ready for download
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6">
            <ErrorMessage
              message={error}
              onDismiss={() => setError(undefined)}
            />
          </div>
        )}

        {/* Order Details */}
        {order && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-medium text-gray-900">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Document:</span>
                  <span className="font-medium text-gray-900">{order.template.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium text-gray-900">{order.template.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-medium text-gray-900">${order.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Paid
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Date:</span>
                  <span className="font-medium text-gray-900">{formatDate(order.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Download Section */}
            <div className="p-6 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Download Your Document</h3>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900">PDF Document</h4>
                      <p className="text-sm text-blue-700">Ready to print and share</p>
                    </div>
                    <Button onClick={() => handleDownload('pdf')}>
                      <svg
                        className="h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Download PDF
                    </Button>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-green-900">Word Document (.docx)</h4>
                      <p className="text-sm text-green-700">Editable document format</p>
                    </div>
                    <Button variant="outline" onClick={() => handleDownload('docx')}>
                      <svg
                        className="h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Download DOCX
                    </Button>
                  </div>
                </div>
              </div>

              {/* Download Notice */}
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Your download links will expire on{' '}
                  {formatDate(order.downloadExpiry)}. Please download your documents before then.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Email Notice */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-teal-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">Email Delivery</h3>
              <p className="mt-1 text-gray-600">
                We've also sent the download links to your email address. Check your inbox for the delivery confirmation.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/templates">
            <Button variant="outline" className="w-full sm:w-auto">
              Create Another Document
            </Button>
          </Link>
          <Link href="/">
            <Button className="w-full sm:w-auto">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}