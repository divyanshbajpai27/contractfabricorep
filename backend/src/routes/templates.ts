import { Router } from 'express'
import { handleValidationErrors, validateTemplateId } from '@/middleware/validation'
import { documentRateLimit } from '@/middleware/security'
import { templateService } from '@/services/templateService'
import { documentService } from '@/services/documentService'
import logger from '@/utils/logger'

const router = Router()

// GET /api/templates - Get all templates
router.get('/', async (req, res, next) => {
  try {
    const { category, search, sort = 'downloads', order = 'desc' } = req.query

    const templates = await templateService.getAllTemplates({
      category: category as string,
      search: search as string,
      sort: sort as string,
      order: order as 'asc' | 'desc',
    })

    res.json({
      success: true,
      data: templates,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'],
    })
  } catch (error) {
    logger.error('Failed to get templates', {
      error: error instanceof Error ? error.message : 'Unknown error',
      query: req.query,
      requestId: req.headers['x-request-id'],
    })
    next(error)
  }
})

// GET /api/templates/categories - Get template categories
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await templateService.getCategories()

    res.json({
      success: true,
      data: categories,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'],
    })
  } catch (error) {
    logger.error('Failed to get categories', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: req.headers['x-request-id'],
    })
    next(error)
  }
})

// GET /api/templates/:id - Get specific template
router.get('/:id', validateTemplateId, handleValidationErrors, async (req, res, next) => {
  try {
    const template = await templateService.getTemplateById(req.params.id)

    if (!template) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: 'Template not found',
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'],
      })
    }

    res.json({
      success: true,
      data: template,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'],
    })
  } catch (error) {
    logger.error('Failed to get template', {
      error: error instanceof Error ? error.message : 'Unknown error',
      templateId: req.params.id,
      requestId: req.headers['x-request-id'],
    })
    next(error)
  }
})

// POST /api/preview - Generate document preview
router.post('/preview', documentRateLimit, handleValidationErrors, async (req, res, next) => {
  try {
    const { templateId, formData } = req.body

    // Validate template exists
    const template = await templateService.getTemplateById(templateId)
    if (!template) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: 'Template not found',
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'],
      })
    }

    // Generate preview HTML
    const previewHtml = await documentService.generatePreview(template, formData)

    res.json({
      success: true,
      data: {
        previewHtml,
        templateId,
        formData,
      },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'],
    })
  } catch (error) {
    logger.error('Failed to generate preview', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body,
      requestId: req.headers['x-request-id'],
    })
    next(error)
  }
})

export default router