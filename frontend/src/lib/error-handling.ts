import type { AxiosError } from 'axios'

// Error types
export interface ApiError {
  code: string
  message: string
  details?: any
  statusCode?: number
  requestId?: string
}

export interface NetworkError {
  type: 'NETWORK_ERROR' | 'TIMEOUT_ERROR' | 'SERVER_ERROR' | 'CLIENT_ERROR'
  message: string
  originalError?: any
}

// Error message mapping
const ERROR_MESSAGES: Record<string, string> = {
  // Network errors
  'NETWORK_ERROR': 'Network connection failed. Please check your internet connection.',
  'TIMEOUT_ERROR': 'Request timed out. Please try again.',
  'SERVER_ERROR': 'Server error occurred. Please try again later.',
  'CLIENT_ERROR': 'Request failed. Please check your input and try again.',

  // API specific errors
  'VALIDATION_ERROR': 'Please check your input and try again.',
  'TEMPLATE_NOT_FOUND': 'Template not found.',
  'ORDER_NOT_FOUND': 'Order not found.',
  'PAYMENT_FAILED': 'Payment failed. Please try again.',
  'AUTHENTICATION_FAILED': 'Authentication failed. Please log in again.',
  'PERMISSION_DENIED': 'You do not have permission to perform this action.',
  'RATE_LIMIT_EXCEEDED': 'Too many requests. Please wait and try again.',
  'SERVICE_UNAVAILABLE': 'Service temporarily unavailable. Please try again later.',
  'INTERNAL_ERROR': 'An unexpected error occurred. Please try again.',

  // Stripe specific errors
  'STRIPE_CARD_DECLINED': 'Your card was declined. Please try a different card.',
  'STRIPE_INSUFFICIENT_FUNDS': 'Insufficient funds. Please try a different card.',
  'STRIPE_EXPIRED_CARD': 'Your card has expired. Please try a different card.',
  'STRIPE_INCORRECT_CVC': 'Incorrect CVC. Please check your card details.',
  'STRIPE_PROCESSING_ERROR': 'Payment processing error. Please try again.',
}

// Error classification
export const classifyError = (error: any): NetworkError => {
  if (!error) {
    return {
      type: 'SERVER_ERROR',
      message: ERROR_MESSAGES.INTERNAL_ERROR,
      originalError: error
    }
  }

  // Axios error
  if (error.isAxiosError) {
    const axiosError = error as AxiosError
    const statusCode = axiosError.response?.status

    if (!axiosError.response) {
      // Network error
      if (axiosError.code === 'ECONNABORTED') {
        return {
          type: 'TIMEOUT_ERROR',
          message: ERROR_MESSAGES.TIMEOUT_ERROR,
          originalError: error
        }
      }

      return {
        type: 'NETWORK_ERROR',
        message: ERROR_MESSAGES.NETWORK_ERROR,
        originalError: error
      }
    }

    // Server response error
    if (statusCode && statusCode >= 500) {
      return {
        type: 'SERVER_ERROR',
        message: ERROR_MESSAGES.SERVER_ERROR,
        originalError: error
      }
    }

    if (statusCode && statusCode >= 400) {
      return {
        type: 'CLIENT_ERROR',
        message: ERROR_MESSAGES.CLIENT_ERROR,
        originalError: error
      }
    }
  }

  // Generic error
  return {
    type: 'SERVER_ERROR',
    message: ERROR_MESSAGES.INTERNAL_ERROR,
    originalError: error
  }
}

// Parse API error response
export const parseApiError = (error: any): ApiError => {
  // Handle Axios errors
  if (error.isAxiosError) {
    const axiosError = error as AxiosError
    const response = axiosError.response?.data

    if (response && response.error) {
      return {
        code: response.error.code || 'UNKNOWN_ERROR',
        message: response.error.message || ERROR_MESSAGES.INTERNAL_ERROR,
        details: response.error.details,
        statusCode: axiosError.response?.status,
        requestId: response.requestId || axiosError.config?.headers?.['x-request-id']
      }
    }

    // Handle network errors without response
    if (!axiosError.response) {
      const networkError = classifyError(axiosError)
      return {
        code: networkError.type,
        message: networkError.message,
        statusCode: 0
      }
    }

    // Handle HTTP errors without proper API error format
    const statusCode = axiosError.response?.status
    return {
      code: `HTTP_${statusCode}`,
      message: getHttpStatusMessage(statusCode),
      statusCode
    }
  }

  // Handle generic errors
  if (error instanceof Error) {
    return {
      code: 'GENERIC_ERROR',
      message: error.message || ERROR_MESSAGES.INTERNAL_ERROR
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      code: 'GENERIC_ERROR',
      message: error
    }
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: ERROR_MESSAGES.INTERNAL_ERROR
  }
}

// Get HTTP status message
export const getHttpStatusMessage = (status?: number): string => {
  switch (status) {
    case 400:
      return 'Bad request. Please check your input.'
    case 401:
      return 'Authentication required. Please log in.'
    case 403:
      return 'Access denied. You do not have permission to perform this action.'
    case 404:
      return 'Resource not found.'
    case 429:
      return 'Too many requests. Please wait and try again.'
    case 500:
      return 'Internal server error. Please try again later.'
    case 502:
      return 'Service temporarily unavailable. Please try again later.'
    case 503:
      return 'Service temporarily unavailable. Please try again later.'
    case 504:
      return 'Gateway timeout. Please try again later.'
    default:
      return ERROR_MESSAGES.INTERNAL_ERROR
  }
}

// Get user-friendly error message
export const getUserFriendlyMessage = (error: ApiError): string => {
  // First check if we have a specific message for this error code
  if (ERROR_MESSAGES[error.code]) {
    return ERROR_MESSAGES[error.code]
  }

  // Use the message from the error response
  if (error.message && !error.message.includes('<!DOCTYPE')) {
    return error.message
  }

  // Fallback to generic message
  return ERROR_MESSAGES.INTERNAL_ERROR
}

// Error logging utility
export const logError = (error: any, context?: any) => {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    error: {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      status: error?.status,
      statusCode: error?.statusCode
    },
    context,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
    url: typeof window !== 'undefined' ? window.location.href : 'Server'
  }

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('Application Error:', errorInfo)
  }

  // In production, you would send this to your error tracking service
  // Example: Sentry.captureException(error, { extra: errorInfo })
}

// Retry configuration
export interface RetryConfig {
  maxRetries: number
  retryDelay: number
  retryCondition?: (error: any) => boolean
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  retryCondition: (error) => {
    // Only retry on network errors or 5xx server errors
    const networkError = classifyError(error)
    return networkError.type === 'NETWORK_ERROR' ||
           networkError.type === 'TIMEOUT_ERROR' ||
           networkError.type === 'SERVER_ERROR'
  }
}

// Retry utility
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> => {
  let lastError: any

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      if (attempt === config.maxRetries || !config.retryCondition?.(error)) {
        throw error
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, config.retryDelay * Math.pow(2, attempt)))
    }
  }

  throw lastError
}

// Error boundary fallback component helper
export const getErrorFallbackProps = (error: any) => {
  const apiError = parseApiError(error)
  const message = getUserFriendlyMessage(apiError)

  return {
    title: 'Something went wrong',
    message,
    showRetry: apiError.statusCode !== 404 && apiError.statusCode !== 403,
    errorCode: apiError.code,
    requestId: apiError.requestId
  }
}

// User-friendly error categories for UI
export const getErrorCategory = (error: ApiError): 'error' | 'warning' | 'info' => {
  const warningCodes = [
    'TEMPLATE_NOT_FOUND',
    'RATE_LIMIT_EXCEEDED',
    'STRIPE_CARD_DECLINED',
    'STRIPE_EXPIRED_CARD'
  ]

  const infoCodes = [
    'SERVICE_UNAVAILABLE',
    'TIMEOUT_ERROR'
  ]

  if (warningCodes.includes(error.code)) return 'warning'
  if (infoCodes.includes(error.code)) return 'info'
  return 'error'
}