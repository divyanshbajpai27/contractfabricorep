import sgMail from '@sendgrid/mail'
import config from '@/utils/config'
import logger from '@/utils/logger'
import { Order, Template } from '@/types'

// Set SendGrid API key
sgMail.setApiKey(config.sendgrid.apiKey)

export class EmailService {
  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(data: {
    to: string
    order: Order
    documents: {
      pdfUrl: string
      docxUrl: string
    }
  }): Promise<void> {
    try {
      const { to, order, documents } = data

      const emailContent = this.generateOrderConfirmationEmail(order, documents)

      const msg = {
        to,
        from: config.sendgrid.fromEmail,
        subject: `Your ContractFabrico Order #${order.id.slice(-8)} is Ready`,
        html: emailContent,
        text: this.generateOrderConfirmationText(order, documents),
      }

      await sgMail.send(msg)

      logger.info('Order confirmation email sent', {
        orderId: order.id,
        to,
        templateId: order.templateId,
      })
    } catch (error) {
      logger.error('Failed to send order confirmation email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        orderData: data,
      })
      throw new Error('Failed to send confirmation email')
    }
  }

  /**
   * Send payment failure email
   */
  async sendPaymentFailureEmail(data: {
    to: string
    order: Order
    error: string
  }): Promise<void> {
    try {
      const { to, order, error } = data

      const emailContent = this.generatePaymentFailureEmail(order, error)

      const msg = {
        to,
        from: config.sendgrid.fromEmail,
        subject: `Payment Issue with Your ContractFabrico Order #${order.id.slice(-8)}`,
        html: emailContent,
        text: `We encountered an issue processing your payment for order ${order.id}. Please try again or contact support.`,
      }

      await sgMail.send(msg)

      logger.info('Payment failure email sent', {
        orderId: order.id,
        to,
        error,
      })
    } catch (error) {
      logger.error('Failed to send payment failure email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        orderData: data,
      })
    }
  }

  /**
   * Send refund confirmation email
   */
  async sendRefundConfirmationEmail(data: {
    to: string
    order: Order
    refundAmount: number
    refundId: string
  }): Promise<void> {
    try {
      const { to, order, refundAmount, refundId } = data

      const emailContent = this.generateRefundConfirmationEmail(order, refundAmount, refundId)

      const msg = {
        to,
        from: config.sendGrid.fromEmail,
        subject: `Refund Processed for Your ContractFabrico Order #${order.id.slice(-8)}`,
        html: emailContent,
        text: `A refund of $${refundAmount} has been processed for your order ${order.id}.`,
      }

      await sgMail.send(msg)

      logger.info('Refund confirmation email sent', {
        orderId: order.id,
        to,
        refundAmount,
        refundId,
      })
    } catch (error) {
      logger.error('Failed to send refund confirmation email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        orderData: data,
      })
    }
  }

  /**
   * Generate order confirmation email HTML
   */
  private generateOrderConfirmationEmail(order: Order, documents: {
    pdfUrl: string
    docxUrl: string
  }): string {
    const expiryDate = new Date(order.downloadExpiry).toLocaleDateString()

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your ContractFabrico Order is Ready</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: #0F172A;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 8px 8px;
        }
        .button {
            display: inline-block;
            background: #14B8A6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 5px;
            font-weight: bold;
        }
        .button:hover {
            background: #0d9488;
        }
        .order-details {
            background: white;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>ContractFabrico</h1>
        <h2>Your Order is Ready!</h2>
    </div>

    <div class="content">
        <p>Dear Customer,</p>

        <p>Great news! Your contract has been generated and is ready for download. Your documents are available in both PDF and DOCX formats.</p>

        <div class="order-details">
            <h3>Order Details</h3>
            <p><strong>Order ID:</strong> #${order.id.slice(-8)}</p>
            <p><strong>Template:</strong> ${order.template.title}</p>
            <p><strong>Amount Paid:</strong> $${order.amount.toFixed(2)}</p>
            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Download Access Expires:</strong> ${expiryDate}</p>
        </div>

        <h3>Download Your Documents</h3>
        <p>Click the links below to download your contract:</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${documents.pdfUrl}" class="button">Download PDF</a>
            <a href="${documents.docxUrl}" class="button">Download DOCX</a>
        </div>

        <p><strong>Important:</strong></p>
        <ul>
            <li>Your download links will expire on ${expiryDate}</li>
            <li>Please save your documents to your device for future reference</li>
            <li>This email serves as your proof of purchase</li>
        </ul>

        <p><em>Legal Disclaimer: This document is provided for informational purposes only and does not constitute legal advice. No attorney-client relationship is created. You should consult a licensed attorney before using this document.</em></p>
    </div>

    <div class="footer">
        <p>© 2024 ContractFabrico. All rights reserved.</p>
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>For support, contact: support@contractfabrico.com</p>
    </div>
</body>
</html>
    `.trim()
  }

  /**
   * Generate order confirmation email text
   */
  private generateOrderConfirmationText(order: Order, documents: {
    pdfUrl: string
    docxUrl: string
  }): string {
    const expiryDate = new Date(order.downloadExpiry).toLocaleDateString()

    return `
Dear Customer,

Great news! Your contract has been generated and is ready for download.

Order Details:
- Order ID: #${order.id.slice(-8)}
- Template: ${order.template.title}
- Amount Paid: $${order.amount.toFixed(2)}
- Order Date: ${new Date(order.createdAt).toLocaleDateString()}
- Download Access Expires: ${expiryDate}

Download your documents:
PDF: ${documents.pdfUrl}
DOCX: ${documents.docxUrl}

Important:
- Download links expire on ${expiryDate}
- Save documents to your device for future reference
- This email serves as your proof of purchase

Legal Disclaimer: This document is provided for informational purposes only and does not constitute legal advice. No attorney-client relationship is created. You should consult a licensed attorney before using this document.

© 2024 ContractFabrico. All rights reserved.
For support: support@contractfabrico.com
    `.trim()
  }

  /**
   * Generate payment failure email
   */
  private generatePaymentFailureEmail(order: Order, error: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Issue - ContractFabrico</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #0F172A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ContractFabrico</h1>
        <h2>Payment Issue</h2>
    </div>

    <div class="content">
        <p>Dear Customer,</p>

        <p>We encountered an issue processing your payment for order #${order.id.slice(-8)}.</p>

        <p><strong>Error:</strong> ${error}</p>

        <p>Don't worry - no charges were made to your account. You can try again by clicking the button below:</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/templates/${order.templateId}" class="button">Try Again</a>
        </div>

        <p>If the problem persists, please contact our support team for assistance.</p>

        <p>We apologize for any inconvenience and appreciate your patience.</p>
    </div>

    <div class="footer">
        <p>© 2024 ContractFabrico. All rights reserved.</p>
        <p>For support: support@contractfabrico.com</p>
    </div>
</body>
</html>
    `.trim()
  }

  /**
   * Generate refund confirmation email
   */
  private generateRefundConfirmationEmail(order: Order, refundAmount: number, refundId: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Refund Processed - ContractFabrico</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .refund-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ContractFabrico</h1>
        <h2>Refund Processed</h2>
    </div>

    <div class="content">
        <p>Dear Customer,</p>

        <p>Your refund has been successfully processed for order #${order.id.slice(-8)}.</p>

        <div class="refund-details">
            <h3>Refund Details</h3>
            <p><strong>Refund Amount:</strong> $${refundAmount.toFixed(2)}</p>
            <p><strong>Refund ID:</strong> ${refundId}</p>
            <p><strong>Order ID:</strong> #${order.id.slice(-8)}</p>
            <p><strong>Processing Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <p>The refund should appear in your account within 5-10 business days, depending on your bank's processing times.</p>

        <p>If you have any questions about this refund, please don't hesitate to contact our support team.</p>

        <p>Thank you for your understanding.</p>
    </div>

    <div class="footer">
        <p>© 2024 ContractFabrico. All rights reserved.</p>
        <p>For support: support@contractfabrico.com</p>
    </div>
</body>
</html>
    `.trim()
  }
}

export const emailService = new EmailService()
export default emailService