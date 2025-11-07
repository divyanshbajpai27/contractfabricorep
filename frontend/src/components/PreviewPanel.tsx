'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'

interface PreviewPanelProps {
  template: any
  formData: Record<string, any>
  previewHtml?: string
  loading?: boolean
  error?: string
  onGeneratePreview: () => void
  className?: string
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  template,
  formData,
  previewHtml,
  loading = false,
  error,
  onGeneratePreview,
  className
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Business: 'bg-blue-100 text-blue-800',
      HR: 'bg-green-100 text-green-800',
      IP: 'bg-purple-100 text-purple-800',
      'Real Estate': 'bg-orange-100 text-orange-800',
      Freelance: 'bg-pink-100 text-pink-800',
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="h-full flex flex-col">
          {/* Fullscreen Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
            <h2 className="text-lg font-semibold text-gray-900">
              Document Preview: {template.title}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsFullscreen(false)}
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Exit Fullscreen
              </Button>
            </div>
          </div>

          {/* Fullscreen Content */}
          <div className="flex-1 overflow-auto bg-gray-50">
            <div className="max-w-4xl mx-auto p-8">
              {previewHtml ? (
                <div
                  className="bg-white shadow-lg rounded-lg p-8 prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              ) : (
                <div className="text-center py-12">
                  <LoadingSpinner size="lg" text="Generating preview..." />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Document Preview</h3>
          <div className="flex items-center gap-2">
            {previewHtml && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(true)}
              >
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
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
                Fullscreen
              </Button>
            )}
            <Button
              onClick={onGeneratePreview}
              disabled={loading}
              size="sm"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Generating...
                </>
              ) : (
                <>
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
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh Preview
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Template Info */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                {template.category}
              </span>
              <span className="text-sm text-gray-500">{template.jurisdiction}</span>
            </div>
            <h4 className="font-medium text-gray-900">{template.title}</h4>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Price</p>
            <p className="text-lg font-bold text-teal-600">{formatPrice(template.price)}</p>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Generating document preview..." />
          </div>
        ) : error ? (
          <ErrorMessage message={error} />
        ) : previewHtml ? (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                This is a preview of your document. Complete the form and proceed to payment to download the full version.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="h-8 w-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Preview Not Available
            </h3>
            <p className="text-gray-600 mb-4">
              Fill in the form fields and click "Refresh Preview" to see how your document will look.
            </p>
            <Button onClick={onGeneratePreview}>
              Generate Preview
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export { PreviewPanel }