import { z } from 'zod'
import type { TemplateFormData, Placeholder } from '@/types'

// Common validation schemas
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(254, 'Email address is too long')

export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters long')
  .max(100, 'Password is too long')

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .min(2, 'Name must be at least 2 characters long')
  .max(100, 'Name is too long')
  .regex(/^[a-zA-Z\s\-'.]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')

export const phoneSchema = z
  .string()
  .optional()
  .refine((phone) => {
    if (!phone) return true
    // Basic phone validation (international format)
    const phoneRegex = /^\+?[\d\s\-\(\)]{7,}$/
    return phoneRegex.test(phone)
  }, 'Please enter a valid phone number')

export const dateSchema = z
  .string()
  .min(1, 'Date is required')
  .refine((date) => {
    try {
      const parsedDate = new Date(date)
      return !isNaN(parsedDate.getTime())
    } catch {
      return false
    }
  }, 'Please enter a valid date')

export const numberSchema = z
  .string()
  .min(1, 'Number is required')
  .refine((num) => {
    const parsed = parseFloat(num)
    return !isNaN(parsed) && isFinite(parsed)
  }, 'Please enter a valid number')

export const currencySchema = z
  .string()
  .min(1, 'Amount is required')
  .refine((amount) => {
    const parsed = parseFloat(amount.replace(/[^0-9.-]/g, ''))
    return !isNaN(parsed) && isFinite(parsed) && parsed > 0
  }, 'Please enter a valid positive amount')

export const urlSchema = z
  .string()
  .optional()
  .refine((url) => {
    if (!url) return true
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }, 'Please enter a valid URL')

export const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required').max(200),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State/Province is required').max(100),
  zipCode: z.string().min(1, 'ZIP/Postal code is required').max(20),
  country: z.string().min(1, 'Country is required').max(100),
})

// Form-specific validation schemas
export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const adminLoginFormSchema = loginFormSchema

export const checkoutFormSchema = z.object({
  email: emailSchema,
  agreedToTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the terms and conditions' }),
  }),
})

export const templateFormSchema = z.object({
  title: z.string().min(1, 'Template title is required').max(200),
  category: z.string().min(1, 'Category is required').max(50),
  jurisdiction: z.string().min(1, 'Jurisdiction is required').max(100),
  price: currencySchema,
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
})

export const contactFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
})

// Dynamic form validation based on template placeholders
export function createTemplateFormSchema(placeholders: Placeholder[]): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const schemaFields: Record<string, z.ZodTypeAny> = {}

  placeholders.forEach((placeholder) => {
    let fieldSchema: z.ZodTypeAny

    switch (placeholder.type) {
      case 'text':
        fieldSchema = z.string().min(
          placeholder.required ? 1 : 0,
          placeholder.required ? `${placeholder.label} is required` : undefined
        )
        if (placeholder.min !== undefined) {
          fieldSchema = (fieldSchema as z.ZodString).min(
            placeholder.min,
            `${placeholder.label} must be at least ${placeholder.min} characters`
          )
        }
        if (placeholder.max !== undefined) {
          fieldSchema = (fieldSchema as z.ZodString).max(
            placeholder.max,
            `${placeholder.label} cannot exceed ${placeholder.max} characters`
          )
        }
        break

      case 'email':
        fieldSchema = placeholder.required ? emailSchema : emailSchema.optional()
        break

      case 'number':
        fieldSchema = z.string().refine((val) => {
          if (!placeholder.required && !val) return true
          const num = parseFloat(val)
          return !isNaN(num) && isFinite(num)
        }, placeholder.required ? `${placeholder.label} is required and must be a valid number` : `${placeholder.label} must be a valid number`)

        if (placeholder.min !== undefined) {
          fieldSchema = (fieldSchema as z.ZodEffects).refine((val) => {
            if (!placeholder.required && !val) return true
            return parseFloat(val) >= placeholder.min!
          }, `${placeholder.label} must be at least ${placeholder.min}`)
        }

        if (placeholder.max !== undefined) {
          fieldSchema = (fieldSchema as z.ZodEffects).refine((val) => {
            if (!placeholder.required && !val) return true
            return parseFloat(val) <= placeholder.max!
          }, `${placeholder.label} cannot exceed ${placeholder.max}`)
        }
        break

      case 'date':
        fieldSchema = placeholder.required ? dateSchema : dateSchema.optional()
        break

      case 'select':
        fieldSchema = z.string().refine((val) => {
          if (!placeholder.required && !val) return true
          return placeholder.options?.includes(val)
        }, placeholder.required ? `${placeholder.label} is required` : `Please select a valid option for ${placeholder.label}`)
        break

      default:
        fieldSchema = z.string()
    }

    // Apply default value if specified
    if (placeholder.default !== undefined && !placeholder.required) {
      fieldSchema = fieldSchema.optional().or(z.literal(placeholder.default))
    }

    schemaFields[placeholder.name] = fieldSchema
  })

  return z.object(schemaFields)
}

// Validation helpers
export function validateEmail(email: string): boolean {
  try {
    emailSchema.parse(email)
    return true
  } catch {
    return false
  }
}

export function validatePhoneNumber(phone: string): boolean {
  if (!phone) return true
  const phoneRegex = /^\+?[\d\s\-\(\)]{7,}$/
  return phoneRegex.test(phone)
}

export function validateURL(url: string): boolean {
  if (!url) return true
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function validateTemplateFormData(
  formData: TemplateFormData,
  placeholders: Placeholder[]
): { isValid: boolean; errors: Record<string, string> } {
  const schema = createTemplateFormSchema(placeholders)
  const result = schema.safeParse(formData)

  if (result.success) {
    return { isValid: true, errors: {} }
  }

  const errors: Record<string, string> = {}
  result.error.issues.forEach((issue) => {
    const fieldName = issue.path.join('.')
    errors[fieldName] = issue.message
  })

  return { isValid: false, errors }
}

// Sanitization helpers
export function sanitizeText(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove potential JavaScript URLs
    .replace(/on\w+=/gi, '') // Remove potential event handlers
}

export function sanitizeHTML(input: string): string {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')
}

// File validation helpers
export function validateFile(file: File, options: {
  maxSize?: number
  allowedTypes?: string[]
}): { isValid: boolean; error?: string } {
  const { maxSize = 10 * 1024 * 1024, allowedTypes = [] } = options

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size cannot exceed ${Math.round(maxSize / 1024 / 1024)}MB`
    }
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed`
    }
  }

  return { isValid: true }
}

// Credit card validation (for payment forms)
export function validateCreditCard(cardNumber: string): boolean {
  // Remove spaces and non-digit characters
  const cleanNumber = cardNumber.replace(/\D/g, '')

  // Check if number is between 13 and 19 digits
  if (!/^\d{13,19}$/.test(cleanNumber)) {
    return false
  }

  // Luhn algorithm
  let sum = 0
  let isEven = false

  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i], 10)

    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }

    sum += digit
    isEven = !isEven
  }

  return sum % 10 === 0
}

export function validateExpiryDate(month: string, year: string): boolean {
  const monthNum = parseInt(month, 10)
  const yearNum = parseInt(year, 10)

  if (monthNum < 1 || monthNum > 12) {
    return false
  }

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
    return false
  }

  return true
}

export function validateCVV(cvv: string): boolean {
  return /^\d{3,4}$/.test(cvv)
}

// Form validation error messages
export const VALIDATION_ERROR_MESSAGES = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  url: 'Please enter a valid URL',
  minLength: (min: number) => `Must be at least ${min} characters`,
  maxLength: (max: number) => `Cannot exceed ${max} characters`,
  minNumber: (min: number) => `Must be at least ${min}`,
  maxNumber: (max: number) => `Cannot exceed ${max}`,
  fileSize: (maxSize: number) => `File size cannot exceed ${Math.round(maxSize / 1024 / 1024)}MB`,
  fileType: 'File type is not supported',
  password: 'Password must be at least 6 characters long',
  terms: 'You must agree to the terms and conditions',
  creditCard: 'Please enter a valid credit card number',
  expiryDate: 'Please enter a valid expiry date',
  cvv: 'Please enter a valid CVV',
} as const

export type ValidationErrorMessages = typeof VALIDATION_ERROR_MESSAGES