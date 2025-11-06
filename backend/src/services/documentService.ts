import puppeteer from 'puppeteer'
import * as mustache from 'mustache'
import { Template, Order } from '@/types'
import storage from '@/utils/storage'
import logger from '@/utils/logger'
import config from '@/utils/config'

const DISCLAIMER_FOOTER = `
<div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 10px; color: #666; text-align: center;">
  <p><strong>Legal Disclaimer:</strong> This document is provided for informational purposes only and does not constitute legal advice.
  No attorney-client relationship is created. You should consult a licensed attorney before using this document.</p>
</div>
`

export class DocumentService {
  private browser: puppeteer.Browser | null = null

  constructor() {
    this.initializeBrowser()
  }

  /**
   * Initialize Puppeteer browser
   */
  private async initializeBrowser(): Promise<void> {
    try {
      this.browser = await puppeteer.launch({
        headless: config.app.nodeEnv === 'production',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
        ],
      })

      logger.info('Puppeteer browser initialized')
    } catch (error) {
      logger.error('Failed to initialize Puppeteer browser', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Generate HTML preview
   */
  async generatePreview(template: Template, formData: Record<string, any>): Promise<string> {
    try {
      // Replace placeholders in template content
      const renderedContent = mustache.render(template.content.html, formData)

      // Create full HTML document
      const htmlDocument = this.createHtmlDocument(template.title, renderedContent)

      return htmlDocument
    } catch (error) {
      logger.error('Failed to generate preview', {
        error: error instanceof Error ? error.message : 'Unknown error',
        templateId: template.id,
      })
      throw new Error('Failed to generate preview')
    }
  }

  /**
   * Generate both PDF and DOCX documents
   */
  async generateDocuments(
    templateId: string,
    formData: Record<string, any>,
    order: Order
  ): Promise<{ pdfUrl: string; docxUrl: string }> {
    try {
      // Get template
      const template = await this.getTemplateById(templateId)
      if (!template) {
        throw new Error('Template not found')
      }

      // Generate content
      const renderedContent = mustache.render(template.content.html, formData)
      const htmlDocument = this.createHtmlDocument(template.title, renderedContent)

      // Generate PDF
      const pdfBuffer = await this.generatePdf(htmlDocument)
      const pdfKey = storage.generateFileKey(`documents/${order.id}`, `${order.id}.pdf`)
      const pdfUpload = await storage.uploadFile(
        pdfKey,
        pdfBuffer,
        'application/pdf',
        {
          orderId: order.id,
          templateId: templateId,
          customerEmail: order.customerEmail,
          documentType: 'pdf',
        }
      )

      // Generate simple DOCX (HTML-based)
      const docxBuffer = Buffer.from(htmlDocument, 'utf-8')
      const docxKey = storage.generateFileKey(`documents/${order.id}`, `${order.id}.docx`)
      const docxUpload = await storage.uploadFile(
        docxKey,
        docxBuffer,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        {
          orderId: order.id,
          templateId: templateId,
          customerEmail: order.customerEmail,
          documentType: 'docx',
        }
      )

      logger.info('Documents generated successfully', {
        orderId: order.id,
        templateId,
        pdfUrl: pdfUpload.url,
        docxUrl: docxUpload.url,
      })

      return {
        pdfUrl: pdfUpload.signedUrl,
        docxUrl: docxUpload.signedUrl,
      }
    } catch (error) {
      logger.error('Failed to generate documents', {
        error: error instanceof Error ? error.message : 'Unknown error',
        templateId,
        orderId: order.id,
      })
      throw new Error('Failed to generate documents')
    }
  }

  /**
   * Generate PDF from HTML
   */
  private async generatePdf(htmlContent: string): Promise<Buffer> {
    if (!this.browser) {
      await this.initializeBrowser()
      if (!this.browser) {
        throw new Error('Failed to initialize browser for PDF generation')
      }
    }

    try {
      const page = await this.browser!.newPage()

      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
        timeout: parseInt(process.env.PDF_GENERATION_TIMEOUT || '30000', 10),
      })

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm',
        },
        preferCSSPageSize: true,
        displayHeaderFooter: false,
      })

      await page.close()

      return pdfBuffer
    } catch (error) {
      logger.error('PDF generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw new Error('Failed to generate PDF')
    }
  }

  /**
   * Create full HTML document
   */
  private createHtmlDocument(title: string, content: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            color: #333;
            max-width: 8.5in;
            margin: 0 auto;
            padding: 1in;
            font-size: 12pt;
        }

        h1, h2, h3, h4, h5, h6 {
            color: #2c3e50;
            margin-top: 1.5em;
            margin-bottom: 1em;
            font-weight: 600;
        }

        h1 {
            font-size: 18pt;
            text-align: center;
            border-bottom: 2px solid #3498db;
            padding-bottom: 0.5em;
        }

        h2 {
            font-size: 16pt;
        }

        h3 {
            font-size: 14pt;
        }

        p {
            margin-bottom: 1em;
            text-align: justify;
        }

        .signature-block {
            margin-top: 3em;
            display: flex;
            justify-content: space-between;
        }

        .signature-field {
            width: 45%;
            text-align: center;
        }

        .signature-line {
            border-bottom: 1px solid #333;
            height: 1px;
            margin: 2em 0 0.5em 0;
        }

        .signature-label {
            font-size: 10pt;
            color: #666;
        }

        .date-field {
            margin-top: 2em;
            text-align: left;
        }

        .date-line {
            border-bottom: 1px solid #333;
            height: 1px;
            width: 200px;
            margin: 0.5em 0;
        }

        ul, ol {
            margin-bottom: 1em;
            padding-left: 2em;
        }

        li {
            margin-bottom: 0.5em;
        }

        .highlight {
            background-color: #fff3cd;
            padding: 0.2em 0.4em;
            border-radius: 3px;
        }

        .page-break {
            page-break-before: always;
        }

        @media print {
            body {
                margin: 0;
                padding: 0.5in;
                font-size: 11pt;
            }

            .page-break {
                page-break-before: always;
            }
        }
    </style>
</head>
<body>
    ${content}
    ${DISCLAIMER_FOOTER}
</body>
</html>
    `.trim()
  }

  /**
   * Get template by ID (helper method)
   */
  private async getTemplateById(id: string): Promise<Template | null> {
    // This would typically use the template service
    // For now, returning a simple implementation
    const { templateService } = await import('./templateService')
    return templateService.getTemplateById(id)
  }

  /**
   * Close browser instance
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      logger.info('Puppeteer browser closed')
    }
  }
}

export const documentService = new DocumentService()
export default documentService