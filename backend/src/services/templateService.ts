import fs from 'fs/promises'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { Template } from '@/types'
import logger from '@/utils/logger'
import { TemplateSchema } from '@/utils/validators'

const prisma = new PrismaClient()

export class TemplateService {
  private templatesDir = path.join(__dirname, '../../templates')
  private cache = new Map<string, Template>()
  private cacheExpiry = new Map<string, Date>()
  private readonly CACHE_DURATION = 15 * 60 * 1000 // 15 minutes

  constructor() {
    this.loadTemplatesFromFiles()
  }

  /**
   * Load templates from JSON files on startup
   */
  async loadTemplatesFromFiles(): Promise<void> {
    try {
      const templateDirs = ['business', 'hr', 'freelance', 'real-estate', 'ip']
      const loadedTemplates: Template[] = []

      for (const dir of templateDirs) {
        const dirPath = path.join(this.templatesDir, dir)

        try {
          const files = await fs.readdir(dirPath)

          for (const file of files) {
            if (file.endsWith('.json')) {
              const filePath = path.join(dirPath, file)
              const content = await fs.readFile(filePath, 'utf-8')
              const templateData = JSON.parse(content)

              // Validate template structure
              const validatedTemplate = TemplateSchema.parse(templateData)

              const template: Template = {
                ...validatedTemplate,
                id: validatedTemplate.metadata.version + '-' + file.replace('.json', ''),
                createdAt: new Date(validatedTemplate.metadata.created_at),
                updatedAt: new Date(validatedTemplate.metadata.updated_at),
              }

              loadedTemplates.push(template)
            }
          }
        } catch (error) {
          logger.warn(`Failed to load templates from ${dir}`, {
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      // Store in database for caching and queries
      await this.syncTemplatesToDatabase(loadedTemplates)

      logger.info(`Loaded ${loadedTemplates.length} templates from files`)
    } catch (error) {
      logger.error('Failed to load templates from files', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Sync templates to database
   */
  private async syncTemplatesToDatabase(templates: Template[]): Promise<void> {
    try {
      for (const template of templates) {
        await prisma.template.upsert({
          where: { id: template.id },
          update: {
            title: template.title,
            category: template.category,
            jurisdiction: template.jurisdiction,
            price: template.price,
            description: template.description,
            placeholders: template.placeholders,
            content: template.content,
            source: template.source,
            metadata: template.metadata,
            updatedAt: new Date(),
          },
          create: {
            id: template.id,
            title: template.title,
            category: template.category,
            jurisdiction: template.jurisdiction,
            price: template.price,
            description: template.description,
            placeholders: template.placeholders,
            content: template.content,
            source: template.source,
            metadata: template.metadata,
          },
        })
      }

      logger.info('Templates synced to database successfully')
    } catch (error) {
      logger.error('Failed to sync templates to database', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Get all templates with filtering and sorting
   */
  async getAllTemplates(options: {
    category?: string
    search?: string
    sort?: string
    order?: 'asc' | 'desc'
  } = {}): Promise<Template[]> {
    try {
      const { category, search, sort = 'downloads', order = 'desc' } = options

      // Try cache first
      const cacheKey = JSON.stringify(options)
      if (this.isCacheValid(cacheKey)) {
        return this.cache.get(cacheKey) || []
      }

      const where: any = {}

      if (category && category !== 'All') {
        where.category = category
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
        ]
      }

      const orderBy: any = {}
      orderBy[sort] = order

      const templates = await prisma.template.findMany({
        where,
        orderBy,
        select: {
          id: true,
          title: true,
          category: true,
          jurisdiction: true,
          price: true,
          description: true,
          placeholders: true,
          content: true,
          source: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      // Convert to Template type
      const formattedTemplates: Template[] = templates.map(template => ({
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

      // Cache the results
      this.cache.set(cacheKey, formattedTemplates)
      this.cacheExpiry.set(cacheKey, new Date(Date.now() + this.CACHE_DURATION))

      return formattedTemplates
    } catch (error) {
      logger.error('Failed to get templates', {
        error: error instanceof Error ? error.message : 'Unknown error',
        options,
      })
      throw new Error('Failed to retrieve templates')
    }
  }

  /**
   * Get template by ID
   */
  async getTemplateById(id: string): Promise<Template | null> {
    try {
      // Try cache first
      const cacheKey = `template_${id}`
      if (this.isCacheValid(cacheKey)) {
        return this.cache.get(cacheKey) || null
      }

      const template = await prisma.template.findUnique({
        where: { id },
      })

      if (!template) {
        return null
      }

      const formattedTemplate: Template = {
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

      // Cache the result
      this.cache.set(cacheKey, formattedTemplate)
      this.cacheExpiry.set(cacheKey, new Date(Date.now() + this.CACHE_DURATION))

      return formattedTemplate
    } catch (error) {
      logger.error('Failed to get template by ID', {
        error: error instanceof Error ? error.message : 'Unknown error',
        templateId: id,
      })
      throw new Error('Failed to retrieve template')
    }
  }

  /**
   * Get all template categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const cacheKey = 'categories'
      if (this.isCacheValid(cacheKey)) {
        return this.cache.get(cacheKey) || []
      }

      const categories = await prisma.template.findMany({
        select: { category: true },
        distinct: ['category'],
      })

      const result = categories.map(c => c.category)

      // Cache the result
      this.cache.set(cacheKey, result)
      this.cacheExpiry.set(cacheKey, new Date(Date.now() + this.CACHE_DURATION))

      return result
    } catch (error) {
      logger.error('Failed to get categories', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw new Error('Failed to retrieve categories')
    }
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key)
    return expiry ? expiry > new Date() : false
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
    this.cacheExpiry.clear()
    logger.info('Template cache cleared')
  }

  /**
   * Increment template download count
   */
  async incrementDownloads(templateId: string): Promise<void> {
    try {
      await prisma.template.update({
        where: { id: templateId },
        data: {
          metadata: {
            increment: { downloads: 1 }
          }
        },
      })

      // Clear cache for this template
      this.cache.delete(`template_${templateId}`)

      logger.info('Template download count incremented', { templateId })
    } catch (error) {
      logger.error('Failed to increment template downloads', {
        error: error instanceof Error ? error.message : 'Unknown error',
        templateId,
      })
    }
  }
}

export const templateService = new TemplateService()
export default templateService