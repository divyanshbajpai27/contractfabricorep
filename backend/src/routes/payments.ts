import { Router } from 'express'
import Stripe from 'stripe'
import { handleValidationErrors, validateCreateCheckoutSession } from '@/middleware/validation'
import { paymentService } from '@/services/paymentService'
import { orderService } from '@/services/orderService'
import { emailService } from '@/services/emailService'
import { documentService } from '@/services/documentService'
import logger from '@/utils/logger'
import config from '@/utils/config'

const router = Router()
const stripe = new Stripe(config.stripe.secretKey)

// POST /api/payment/create-checkout-session - Create Stripe checkout session
router.post('/create-checkout-session', validateCreateCheckoutSession, handleValidationErrors, async (req, res, next) => {
  try {
    const { templateId, formData, customerEmail } = req.body

    // Create pending order first
    const order = await orderService.createPendingOrder({
      templateId,
      formData,
      customerEmail,
    })

    // Create Stripe checkout session
    const session = await paymentService.createCheckoutSession({
      templateId,
      formData,
      customerEmail,
      orderId: order.id,
    })

    logger.info('Checkout session created', {
      orderId: order.id,
      sessionId: session.id,
      customerEmail,
      templateId,
      requestId: req.headers['x-request-id'],
    })

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        orderId: order.id,
      },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'],
    })
  } catch (error) {
    logger.error('Failed to create checkout session', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body,
      requestId: req.headers['x-request-id'],
    })
    next(error)
  }
})

// POST /api/payment/webhook - Stripe webhook handler
router.post('/webhook', async (req, res, next) => {
  const sig = req.headers['stripe-signature'] as string

  if (!sig) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'WEBHOOK_SIGNATURE_MISSING',
        message: 'Stripe signature is required',
      },
      timestamp: new Date().toISOString(),
    })
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripe.webhookSecret
    )

    logger.info('Stripe webhook received', {
      type: event.type,
      eventId: event.id,
      requestId: req.headers['x-request-id'],
    })

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(event.data.object as Stripe.Checkout.Session)
        break

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break

      default:
        logger.info('Unhandled webhook event', {
          type: event.type,
          eventId: event.id,
        })
    }

    res.json({ received: true })
  } catch (error) {
    logger.error('Webhook signature verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      sig: sig.substring(0, 20) + '...',
      requestId: req.headers['x-request-id'],
    })

    return res.status(400).json({
      success: false,
      error: {
        code: 'WEBHOOK_SIGNATURE_INVALID',
        message: 'Invalid signature',
      },
      timestamp: new Date().toISOString(),
    })
  }
})

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    const { orderId, templateId, customerEmail, formData } = session.metadata || {}

    if (!orderId || !templateId || !customerEmail || !formData) {
      throw new Error('Missing required metadata in checkout session')
    }

    // Update order status to paid
    const order = await orderService.updateOrderStatus(orderId, 'paid', {
      stripePaymentId: session.payment_intent as string,
      amount: session.amount_total ? session.amount_total / 100 : 0,
    })

    // Generate documents
    const documents = await documentService.generateDocuments(
      templateId,
      JSON.parse(formData),
      order
    )

    // Update order with document URLs
    await orderService.updateOrderDocuments(orderId, {
      pdfUrl: documents.pdfUrl,
      docxUrl: documents.docxUrl,
    })

    // Send confirmation email
    await emailService.sendOrderConfirmation({
      to: customerEmail,
      order,
      documents,
    })

    logger.info('Order completed successfully', {
      orderId,
      templateId,
      customerEmail,
      stripePaymentId: session.payment_intent,
      requestId: 'webhook',
    })
  } catch (error) {
    logger.error('Failed to handle checkout session completed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      sessionId: session.id,
      metadata: session.metadata,
    })
    throw error
  }
}

async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
  try {
    const { orderId } = session.metadata || {}

    if (orderId) {
      await orderService.updateOrderStatus(orderId, 'failed')
      logger.info('Checkout session expired', {
        orderId,
        sessionId: session.id,
      })
    }
  } catch (error) {
    logger.error('Failed to handle checkout session expired', {
      error: error instanceof Error ? error.message : 'Unknown error',
      sessionId: session.id,
    })
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  logger.info('Payment succeeded', {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
  })
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  logger.error('Payment failed', {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    lastPaymentError: paymentIntent.last_payment_error,
  })

  // Update order status if we can find it
  // This would require additional metadata handling
}

export default router