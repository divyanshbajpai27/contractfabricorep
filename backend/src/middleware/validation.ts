import { Request, Response, NextFunction } from 'express'
import { validationResult, ValidationError } from 'express-validator'
import logger from '@/utils/logger'

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error: ValidationError) => ({
      field: error.param,
      message: error.msg,
      value: error.value,
    }))

    logger.warn('Validation failed', {
      path: req.path,
      method: req.method,
      errors: formattedErrors,
      requestId: req.headers['x-request-id'],
    })

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: formattedErrors,
      },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'],
    })
  }

  next()
}

export const handleAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// Global error handler
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.headers['x-request-id'],
  })

  // Don't expose internal errors in production
  const message = config.app.nodeEnv === 'production'
    ? 'Internal server error'
    : err.message

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message,
      ...(config.app.nodeEnv === 'development' && { stack: err.stack }),
    },
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'],
  })
}

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
    ip: req.ip,
    requestId: req.headers['x-request-id'],
  })

  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'],
  })
}