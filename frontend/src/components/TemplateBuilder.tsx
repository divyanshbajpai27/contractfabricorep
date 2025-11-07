'use client'

import React, { useState, useEffect } from 'react'
import { Template, TemplateFormData } from '@/types'
import { DynamicForm } from './DynamicForm'
import { PreviewPanel } from './PreviewPanel'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { SuccessMessage } from '@/components/ui/SuccessMessage'
import { templateApi, paymentApi } from '@/lib/api'

interface TemplateBuilderProps {
  templateId: string
}

const TemplateBuilder: React.FC<TemplateBuilderProps> = ({ templateId }) => {
  const [template, setTemplate] = useState<Template | null>(null)
  const [formData, setFormData] = useState<TemplateFormData>({})
  const [previewHtml, setPreviewHtml] = useState<string>()
  const [loading, setLoading] = useState(true)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>()
  const [success, setSuccess] = useState<string>()
  const [formValid, setFormValid] = useState(false)

  useEffect(() => {
    fetchTemplate()
  }, [templateId])

  useEffect(() => {
    // Set default values from template
    if (template) {
      const defaults: TemplateFormData = {}
      template.placeholders.forEach(placeholder => {
        if (placeholder.default !== undefined) {
          defaults[placeholder.name] = placeholder.default
        }
        if (placeholder.type === 'date' && placeholder.default === 'today') {
          defaults[placeholder.name] = new Date().toISOString().split('T')[0]
        }
      })
      setFormData(prev => ({ ...defaults, ...prev }))
    }
  }, [template])

  const fetchTemplate = async () => {
    try {
      setLoading(true)
      setError(undefined)

      const response = await templateApi.getById(templateId)

      if (response.success && response.data) {
        setTemplate(response.data)
      } else {
        setError(response.error?.message || 'Template not found')
      }
    } catch (err) {
      setError('Failed to load template. Please try again.')
      console.error('Failed to fetch template:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePreview = async () => {
    if (!template) return

    try {
      setPreviewLoading(true)
      setError(undefined)

      const response = await templateApi.generatePreview(templateId, formData)

      if (response.success && response.data) {
        setPreviewHtml(response.data.previewHtml)
        setSuccess('Preview generated successfully!')
        setTimeout(() => setSuccess(undefined), 3000)
      } else {
        setError(response.error?.message || 'Failed to generate preview')
      }
    } catch (err) {
      setError('Failed to generate preview. Please check your form and try again.')
      console.error('Failed to generate preview:', err)
    } finally {
      setPreviewLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!template || !formValid) return

    try {
      setSubmitting(true)
      setError(undefined)

      // In a real app, you'd collect customer email
      const checkoutData = {
        templateId,
        formData,
        customerEmail: 'customer@example.com' // This should come from a form field
      }

      const sessionId = await paymentApi.createCheckoutSession(checkoutData)

      if (sessionId) {
        // Redirect to Stripe Checkout
        const stripe = await import('@stripe/stripe-js').then(Stripe => Stripe.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!))
        if (stripe) {
          const { error } = await stripe.redirectToCheckout({ sessionId })
          if (error) {
            setError(error.message || 'Payment failed')
          }
        }
      } else {
        setError('Failed to create payment session')
      }
    } catch (err) {
      setError('Failed to initiate payment. Please try again.')
      console.error('Payment error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading template...</p>
        </div>
      </div>
    )
  }

  if (error && !template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <ErrorMessage message={error} />
          <Button
            onClick={() => window.history.back()}
            className="mt-4"
          >
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (!template) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{template.title}</h1>
              <p className="text-gray-600">{template.description}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Document Price</p>
              <p className="text-2xl font-bold text-teal-600">{formatPrice(template.price)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {error && (
          <ErrorMessage
            message={error}
            onDismiss={() => setError(undefined)}
          />
        )}
        {success && (
          <SuccessMessage
            message={success}
            onDismiss={() => setSuccess(undefined)}
          />
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Document Information
              </h2>

              <DynamicForm
                placeholders={template.placeholders}
                formData={formData}
                onChange={setFormData}
                onValidationChange={(isValid, errors) => setFormValid(isValid)}
              />

              {/* Disclaimer */}
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Legal Disclaimer
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        This document is provided for informational purposes only and does not constitute legal advice.
                        No attorney-client relationship is created. You should consult a licensed attorney before using this document.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={handleGeneratePreview}
                  disabled={previewLoading || !formValid}
                  className="flex-1"
                >
                  {previewLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Generating Preview...
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
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      Preview Document
                    </>
                  )}
                </Button>

                <Button
                  onClick={handlePayment}
                  disabled={!formValid || submitting || !previewHtml}
                  loading={submitting}
                  className="flex-1"
                >
                  {submitting ? 'Processing...' : `Pay & Download ${formatPrice(template.price)}`}
                </Button>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div>
            <PreviewPanel
              template={template}
              formData={formData}
              previewHtml={previewHtml}
              loading={previewLoading}
              error={error}
              onGeneratePreview={handleGeneratePreview}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export { TemplateBuilder }