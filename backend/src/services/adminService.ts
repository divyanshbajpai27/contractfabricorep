import { PrismaClient } from '@prisma/client'
import { Template, Order, RevenueAnalytics } from '@/types'
import { paymentService } from '@/services/paymentService'
import logger from '@/utils/logger'

const prisma = new PrismaClient()

export class AdminService {
  /**
   * Get all templates with full details
   */
  async getAllTemplates(): Promise<Template[]> {
    try {
      const templates = await prisma.template.findMany({
        orderBy: { createdAt: 'desc' },
      })

      return templates.map(template => ({
        id: template.id,
        title: template.title,
        category: template.category,
        jurisdiction: template.jurisdiction,
        price: template.price,
        description: template.description,
        placeholders: template.placeholders as any,
        content: template.content as any,
        source: template.source as any,
        metadata: template.metadata as any,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      }))
    } catch (error) {
      logger.error('Failed to get all templates', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw new Error('Failed to retrieve templates')
    }
  }

  /**
   * Create new template
   */
  async createTemplate(templateData: any): Promise<Template> {
    try {
      const template = await prisma.template.create({
        data: {
          id: templateData.id,
          title: templateData.title,
          category: templateData.category,
          jurisdiction: templateData.jurisdiction || 'California',
          price: templateData.price,
          description: templateData.description,
          placeholders: templateData.placeholders,
          content: templateData.content,
          source: templateData.source,
          metadata: templateData.metadata,
        },
      })

      logger.info('Template created', {
        templateId: template.id,
        title: template.title,
        category: template.category,
      })

      return {
        id: template.id,
        title: template.title,
        category: template.category,
        jurisdiction: template.jurisdiction,
        price: template.price,
        description: template.description,
        placeholders: template.placeholders as any,
        content: template.content as any,
        source: template.source as any,
        metadata: template.metadata as any,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      }
    } catch (error) {
      logger.error('Failed to create template', {
        error: error instanceof Error ? error.message : 'Unknown error',
        templateData,
      })
      throw new Error('Failed to create template')
    }
  }

  /**
   * Update existing template
   */
  async updateTemplate(templateId: string, templateData: any): Promise<Template | null> {
    try {
      const template = await prisma.template.update({
        where: { id: templateId },
        data: {
          title: templateData.title,
          category: templateData.category,
          jurisdiction: templateData.jurisdiction,
          price: templateData.price,
          description: templateData.description,
          placeholders: templateData.placeholders,
          content: templateData.content,
          source: templateData.source,
          metadata: templateData.metadata,
          updatedAt: new Date(),
        },
      })

      logger.info('Template updated', {
        templateId,
        title: template.title,
      })

      return {
        id: template.id,
        title: template.title,
        category: template.category,
        jurisdiction: template.jurisdiction,
        price: template.price,
        description: template.description,
        placeholders: template.placeholders as any,
        content: template.content as any,
        source: template.source as any,
        metadata: template.metadata as any,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      }
    } catch (error) {
      logger.error('Failed to update template', {
        error: error instanceof Error ? error.message : 'Unknown error',
        templateId,
      })
      return null
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      await prisma.template.delete({
        where: { id: templateId },
      })

      logger.info('Template deleted', { templateId })
      return true
    } catch (error) {
      logger.error('Failed to delete template', {
        error: error instanceof Error ? error.message : 'Unknown error',
        templateId,
      })
      return false
    }
  }

  /**
   * Get orders with pagination and filtering
   */
  async getOrders(options: {
    page: number
    limit: number
    status?: string
    search?: string
  }): Promise<{
    orders: Order[]
    total: number
    page: number
    totalPages: number
  }> {
    try {
      const { page, limit, status, search } = options
      const skip = (page - 1) * limit

      const where: any = {}

      if (status) {
        where.status = status
      }

      if (search) {
        where.OR = [
          { customerEmail: { contains: search, mode: 'insensitive' } },
          { stripePaymentId: { contains: search, mode: 'insensitive' } },
          { template: { title: { contains: search, mode: 'insensitive' } } },
        ]
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: { template: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.order.count({ where }),
      ])

      const formattedOrders = orders.map(order => ({
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
      }))

      return {
        orders: formattedOrders,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      }
    } catch (error) {
      logger.error('Failed to get orders', {
        error: error instanceof Error ? error.message : 'Unknown error',
        options,
      })
      throw new Error('Failed to retrieve orders')
    }
  }

  /**
   * Get order by ID (admin view)
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { template: true },
      })

      if (!order) {
        return null
      }

      return {
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
    } catch (error) {
      logger.error('Failed to get order by ID', {
        error: error instanceof Error ? error.message : 'Unknown error',
        orderId,
      })
      throw new Error('Failed to retrieve order')
    }
  }

  /**
   * Process refund
   */
  async processRefund(orderId: string, reason: string, adminId: string): Promise<{
    success: boolean
    refundId?: string
    amount?: number
    message?: string
  }> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      })

      if (!order) {
        return { success: false, message: 'Order not found' }
      }

      if (order.status !== 'paid') {
        return { success: false, message: 'Only paid orders can be refunded' }
      }

      if (order.status === 'refunded') {
        return { success: false, message: 'Order has already been refunded' }
      }

      // Process refund through Stripe
      const refundResult = await paymentService.processRefund(
        order.stripePaymentId,
        order.amount,
        'requested_by_customer'
      )

      if (!refundResult.success) {
        return refundResult
      }

      // Update order status
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'refunded',
          updatedAt: new Date(),
        },
      })

      logger.info('Order refunded', {
        orderId,
        refundId: refundResult.refundId,
        amount: refundResult.amount,
        adminId,
        reason,
      })

      return {
        success: true,
        refundId: refundResult.refundId,
        amount: refundResult.amount,
      }
    } catch (error) {
      logger.error('Failed to process refund', {
        error: error instanceof Error ? error.message : 'Unknown error',
        orderId,
        adminId,
      })
      return {
        success: false,
        message: 'Failed to process refund',
      }
    }
  }

  /**
   * Get revenue analytics
   */
  async getAnalytics(period: string = '30d'): Promise<RevenueAnalytics> {
    try {
      // Calculate date range
      const days = parseInt(period.replace('d', ''), 10) || 30
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Get orders in date range
      const orders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        include: { template: true },
      })

      // Calculate metrics
      const paidOrders = orders.filter(order => order.status === 'paid')
      const totalRevenue = paidOrders.reduce((sum, order) => sum + order.amount, 0)
      const totalOrders = paidOrders.length
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // Orders by status
      const ordersByStatus = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Top templates
      const templateCounts = paidOrders.reduce((acc, order) => {
        const templateId = order.templateId
        if (!acc[templateId]) {
          acc[templateId] = {
            template: order.template,
            count: 0,
            revenue: 0,
          }
        }
        acc[templateId].count += 1
        acc[templateId].revenue += order.amount
        return acc
      }, {} as any)

      const topTemplates = Object.values(templateCounts)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 10)

      // Recent orders
      const recentOrders = orders
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 10)
        .map(order => ({
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
        }))

      return {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        ordersByStatus,
        topTemplates,
        recentOrders,
      }
    } catch (error) {
      logger.error('Failed to get analytics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        period,
      })
      throw new Error('Failed to retrieve analytics')
    }
  }
}

export const adminService = new AdminService()
export default adminService