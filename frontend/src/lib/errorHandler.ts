import type { ApiResponse } from '@/types'

// Error types
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface AppError {
  type: ErrorType
  message: string
  code?: string
  details?: any
  requestId?: string
  timestamp: string
  originalError?: Error
}

export class ErrorHandler {
  // Parse API response error
  static parseApiError(response?: ApiResponse): AppError {
    if (!response?.error) {
      return this.createUnknownError(new Error('Unknown API error'))
    }

    const { error } = response

    // Determine error type based on status code or error code
    let type: ErrorType
    switch (error.code) {
      case 'VALIDATION_ERROR':
      case 'INVALID_INPUT':
      case 'MISSING_REQUIRED_FIELD':
        type = ErrorType.VALIDATION_ERROR
        break
      case 'UNAUTHORIZED':
      case 'INVALID_TOKEN':
      case 'TOKEN_EXPIRED':
        type = ErrorType.AUTHENTICATION_ERROR
        break
      case 'FORBIDDEN':
      case 'INSUFFICIENT_PERMISSIONS':
        type = ErrorType.AUTHORIZATION_ERROR
        break
      case 'NOT_FOUND':
      case 'RESOURCE_NOT_FOUND':
        type = ErrorType.NOT_FOUND_ERROR
        break
      case 'RATE_LIMIT_EXCEEDED':
        type = ErrorType.SERVER_ERROR
        break
      default:
        type = ErrorType.SERVER_ERROR
    }

    return {
      type,
      message: error.message,
      code: error.code,
      details: error.details,
      requestId: response.requestId,
      timestamp: response.timestamp || new Date().toISOString(),
    }
  }

  // Parse network/Axios error
  static parseNetworkError(error: any): AppError {
    if (!error.response) {
      // Network error (no response received)
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return this.createTimeoutError(error)
      }
      if (error.code === 'ERR_NETWORK' || !navigator.onLine) {
        return this.createNetworkError(error)
      }
      return this.createUnknownError(error)
    }

    // We received a response, parse it
    const status = error.response.status
    const data = error.response.data

    if (data && typeof data === 'object') {
      return this.parseApiError(data)
    }

    // Fallback to HTTP status code
    return this.createHttpError(status, error)
  }

  // Create specific error types
  static createNetworkError(originalError?: Error): AppError {
    return {
      type: ErrorType.NETWORK_ERROR,
      message: 'Network error. Please check your internet connection and try again.',
      originalError,
      timestamp: new Date().toISOString(),
    }
  }

  static createTimeoutError(originalError?: Error): AppError {
    return {
      type: ErrorType.TIMEOUT_ERROR,
      message: 'Request timed out. Please try again.',
      originalError,
      timestamp: new Date().toISOString(),
    }
  }

  static createValidationError(message: string, details?: any): AppError {
    return {
      type: ErrorType.VALIDATION_ERROR,
      message,
      details,
      timestamp: new Date().toISOString(),
    }
  }

  static createAuthenticationError(message: string = 'Authentication required'): AppError {
    return {
      type: ErrorType.AUTHENTICATION_ERROR,
      message,
      timestamp: new Date().toISOString(),
    }
  }

  static createAuthorizationError(message: string = 'You do not have permission to perform this action'): AppError {
    return {
      type: ErrorType.AUTHORIZATION_ERROR,
      message,
      timestamp: new Date().toISOString(),
    }
  }

  static createNotFoundError(resource: string = 'Resource'): AppError {
    return {
      type: ErrorType.NOT_FOUND_ERROR,
      message: `${resource} not found.`,
      timestamp: new Date().toISOString(),
    }
  }

  static createServerError(message: string = 'Server error occurred'): AppError {
    return {
      type: ErrorType.SERVER_ERROR,
      message,
      timestamp: new Date().toISOString(),
    }
  }

  static createUnknownError(originalError?: Error): AppError {
    return {
      type: ErrorType.UNKNOWN_ERROR,
      message: 'An unexpected error occurred. Please try again.',
      originalError,
      timestamp: new Date().toISOString(),
    }
  }

  private static createHttpError(status: number, originalError?: Error): AppError {
    switch (status) {
      case 400:
        return {
          type: ErrorType.VALIDATION_ERROR,
          message: 'Invalid request. Please check your input and try again.',
          code: 'BAD_REQUEST',
          originalError,
          timestamp: new Date().toISOString(),
        }
      case 401:
        return {
          type: ErrorType.AUTHENTICATION_ERROR,
          message: 'Authentication required. Please log in.',
          code: 'UNAUTHORIZED',
          originalError,
          timestamp: new Date().toISOString(),
        }
      case 403:
        return {
          type: ErrorType.AUTHORIZATION_ERROR,
          message: 'You do not have permission to perform this action.',
          code: 'FORBIDDEN',
          originalError,
          timestamp: new Date().toISOString(),
        }
      case 404:
        return {
          type: ErrorType.NOT_FOUND_ERROR,
          message: 'The requested resource was not found.',
          code: 'NOT_FOUND',
          originalError,
          timestamp: new Date().toISOString(),
        }
      case 429:
        return {
          type: ErrorType.SERVER_ERROR,
          message: 'Too many requests. Please wait a moment before trying again.',
          code: 'RATE_LIMIT_EXCEEDED',
          originalError,
          timestamp: new Date().toISOString(),
        }
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: ErrorType.SERVER_ERROR,
          message: 'Server error occurred. Please try again later.',
          code: 'SERVER_ERROR',
          originalError,
          timestamp: new Date().toISOString(),
        }
      default:
        return {
          type: ErrorType.UNKNOWN_ERROR,
          message: `HTTP error ${status}. Please try again.`,
          code: `HTTP_${status}`,
          originalError,
          timestamp: new Date().toISOString(),
        }
    }
  }

  // Get user-friendly error message
  static getErrorMessage(error: AppError | Error | string): string {
    if (typeof error === 'string') {
      return error
    }

    if (error instanceof Error) {
      return this.parseNetworkError(error).message
    }

    if ('type' in error) {
      return error.message
    }

    return 'An unexpected error occurred. Please try again.'
  }

  // Check if error is recoverable
  static isRecoverable(error: AppError): boolean {
    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
      case ErrorType.TIMEOUT_ERROR:
      case ErrorType.SERVER_ERROR:
        return true
      case ErrorType.VALIDATION_ERROR:
      case ErrorType.AUTHENTICATION_ERROR:
      case ErrorType.AUTHORIZATION_ERROR:
      case ErrorType.NOT_FOUND_ERROR:
      case ErrorType.UNKNOWN_ERROR:
        return false
    }
  }

  // Get retry delay for retryable errors
  static getRetryDelay(error: AppError, attempt: number): number {
    if (!this.isRecoverable(error)) {
      return -1 // Don't retry
    }

    // Exponential backoff with jitter
    const baseDelay = 1000 // 1 second
    const maxDelay = 30000 // 30 seconds
    const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
    const jitter = Math.random() * 0.3 * exponentialDelay // Add up to 30% jitter

    return Math.round(exponentialDelay + jitter)
  }

  // Log error for debugging and monitoring
  static logError(error: AppError, context?: any): void {
    const logData = {
      error: {
        type: error.type,
        message: error.message,
        code: error.code,
        details: error.details,
        requestId: error.requestId,
        timestamp: error.timestamp,
      },
      context,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
      url: typeof window !== 'undefined' ? window.location.href : 'Server',
    }

    if (process.env.NODE_ENV === 'development') {
      console.error('Application Error:', logData)
      if (error.originalError) {
        console.error('Original Error:', error.originalError)
      }
    } else {
      // In production, send to error tracking service
      console.error('Error logged:', logData.error)

      // Example: Send to error tracking service
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'exception', {
          description: error.message,
          fatal: false,
          custom_map: {
            error_type: error.type,
            error_code: error.code,
            request_id: error.requestId,
          },
        })
      }
    }
  }
}

// Error boundary for React components
export class ErrorBoundary {
  private static instance: ErrorBoundary
  private errors: AppError[] = []
  private maxErrors = 50

  static getInstance(): ErrorBoundary {
    if (!ErrorBoundary.instance) {
      ErrorBoundary.instance = new ErrorBoundary()
    }
    return ErrorBoundary.instance
  }

  addError(error: AppError): void {
    this.errors.unshift(error)
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors)
    }
    ErrorHandler.logError(error)
  }

  getErrors(): AppError[] {
    return [...this.errors]
  }

  clearErrors(): void {
    this.errors = []
  }

  getErrorCount(): number {
    return this.errors.length
  }
}

// Retry mechanism for failed requests
export class RetryHandler {
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    context?: string
  ): Promise<T> {
    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error: any) {
        lastError = error
        const appError = ErrorHandler.parseNetworkError(error)

        if (attempt === maxRetries || !ErrorHandler.isRecoverable(appError)) {
          throw appError
        }

        const delay = ErrorHandler.getRetryDelay(appError, attempt)
        if (delay > 0) {
          console.warn(`Retrying operation in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`, context)
          await new Promise(resolve => setTimeout(resolve, delay))
        } else {
          throw appError
        }
      }
    }

    throw lastError!
  }
}

// Hook for error handling in React components
export function useErrorHandler() {
  const handleError = (error: Error | AppError | string, context?: any) => {
    let appError: AppError

    if (typeof error === 'string') {
      appError = ErrorHandler.createUnknownError(new Error(error))
    } else if (error instanceof Error) {
      appError = ErrorHandler.parseNetworkError(error)
    } else {
      appError = error
    }

    ErrorHandler.logError(appError, context)
    ErrorBoundary.getInstance().addError(appError)

    return appError
  }

  const getUserFriendlyMessage = (error: Error | AppError | string): string => {
    return ErrorHandler.getErrorMessage(error)
  }

  const isRecoverable = (error: AppError): boolean => {
    return ErrorHandler.isRecoverable(error)
  }

  return {
    handleError,
    getUserFriendlyMessage,
    isRecoverable,
    createError: {
      validation: ErrorHandler.createValidationError,
      authentication: ErrorHandler.createAuthenticationError,
      authorization: ErrorHandler.createAuthorizationError,
      notFound: ErrorHandler.createNotFoundError,
      server: ErrorHandler.createServerError,
      network: ErrorHandler.createNetworkError,
      timeout: ErrorHandler.createTimeoutError,
      unknown: ErrorHandler.createUnknownError,
    },
  }
}

export default ErrorHandler