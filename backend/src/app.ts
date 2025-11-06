import express from 'express'
import cors from '@/middleware/cors'
import helmet from 'helmet'
import compression from 'compression'
import { apiRateLimit } from '@/middleware/security'
import { errorHandler, notFoundHandler } from '@/middleware/validation'
import config from '@/utils/config'
import logger from '@/utils/logger'
import { PrismaClient } from '@prisma/client'

// Import routes
import healthRoutes from '@/routes/health'
import templateRoutes from '@/routes/templates'
import paymentRoutes from '@/routes/payments'
import orderRoutes from '@/routes/orders'
import adminRoutes from '@/routes/admin'

// Create Express app
const app = express()

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com"],
    },
  },
}))

// CORS middleware
app.use(cors)

// Compression middleware
app.use(compression())

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Request logging middleware
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] as string ||
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  req.headers['x-request-id'] = requestId

  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId,
  })

  // Add response time logging
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      requestId,
    })
  })

  next()
})

// Apply rate limiting to all API routes
app.use('/api/', apiRateLimit)

// Health check routes (no rate limiting)
app.use('/api/health', healthRoutes)

// API routes
app.use('/api/templates', templateRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/admin', adminRoutes)

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'ContractFabrico API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: config.app.nodeEnv,
    documentation: '/api/health',
  })
})

// 404 handler
app.use(notFoundHandler)

// Error handler
app.use(errorHandler)

// Initialize database connection
const prisma = new PrismaClient()

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully')

  try {
    await prisma.$disconnect()
    logger.info('Database connection closed')
    process.exit(0)
  } catch (error) {
    logger.error('Error during shutdown', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    process.exit(1)
  }
})

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully')

  try {
    await prisma.$disconnect()
    logger.info('Database connection closed')
    process.exit(0)
  } catch (error) {
    logger.error('Error during shutdown', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    process.exit(1)
  }
})

// Start server
const server = app.listen(config.app.port, () => {
  logger.info('Server started', {
    port: config.app.port,
    environment: config.app.nodeEnv,
    nodeVersion: process.version,
  })
})

// Handle server errors
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.syscall !== 'listen') {
    throw error
  }

  const bind = typeof config.app.port === 'string'
    ? 'Pipe ' + config.app.port
    : 'Port ' + config.app.port

  switch (error.code) {
    case 'EACCES':
      logger.error(`${bind} requires elevated privileges`)
      process.exit(1)
      break
    case 'EADDRINUSE':
      logger.error(`${bind} is already in use`)
      process.exit(1)
      break
    default:
      throw error
  }
})

export default app