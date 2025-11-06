import { body, param, query, ValidationChain } from 'express-validator'
import { z } from 'zod'

// Zod schemas
export const TemplateFormSchema = z.object({
  disclosing_party: z.string().min(2, 'Disclosing party name must be at least 2 characters'),
  receiving_party: z.string().min(2, 'Receiving party name must be at least 2 characters'),
  effective_date: z.string().datetime('Invalid date format'),
  term_years: z.number().int().min(1).max(10, 'Term must be between 1 and 10 years'),
})

export const CreateOrderSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  formData: z.record(z.any()),
  customerEmail: z.string().email('Invalid email address'),
})

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Express-validator chains for API routes
export const validateCreateCheckoutSession: ValidationChain[] = [
  body('templateId').notEmpty().withMessage('Template ID is required'),
  body('customerEmail').isEmail().withMessage('Valid email is required'),
  body('formData').isObject().withMessage('Form data must be an object'),
]

export const validatePreview: ValidationChain[] = [
  body('templateId').notEmpty().withMessage('Template ID is required'),
  body('formData').isObject().withMessage('Form data must be an object'),
]

export const validateLogin: ValidationChain[] = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
]

export const validateTemplateId: ValidationChain[] = [
  param('id').notEmpty().withMessage('Template ID is required'),
]

export const validateOrderId: ValidationChain[] = [
  param('id').notEmpty().withMessage('Order ID is required'),
]

export const validateEmailQuery: ValidationChain[] = [
  query('email').isEmail().withMessage('Valid email is required'),
]

// Template validation schema
export const TemplateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  jurisdiction: z.string().default('California'),
  price: z.number().positive('Price must be positive'),
  description: z.string().min(1, 'Description is required'),
  placeholders: z.array(z.object({
    name: z.string(),
    label: z.string(),
    type: z.enum(['text', 'date', 'number', 'email', 'select']),
    required: z.boolean(),
    placeholder: z.string().optional(),
    default: z.any().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    options: z.array(z.string()).optional(),
  })),
  content: z.object({
    html: z.string(),
    docx_template: z.string().optional(),
  }),
  source: z.object({
    url: z.string().url(),
    license: z.string(),
    attribution: z.string(),
    modified: z.string(),
  }),
  metadata: z.object({
    created_at: z.string(),
    updated_at: z.string(),
    version: z.string(),
    downloads: z.number().default(0),
    rating: z.number().default(0),
  }),
})

// Email validation
export const validateEmailAddress = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Sanitization helpers
export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '')
}

export const sanitizeFormData = (formData: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {}

  for (const [key, value] of Object.entries(formData)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string' ? sanitizeString(item) : item
      )
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

// Validation error formatter
export const formatValidationErrors = (errors: any[]): { field: string; message: string }[] => {
  return errors.map(error => ({
    field: error.param || error.path?.join('.'),
    message: error.msg || 'Invalid input'
  }))
}