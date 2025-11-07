'use client'

import React, { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { ErrorMessage } from './ui/ErrorMessage'
import { SuccessMessage } from './ui/SuccessMessage'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { paymentApi } from '@/lib/api'
import type { Template, TemplateFormData } from '@/types'
import { cn } from '@/lib/utils'

// Initialize Stripe with publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface StripeCheckoutProps {
  isOpen: boolean
  onClose: () => void
  template: Template
  formData: TemplateFormData
  customerEmail: string
  onPaymentSuccess: (orderId: string) => void
  onPaymentError: (error: string) => void
}

interface CheckoutErrors {
  general?: string
  email?: string
  payment?: string
}

export function StripeCheckout({
  isOpen,
  onClose,
  template,
  formData,
  customerEmail,
  onPaymentSuccess,
  onPaymentError,
}: StripeCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errors, setErrors] = useState<CheckoutErrors>({})
  const [email, setEmail] = useState(customerEmail)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Reset form state when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail(customerEmail)
      setAgreedToTerms(false)
      setErrors({})
      setRetryCount(0)
    }
  }, [isOpen, customerEmail])

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Validate form before payment
  const validateForm = (): boolean => {
    const newErrors: CheckoutErrors = {}

    if (!email || !validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!agreedToTerms) {
      newErrors.general = 'You must agree to the terms and conditions'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle payment submission
  const handlePayment = async () => {
    if (!validateForm()) {
      return
    }

    setIsProcessing(true)
    setErrors({})

    try {
      // Create checkout session
      const sessionId = await paymentApi.createCheckoutSession({
        templateId: template.id,
        formData,
        customerEmail: email,
      })

      if (!sessionId) {
        throw new Error('Failed to create payment session')
      }

      // Load Stripe and redirect to checkout
      const stripe = await stripePromise

      if (!stripe) {
        throw new Error('Payment service is currently unavailable')
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId,
      })

      if (error) {
        throw new Error(error.message || 'Payment failed')
      }

    } catch (error: any) {
      console.error('Payment error:', error)

      let errorMessage = 'Payment failed. Please try again.'

      // Handle specific error cases
      if (error.message?.includes('network') || error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (error.message?.includes('email')) {
        errorMessage = 'Invalid email address. Please check and try again.'
      } else if (error.message?.includes('rate')) {
        errorMessage = 'Too many payment attempts. Please wait a few minutes before trying again.'
      } else if (error.message) {
        errorMessage = error.message
      }

      setErrors({ payment: errorMessage })
      onPaymentError(errorMessage)
      setRetryCount(prev => prev + 1)
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle retry payment
  const handleRetry = () => {
    if (retryCount < 3) {
      handlePayment()
    } else {
      setErrors({
        payment: 'Multiple payment attempts failed. Please contact support or try again later.'
      })
    }
  }

  // Format price display
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  // Generate form data summary for display
  const getFormDataSummary = (): Array<{ label: string; value: any }> => {
    return template.placeholders
      .filter(placeholder => formData[placeholder.name] !== undefined && formData[placeholder.name] !== '')
      .map(placeholder => ({
        label: placeholder.label,
        value: formData[placeholder.name],
      }))
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Your Purchase"
      size="lg"
    >
      <div className="space-y-6">
        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>

          <div className="space-y-4">
            {/* Template Details */}
            <div>
              <h4 className="font-medium text-gray-900">{template.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                  {template.category}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {template.jurisdiction}
                </span>
              </div>
            </div>

            {/* Form Data Summary */}
            {getFormDataSummary().length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Document Details:</h5>
                <div className="bg-white rounded border p-3">
                  <dl className="space-y-2">
                    {getFormDataSummary().map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <dt className="text-gray-600">{item.label}:</dt>
                        <dd className="font-medium text-gray-900">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            )}

            {/* Price */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total:</span>
                <span className="text-2xl font-bold text-teal-600">{formatPrice(template.price)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">One-time payment</p>
            </div>
          </div>
        </div>

        {/* Email Input */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className={cn(
              "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500",
              errors.email ? "border-red-300" : "border-gray-300"
            )}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Document download links will be sent to this email address
          </p>
        </div>

        {/* Legal Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-amber-600"
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
            <div className="flex-1">
              <h4 className="text-sm font-medium text-amber-800">Legal Disclaimer</h4>
              <p className="mt-1 text-sm text-amber-700">
                This document is provided for informational purposes only and does not constitute legal advice.
                No attorney-client relationship is created. You should consult a licensed attorney before using this document.
              </p>
            </div>
          </div>
        </div>

        {/* Terms Agreement */}
        <div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">
              By purchasing, you acknowledge this is a legal template and not legal advice.
              Please consult an attorney for personalized review. ContractFabrico disclaims all liability.
            </span>
          </label>
        </div>

        {/* Security Indicators */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="h-5 w-5 text-green-600"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            <h4 className="text-sm font-medium text-green-800">Secure Payment</h4>
          </div>
          <ul className="text-xs text-green-700 space-y-1">
            <li>• SSL encryption protects your data</li>
            <li>• Payment processed securely by Stripe</li>
            <li>• PCI DSS compliant payment processing</li>
            <li>• No credit card information stored on our servers</li>
          </ul>
        </div>

        {/* Error Messages */}
        {errors.general && (
          <ErrorMessage message={errors.general} />
        )}

        {errors.payment && (
          <div className="space-y-3">
            <ErrorMessage message={errors.payment} />
            {retryCount < 3 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                disabled={isProcessing}
                className="w-full"
              >
                Retry Payment
              </Button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            disabled={isProcessing || !agreedToTerms || !email}
            loading={isProcessing}
            className="flex-1"
          >
            {isProcessing ? 'Processing...' : `Pay ${formatPrice(template.price)}`}
          </Button>
        </div>

        {/* Powered by Stripe */}
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-2">Secure payment powered by</p>
          <img
            src="https://cdn.jsdelivr.net/gh/stripe/press-kit@main/logos/powered_by_stripe@2x.png"
            alt="Powered by Stripe"
            className="h-6 mx-auto"
          />
        </div>
      </div>
    </Modal>
  )
}

export default StripeCheckout