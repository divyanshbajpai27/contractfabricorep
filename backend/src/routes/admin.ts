import { Router } from 'express'
import { authenticateToken, requireAdmin } from '@/middleware/auth'
import { handleValidationErrors, validateLogin } from '@/middleware/validation'
import { loginRateLimit } from '@/middleware/security'
import { authService } from '@/services/authService'
import { adminService } from '@/services/adminService'
import logger from '@/utils/logger'

const router = Router()

// POST /api/admin/login - Admin login
router.post('/login', loginRateLimit, validateLogin, handleValidationErrors, async (req, res, next) => {
  try {
    const { email, password } = req.body

    const result = await authService.login(email, password)

    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
        timestamp: new Date().toISOString(),
      })
    }

    logger.info('Admin login successful', {
      adminId: result.admin.id,
      email: result.admin.email,
      ip: req.ip,
      requestId: req.headers['x-request-id'],
    })

    res.json({
      success: true,
      data: {
        token: result.token,
        admin: {
          id: result.admin.id,
          email: result.admin.email,
          createdAt: result.admin.createdAt,
        },
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('Admin login failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      email: req.body.email,
      ip: req.ip,
      requestId: req.headers['x-request-id'],
    })
    next(error)
  }
})

// POST /api/admin/logout - Admin logout
router.post('/logout', authenticateToken, async (req, res, next) => {
  try {
    logger.info('Admin logout', {
      adminId: req.admin?.adminId,
      email: req.admin?.email,
      requestId: req.headers['x-request-id'],
    })

    res.json({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/admin/profile - Get admin profile
router.get('/profile', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const admin = await authService.getAdminProfile(req.admin!.adminId)

    res.json({
      success: true,
      data: {
        id: admin.id,
        email: admin.email,
        createdAt: admin.createdAt,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/admin/templates - Get all templates (admin view)
router.get('/templates', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const templates = await adminService.getAllTemplates()

    res.json({
      success: true,
      data: templates,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'],
    })
  } catch (error) {
    logger.error('Failed to get admin templates', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.admin?.adminId,
      requestId: req.headers['x-request-id'],
    })
    next(error)
  }
})

// POST /api/admin/templates - Upload new template
router.post('/templates', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const templateData = req.body

    const template = await adminService.createTemplate(templateData)

    logger.info('Template created', {
      templateId: template.id,
      title: template.title,
      adminId: req.admin?.adminId,
      requestId: req.headers['x-request-id'],
    })

    res.status(201).json({
      success: true,
      data: template,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'],
    })
  } catch (error) {
    logger.error('Failed to create template', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.admin?.adminId,
      requestId: req.headers['x-request-id'],
    })
    next(error)
  }
})

// PUT /api/admin/templates/:id - Update template
router.put('/templates/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params
    const templateData = req.body

    const template = await adminService.updateTemplate(id, templateData)

    if (!template) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: 'Template not found',
        },
        timestamp: new Date().toISOString(),
      })
    }

    logger.info('Template updated', {
      templateId: template.id,
      title: template.title,
      adminId: req.admin?.adminId,
      requestId: req.headers['x-request-id'],
    })

    res.json({
      success: true,
      data: template,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'],
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/admin/templates/:id - Delete template
router.delete('/templates/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params

    const success = await adminService.deleteTemplate(id)

    if (!success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: 'Template not found',
        },
        timestamp: new Date().toISOString(),
      })
    }

    logger.info('Template deleted', {
      templateId: id,
      adminId: req.admin?.adminId,
      requestId: req.headers['x-request-id'],
    })

    res.json({
      success: true,
      data: {
        message: 'Template deleted successfully',
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/admin/orders - Get all orders
router.get('/orders', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { page = '1', limit = '50', status, search } = req.query

    const orders = await adminService.getOrders({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      status: status as string,
      search: search as string,
    })

    res.json({
      success: true,
      data: orders,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'],
    })
  } catch (error) {
    logger.error('Failed to get admin orders', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.admin?.adminId,
      requestId: req.headers['x-request-id'],
    })
    next(error)
  }
})

// GET /api/admin/orders/:id - Get order details
router.get('/orders/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params

    const order = await adminService.getOrderById(id)

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found',
        },
        timestamp: new Date().toISOString(),
      })
    }

    res.json({
      success: true,
      data: order,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'],
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/admin/orders/:id/refund - Process refund
router.post('/orders/:id/refund', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params
    const { reason } = req.body

    const refund = await adminService.processRefund(id, reason, req.admin!.adminId)

    if (!refund.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'REFUND_FAILED',
          message: refund.message || 'Refund processing failed',
        },
        timestamp: new Date().toISOString(),
      })
    }

    logger.info('Order refunded', {
      orderId: id,
      refundId: refund.refundId,
      amount: refund.amount,
      adminId: req.admin?.adminId,
      requestId: req.headers['x-request-id'],
    })

    res.json({
      success: true,
      data: {
        message: 'Refund processed successfully',
        refundId: refund.refundId,
        amount: refund.amount,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('Failed to process refund', {
      error: error instanceof Error ? error.message : 'Unknown error',
      orderId: req.params.id,
      adminId: req.admin?.adminId,
      requestId: req.headers['x-request-id'],
    })
    next(error)
  }
})

// GET /api/admin/analytics - Get revenue analytics
router.get('/analytics', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { period = '30d' } = req.query

    const analytics = await adminService.getAnalytics(period as string)

    res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'],
    })
  } catch (error) {
    logger.error('Failed to get analytics', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.admin?.adminId,
      requestId: req.headers['x-request-id'],
    })
    next(error)
  }
})

export default router