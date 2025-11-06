import rateLimit from 'express-rate-limit'
import { Request, Response } from 'express'
import config from '@/utils/config'
import logger from '@/utils/logger'

// General API rate limiting
export const apiRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000', 10), // 1 hour
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // 100 requests per hour
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
    },
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      requestId: req.headers['x-request-id'],
    })

    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.',
      },
      timestamp: new Date().toISOString(),
    })
  },
})

// Document generation rate limiting
export const documentRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000', 10), // 1 hour
  max: parseInt(process.env.RATE_LIMIT_DOCUMENTS_MAX || '30', 10), // 30 documents per hour
  keyGenerator: (req: Request) => {
    return req.ip || 'unknown'
  },
  message: {
    success: false,
    error: {
      code: 'DOCUMENT_RATE_LIMIT_EXCEEDED',
      message: 'Too many document generations from this IP. Limit: 30 per hour.',
    },
    timestamp: new Date().toISOString(),
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Document generation rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      requestId: req.headers['x-request-id'],
    })

    res.status(429).json({
      success: false,
      error: {
        code: 'DOCUMENT_RATE_LIMIT_EXCEEDED',
        message: 'Too many document generations from this IP. Limit: 30 per hour.',
      },
      timestamp: new Date().toISOString(),
    })
  },
})

// Admin login rate limiting
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  skipSuccessfulRequests: true,
  keyGenerator: (req: Request) => {
    return req.ip || 'unknown'
  },
  message: {
    success: false,
    error: {
      code: 'LOGIN_RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts, please try again in 15 minutes.',
    },
    timestamp: new Date().toISOString(),
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Login rate limit exceeded', {
      ip: req.ip,
      email: req.body.email,
      userAgent: req.get('User-Agent'),
      path: req.path,
    })

    res.status(429).json({
      success: false,
      error: {
        code: 'LOGIN_RATE_LIMIT_EXCEEDED',
        message: 'Too many login attempts, please try again in 15 minutes.',
      },
      timestamp: new Date().toISOString(),
    })
  },
})

// Stripe webhook rate limiting (more permissive)
export const webhookRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 webhooks per minute
  skip: (req: Request) => {
    // Skip rate limiting for legitimate Stripe webhooks
    const stripeSignature = req.headers['stripe-signature']
    return !!stripeSignature
  },
})