import { z } from 'zod'
import type { Placeholder, TemplateFormData } from '@/types'

// Form validation schemas
export const EmailSchema = z.string().email('Please enter a valid email address')

export const RequiredTextSchema = z
  .string()
  .min(1, 'This field is required')
  .min(2, 'Must be at least 2 characters long')

export const OptionalTextSchema = z.string().optional()

export const RequiredDateSchema = z
  .string()
  .min(1, 'Date is required')
  .refine((date) => {
    const d = new Date(date)
    return !isNaN(d.getTime())
  }, 'Please enter a valid date')

export const RequiredNumberSchema = z
  .string()
  .min(1, 'This field is required')
  .refine((num) => !isNaN(parseFloat(num)), 'Please enter a valid number')
  .transform((num) => parseFloat(num))

export const OptionalNumberSchema = z
  .string()
  .optional()
  .transform((val) => val ? parseFloat(val) : undefined)
  .refine((num) => num === undefined || !isNaN(num), 'Please enter a valid number')

// Template-based validation
export const createTemplateValidationSchema = (placeholders: Placeholder[]) => {
  const schema: Record<string, z.ZodTypeAny> = {}

  placeholders.forEach((placeholder) => {
    let fieldSchema: z.ZodTypeAny

    switch (placeholder.type) {
      case 'email':
        if (placeholder.required) {
          fieldSchema = EmailSchema
        } else {
          fieldSchema = z.string().email('Please enter a valid email address').optional()
        }
        break

      case 'date':
        if (placeholder.required) {
          fieldSchema = RequiredDateSchema
        } else {
          fieldSchema = z.string().refine((date) => {
            if (!date) return true // Optional field can be empty
            const d = new Date(date)
            return !isNaN(d.getTime())
          }, 'Please enter a valid date').optional()
        }
        break

      case 'number':
        if (placeholder.required) {
          fieldSchema = RequiredNumberSchema
        } else {
          fieldSchema = OptionalNumberSchema
        }
        break

      case 'select':
        if (placeholder.required) {
          fieldSchema = z.string().min(1, 'Please select an option')
        } else {
          fieldSchema = z.string().optional()
        }
        break

      case 'text':
      default:
        if (placeholder.required) {
          fieldSchema = z.string().min(1, 'This field is required')
          if (placeholder.min) {
            fieldSchema = fieldSchema.min(placeholder.min, `Must be at least ${placeholder.min} characters`)
          }
          if (placeholder.max) {
            fieldSchema = fieldSchema.max(placeholder.max, `Must be at most ${placeholder.max} characters`)
          }
        } else {
          fieldSchema = z.string().optional()
          if (placeholder.min) {
            fieldSchema = fieldSchema.refine(
              (val) => !val || val.length >= placeholder.min!,
              `Must be at least ${placeholder.min} characters`
            )
          }
          if (placeholder.max) {
            fieldSchema = fieldSchema.refine(
              (val) => !val || val.length <= placeholder.max!,
              `Must be at most ${placeholder.max} characters`
            )
          }
        }
        break
    }

    // Add number-specific validations
    if (placeholder.type === 'number') {
      if (placeholder.min !== undefined) {
        fieldSchema = (fieldSchema as z.ZodNumber).min(placeholder.min, `Value must be at least ${placeholder.min}`)
      }
      if (placeholder.max !== undefined) {
        fieldSchema = (fieldSchema as z.ZodNumber).max(placeholder.max, `Value must be at most ${placeholder.max}`)
      }
    }

    schema[placeholder.name] = fieldSchema
  })

  return z.object(schema)
}

// Validation functions
export const validateTemplateForm = (
  formData: TemplateFormData,
  placeholders: Placeholder[]
): { isValid: boolean; errors: Record<string, string> } => {
  const schema = createTemplateValidationSchema(placeholders)
  const result = schema.safeParse(formData)

  if (result.success) {
    return { isValid: true, errors: {} }
  }

  const errors: Record<string, string> = {}
  result.error.issues.forEach((issue) => {
    const field = issue.path[0] as string
    errors[field] = issue.message
  })

  return { isValid: false, errors }
}

export const validateField = (
  fieldName: string,
  value: any,
  placeholder: Placeholder
): string | null => {
  try {
    const schema = createTemplateValidationSchema([placeholder])
    const result = schema.safeParse({ [fieldName]: value })

    if (result.success) {
      return null
    }

    const issue = result.error.issues.find((iss) => iss.path[0] === fieldName)
    return issue?.message || null
  } catch {
    return 'Validation error'
  }
}

// Real-time validation helpers
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Phone number validation (basic)
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
  return phoneRegex.test(phone)
}

// Date validation
export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString)
  return !isNaN(date.getTime()) && date.toISOString().split('T')[0] === dateString
}

// URL validation
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// File validation helpers
export const validateFileSize = (file: File, maxSizeMB: number): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

export const validateFileType = (
  file: File,
  allowedTypes: string[]
): boolean => {
  return allowedTypes.includes(file.type)
}

// Sanitization helpers
export const sanitizeText = (text: string): string => {
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript protocol
}

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim()
}

// Form state helpers
export const getFormErrors = (
  formData: TemplateFormData,
  placeholders: Placeholder[]
): Record<string, string> => {
  const { errors } = validateTemplateForm(formData, placeholders)
  return errors
}

export const hasFormErrors = (
  formData: TemplateFormData,
  placeholders: Placeholder[]
): boolean => {
  const { isValid } = validateTemplateForm(formData, placeholders)
  return !isValid
}

export const getRequiredFields = (placeholders: Placeholder[]): string[] => {
  return placeholders
    .filter(placeholder => placeholder.required)
    .map(placeholder => placeholder.name)
}

export const isRequiredFieldComplete = (
  fieldName: string,
  formData: TemplateFormData,
  placeholders: Placeholder[]
): boolean => {
  const placeholder = placeholders.find(p => p.name === fieldName)
  if (!placeholder?.required) return true

  const value = formData[fieldName]
  return value !== undefined && value !== null && value.toString().trim() !== ''
}

// Advanced validation for specific field types
export const validateBusinessName = (name: string): string | null => {
  if (!name.trim()) return 'Business name is required'
  if (name.length < 2) return 'Business name must be at least 2 characters'
  if (name.length > 100) return 'Business name must be less than 100 characters'
  return null
}

export const validateAddress = (address: string): string | null => {
  if (!address.trim()) return 'Address is required'
  if (address.length < 5) return 'Please enter a complete address'
  return null
}

export const validateZipCode = (zip: string): string | null => {
  const zipRegex = /^\d{5}(-\d{4})?$/
  if (!zipRegex.test(zip)) return 'Please enter a valid ZIP code'
  return null
}

// Validation for legal document specific fields
export const validatePartyName = (name: string): string | null => {
  if (!name.trim()) return 'Party name is required'
  if (name.length < 2) return 'Name must be at least 2 characters'
  if (!/^[a-zA-Z\s\.\-]+$/.test(name)) return 'Name can only contain letters, spaces, dots, and hyphens'
  return null
}

export const validateContractAmount = (amount: string): string | null => {
  const num = parseFloat(amount)
  if (isNaN(num)) return 'Please enter a valid amount'
  if (num <= 0) return 'Amount must be greater than 0'
  if (num > 999999999) return 'Amount is too large'
  return null
}

export const validateContractDate = (dateString: string, fieldName: string): string | null => {
  if (!dateString) return `${fieldName} is required`

  const date = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Set to start of day for comparison

  if (isNaN(date.getTime())) return 'Please enter a valid date'
  if (date < today) return 'Date cannot be in the past'

  return null
}