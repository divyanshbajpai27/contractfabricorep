import { PrismaClient } from '@prisma/client'
import { Order, Template } from '@/types'
import { emailService } from '@/services/emailService'
import logger from '@/utils/logger'
import storage from '@/utils/storage'

const prisma = new PrismaClient()

export class OrderService {
  /**
   * Create a pending order
   */
  async createPendingOrder(data: {
    templateId: string
    formData: Record<string, any>
    customerEmail: string
  }): Promise<Order> {
    try {
      const { templateId, formData, customerEmail } = data

      // Get template details
      const template = await prisma.template.findUnique({
        where: { id: templateId },
      })

      if (!template) {
        throw new Error('Template not found')
      }

      // Create order with 7-day download expiry
      const downloadExpiry = new Date()
      downloadExpiry.setDate(downloadExpiry.getDate() + 7)

      const order = await prisma.order.create({
        data: {
          templateId,
          customerEmail,
          formData,
          amount: template.price,
          status: 'pending',
          downloadExpiry,
          stripePaymentId: '', // Will be updated after payment
        },
        include: {
          template: true,
        },
      })

      // Convert to Order type
      const formattedOrder: Order = {
        id: order.id,
        templateId: order.templateId,
        template: {
          id: order.template.id,
          title: order.template.title,
          category: order.template.category,
          jurisdiction: order.template.jurisdiction,
          price: order.template.price,
          description: order.template.description,
          placeholders: order.template.placeholders as any,
          content: order.template.content as any,
          source: order.template.source as any,
          metadata: order.template.metadata as any,
          createdAt: order.template.createdAt,
          updatedAt: order.template.updatedAt,
        },
        customerEmail: order.customerEmail,
        formData: order.formData,
        stripePaymentId: order.stripePaymentId,
        amount: order.amount,
        status: order.status as 'pending' | 'paid' | 'failed' | 'refunded',
        pdfUrl: order.pdfUrl,
        docxUrl: order.docxUrl,
        downloadExpiry: order.downloadExpiry,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      }

      logger.info('Pending order created', {
        orderId: order.id,
        templateId,
        customerEmail,
        amount: template.price,
      })

      return formattedOrder
    } catch (error) {
      logger.error('Failed to create pending order', {
        error: error instanceof Error ? error.message : 'Unknown error',
        data,
      })
      throw new Error('Failed to create order')
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    status: 'pending' | 'paid' | 'failed' | 'refunded',
    additionalData: {
      stripePaymentId?: string
      amount?: number
    } = {}
  ): Promise<Order> {
    try {
      const updateData: any = { status }

      if (additionalData.stripePaymentId) {
        updateData.stripePaymentId = additionalData.stripePaymentId
      }

      if (additionalData.amount) {
        updateData.amount = additionalData.amount
      }

      const order = await prisma.order.update({
        where: { id: orderId },
        data: updateData,
        include: { template: true },
      })

      // Convert to Order type
      const formattedOrder: Order = {
        id: order.id,
        templateId: order.templateId,
        template: {
          id: order.template.id,
          title: order.template.title,
          category: order.template.category,
          jurisdiction: order.template.jurisdiction,
          price: order.template.price,
          description: order.template.description,
          placeholders: order.template.placeholders as any,
          content: order.template.content as any,
          source: order.template.source as any,
          metadata: order.template.metadata as any,
          createdAt: order.template.createdAt,
          updatedAt: order.template.updatedAt,
        },
        customerEmail: order.customerEmail,
        formData: order.formData,
        stripePaymentId: order.stripePaymentId,
        amount: order.amount,
        status: order.status as 'pending' | 'paid' | 'failed' | 'refunded',
        pdfUrl: order.pdfUrl,
        docxUrl: order.docxUrl,
        downloadExpiry: order.downloadExpiry,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      }

      logger.info('Order status updated', {
        orderId,
        oldStatus: order.status,
        newStatus: status,
      })

      return formattedOrder
    } catch (error) {
      logger.error('Failed to update order status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        orderId,
        status,
      })
      throw new Error('Failed to update order status')
    }
  }

  /**
   * Update order with document URLs
   */
  async updateOrderDocuments(orderId: string, documents: {
    pdfUrl?: string
    docxUrl?: string
  }): Promise<void> {
    try {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          pdfUrl: documents.pdfUrl,
          docxUrl: documents.docxUrl,
        },
      })

      logger.info('Order documents updated', {
        orderId,
        hasPdf: !!documents.pdfUrl,
        hasDocx: !!documents.docxUrl,
      })
    } catch (error) {
      logger.error('Failed to update order documents', {
        error: error instanceof Error ? error.message : 'Unknown error',
        orderId,
      })
      throw new Error('Failed to update order documents')
    }
  }

  /**
   * Get order by ID and email (for customer access)
   */
  async getOrderByIdAndEmail(orderId: string, email: string): Promise<Order | null> {
    try {
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          customerEmail: email,
        },
        include: {
          template: true,
        },
      })

      if (!order) {
        return null
      }

      // Convert to Order type
      const formattedOrder: Order = {
        id: order.id,
        templateId: order.templateId,
        template: {
          id: order.template.id,
          title: order.template.title,
          category: order.template.category,
          jurisdiction: order.template.jurisdiction,
          price: order.template.price,
          description: order.template.description,
          placeholders: order.template.placeholders as any,
          content: order.template.content as any,
          source: order.template.source as any,
          metadata: order.template.metadata as any,
          createdAt: order.template.createdAt,
          updatedAt: order.template.updatedAt,
        },
        customerEmail: order.customerEmail,
        formData: order.formData,
        stripePaymentId: order.stripePaymentId,
        amount: order.amount,
        status: order.status as 'pending' | 'paid' | 'failed' | 'refunded',
        pdfUrl: order.pdfUrl,
        docxUrl: order.docxUrl,
        downloadExpiry: order.downloadExpiry,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      }

      return formattedOrder
    } catch (error) {
      logger.error('Failed to get order by ID and email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        orderId,
        email,
      })
      throw new Error('Failed to retrieve order')
    }
  }

  /**
   * Get fresh download links for an order
   */
  async getDownloadLinks(orderId: string): Promise<{ pdfUrl: string; docxUrl: string }> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      })

      if (!order) {
        throw new Error('Order not found')
      }

      if (!order.pdfUrl || !order.docxUrl) {
        throw new Error('Documents not available')
      }

      // Extract file keys from URLs
      const pdfKey = order.pdfUrl.split('/').pop() || ''
      const docxKey = order.docxUrl.split('/').pop() || ''

      // Generate fresh signed URLs
      const [pdfSignedUrl, docxSignedUrl] = await Promise.all([
        storage.getSignedUrl(`documents/${orderId}/${pdfKey}`),
        storage.getSignedUrl(`documents/${orderId}/${docxKey}`),
      ])

      return {
        pdfUrl: pdfSignedUrl,
        docxUrl: docxSignedUrl,
      }
    } catch (error) {
      logger.error('Failed to get download links', {
        error: error instanceof Error ? error.message : 'Unknown error',
        orderId,
      })
      throw new Error('Failed to generate download links')
    }
  }

  /**
   * Resend confirmation email
   */
  async resendConfirmationEmail(order: Order): Promise<void> {
    try {
      if (!order.pdfUrl || !order.docxUrl) {
        throw new Error('Documents not available for this order')
      }

      const downloadLinks = await this.getDownloadLinks(order.id)

      await emailService.sendOrderConfirmation({
        to: order.customerEmail,
        order,
        documents: downloadLinks,
      })

      logger.info('Confirmation email resent', {
        orderId: order.id,
        to: order.customerEmail,
      })
    } catch (error) {
      logger.error('Failed to resend confirmation email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        orderId: order.id,
      })
      throw new Error('Failed to resend confirmation email')
    }
  }

  /**
   * Clean up expired orders and documents
   */
  async cleanupExpiredOrders(): Promise<void> {
    try {
      const expiredOrders = await prisma.order.findMany({
        where: {
          downloadExpiry: {
            lt: new Date(),
          },
          status: 'paid',
        },
      })

      for (const order of expiredOrders) {
        try {
          // Delete documents from storage
          if (order.pdfUrl) {
            const pdfKey = `documents/${order.id}/${order.pdfUrl.split('/').pop()}`
            await storage.deleteFile(pdfKey)
          }

          if (order.docxUrl) {
            const docxKey = `documents/${order.id}/${order.docxUrl.split('/').pop()}`
            await storage.deleteFile(docxKey)
          }

          // Update order to remove document URLs
          await prisma.order.update({
            where: { id: order.id },
            data: {
              pdfUrl: null,
              docxUrl: null,
            },
          })

          logger.info('Cleaned up expired order', {
            orderId: order.id,
            expiredAt: order.downloadExpiry,
          })
        } catch (error) {
          logger.error('Failed to cleanup expired order', {
            error: error instanceof Error ? error.message : 'Unknown error',
            orderId: order.id,
          })
        }
      }

      logger.info('Expired orders cleanup completed', {
        totalProcessed: expiredOrders.length,
      })
    } catch (error) {
      logger.error('Failed to cleanup expired orders', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}

export const orderService = new OrderService()
export default orderService