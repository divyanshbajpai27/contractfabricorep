import { Router } from 'express'
import { handleValidationErrors, validateOrderId, validateEmailQuery } from '@/middleware/validation'
import { orderService } from '@/services/orderService'
import logger from '@/utils/logger'

const router = Router()

// GET /api/orders/:id - Get order status (requires email verification)
router.get('/:id', validateOrderId, validateEmailQuery, handleValidationErrors, async (req, res, next) => {
  try {
    const { id } = req.params
    const { email } = req.query as { email: string }

    const order = await orderService.getOrderByIdAndEmail(id, email)

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found or email does not match',
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'],
      })
    }

    // Don't expose sensitive internal data
    const sanitizedOrder = {
      id: order.id,
      templateId: order.templateId,
      status: order.status,
      amount: order.amount,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      downloadExpiry: order.downloadExpiry,
    }

    res.json({
      success: true,
      data: sanitizedOrder,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'],
    })
  } catch (error) {
    logger.error('Failed to get order', {
      error: error instanceof Error ? error.message : 'Unknown error',
      orderId: req.params.id,
      requestId: req.headers['x-request-id'],
    })
    next(error)
  }
})

// GET /api/orders/:id/download - Get download links (requires email verification)
router.get('/:id/download', validateOrderId, validateEmailQuery, handleValidationErrors, async (req, res, next) => {
  try {
    const { id } = req.params
    const { email } = req.query as { email: string }

    const order = await orderService.getOrderByIdAndEmail(id, email)

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found or email does not match',
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'],
      })
    }

    if (order.status !== 'paid') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ORDER_NOT_PAID',
          message: 'Order is not paid. Documents are only available for completed orders.',
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'],
      })
    }

    if (new Date() > order.downloadExpiry) {
      return res.status(410).json({
        success: false,
        error: {
          code: 'DOWNLOAD_EXPIRED',
          message: 'Download links have expired. Documents are available for 7 days after purchase.',
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'],
      })
    }

    if (!order.pdfUrl || !order.docxUrl) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'DOCUMENTS_NOT_READY',
          message: 'Documents are still being generated. Please try again in a few minutes.',
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'],
      })
    }

    // Generate fresh signed URLs
    const downloadLinks = await orderService.getDownloadLinks(id)

    res.json({
      success: true,
      data: {
        pdfUrl: downloadLinks.pdfUrl,
        docxUrl: downloadLinks.docxUrl,
        expiresAt: order.downloadExpiry,
        remainingTime: Math.max(0, order.downloadExpiry.getTime() - new Date().getTime()),
      },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'],
    })
  } catch (error) {
    logger.error('Failed to get download links', {
      error: error instanceof Error ? error.message : 'Unknown error',
      orderId: req.params.id,
      requestId: req.headers['x-request-id'],
    })
    next(error)
  }
})

// POST /api/orders/:id/resend-email - Resend order confirmation email
router.post('/:id/resend-email', validateOrderId, handleValidationErrors, async (req, res, next) => {
  try {
    const { id } = req.params
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMAIL_REQUIRED',
          message: 'Email address is required',
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'],
      })
    }

    const order = await orderService.getOrderByIdAndEmail(id, email)

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found or email does not match',
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'],
      })
    }

    if (order.status !== 'paid') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ORDER_NOT_PAID',
          message: 'Can only resend emails for paid orders',
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'],
      })
    }

    // Resend confirmation email
    await orderService.resendConfirmationEmail(order)

    res.json({
      success: true,
      data: {
        message: 'Confirmation email has been resent',
        sentTo: email,
      },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'],
    })
  } catch (error) {
    logger.error('Failed to resend confirmation email', {
      error: error instanceof Error ? error.message : 'Unknown error',
      orderId: req.params.id,
      requestId: req.headers['x-request-id'],
    })
    next(error)
  }
})

export default router