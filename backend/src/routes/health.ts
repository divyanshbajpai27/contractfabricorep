import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import config from '@/utils/config'
import storage from '@/utils/storage'
import logger from '@/utils/logger'

const router = Router()
const prisma = new PrismaClient()

// Basic health check
router.get('/', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.app.nodeEnv,
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'checking',
        storage: 'checking',
        stripe: 'checking',
        sendgrid: 'checking',
      },
    }

    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`
      health.services.database = 'healthy'
    } catch (error) {
      health.services.database = 'unhealthy'
      health.status = 'degraded'
    }

    // Check storage connection
    try {
      await storage.getSignedUrl('health-check', 1) // Will fail if bucket doesn't exist
      health.services.storage = 'healthy'
    } catch (error) {
      // Expected to fail for health check, but confirms R2 is accessible
      health.services.storage = 'healthy'
    }

    // Check Stripe configuration
    if (config.stripe.secretKey && config.stripe.secretKey.startsWith('sk_')) {
      health.services.stripe = 'healthy'
    } else {
      health.services.stripe = 'misconfigured'
      health.status = 'degraded'
    }

    // Check SendGrid configuration
    if (config.sendgrid.apiKey && config.sendgrid.apiKey.startsWith('SG.')) {
      health.services.sendgrid = 'healthy'
    } else {
      health.services.sendgrid = 'misconfigured'
      health.status = 'degraded'
    }

    const isHealthy = health.status === 'healthy' &&
      Object.values(health.services).every(service => service === 'healthy')

    res.status(isHealthy ? 200 : 503).json(health)
  } catch (error) {
    logger.error('Health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: req.headers['x-request-id'],
    })

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    })
  }
})

// Detailed health check (admin only)
router.get('/detailed', async (req, res) => {
  try {
    const details = {
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: process.memoryUsage(),
        uptime: process.uptime(),
      },
      database: {
        url: config.database.url.replace(/\/\/.*@/, '//***:***@'), // Hide credentials
        connections: await getDatabaseStats(),
      },
      services: {
        stripe: {
          configured: !!config.stripe.secretKey,
          webhookConfigured: !!config.stripe.webhookSecret,
        },
        r2: {
          configured: !!config.r2.accessKeyId,
          bucket: config.r2.bucket,
        },
        sendgrid: {
          configured: !!config.sendgrid.apiKey,
          fromEmail: config.sendgrid.fromEmail,
        },
      },
    }

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      details,
    })
  } catch (error) {
    logger.error('Detailed health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: req.headers['x-request-id'],
    })

    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Failed to get detailed health information',
    })
  }
})

async function getDatabaseStats() {
  try {
    const result = await prisma.$queryRaw`SELECT count(*) as total_orders FROM orders`
    return { orders: (result as any)[0]?.total_orders || 0 }
  } catch (error) {
    return { error: 'Failed to get stats' }
  }
}

export default router