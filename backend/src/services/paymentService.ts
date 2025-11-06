import Stripe from 'stripe'
import config from '@/utils/config'
import logger from '@/utils/logger'
import { CreateCheckoutSessionData } from '@/types'

const stripe = new Stripe(config.stripe.secretKey)

export class PaymentService {
  /**
   * Create Stripe checkout session
   */
  async createCheckoutSession(data: CreateCheckoutSessionData & { orderId: string }): Promise<Stripe.Checkout.Session> {
    try {
      const { templateId, formData, customerEmail, orderId } = data

      // Get template details to calculate price
      const { templateService } = await import('./templateService')
      const template = await templateService.getTemplateById(templateId)

      if (!template) {
        throw new Error('Template not found')
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: customerEmail,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: template.title,
                description: template.description,
                images: [], // Add template preview images if available
              },
              unit_amount: Math.round(template.price * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        metadata: {
          orderId,
          templateId,
          customerEmail,
          formData: JSON.stringify(formData),
        },
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/templates/${templateId}`,
        expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
        billing_address_collection: 'required',
        customer_creation: 'always',
        payment_intent_data: {
          metadata: {
            orderId,
            templateId,
            customerEmail,
            formData: JSON.stringify(formData),
          },
        },
      })

      logger.info('Checkout session created', {
        sessionId: session.id,
        orderId,
        templateId,
        customerEmail,
        amount: template.price,
      })

      return session
    } catch (error) {
      logger.error('Failed to create checkout session', {
        error: error instanceof Error ? error.message : 'Unknown error',
        data,
      })
      throw new Error('Failed to create checkout session')
    }
  }

  /**
   * Get checkout session by ID
   */
  async getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session | null> {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      return session
    } catch (error) {
      logger.error('Failed to retrieve checkout session', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId,
      })
      return null
    }
  }

  /**
   * Process refund
   */
  async processRefund(paymentIntentId: string, amount?: number, reason?: string): Promise<{
    success: boolean
    refundId?: string
    amount?: number
    message?: string
  }> {
    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
      }

      if (amount) {
        refundParams.amount = Math.round(amount * 100) // Convert to cents
      }

      if (reason) {
        refundParams.reason = reason as Stripe.RefundCreateParams.Reason
      }

      const refund = await stripe.refunds.create(refundParams)

      logger.info('Refund processed successfully', {
        refundId: refund.id,
        paymentIntentId,
        amount: refund.amount / 100,
        reason: refund.reason,
      })

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount / 100,
      }
    } catch (error) {
      logger.error('Failed to process refund', {
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentIntentId,
        amount,
        reason,
      })

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Refund processing failed',
      }
    }
  }

  /**
   * Get payment intent details
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent | null> {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
      return paymentIntent
    } catch (error) {
      logger.error('Failed to retrieve payment intent', {
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentIntentId,
      })
      return null
    }
  }

  /**
   * Create customer
   */
  async createCustomer(email: string, name?: string): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
      })

      logger.info('Customer created', {
        customerId: customer.id,
        email,
        name,
      })

      return customer
    } catch (error) {
      logger.error('Failed to create customer', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email,
        name,
      })
      throw new Error('Failed to create customer')
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      stripe.webhooks.constructEvent(
        payload,
        signature,
        config.stripe.webhookSecret
      )
      return true
    } catch (error) {
      logger.error('Webhook signature verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return false
    }
  }

  /**
   * Parse webhook event
   */
  static parseWebhookEvent(payload: string, signature: string): Stripe.Event {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      config.stripe.webhookSecret
    )
  }
}

export const paymentService = new PaymentService()
export default paymentService