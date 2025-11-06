export interface Template {
  id: string
  title: string
  category: string
  jurisdiction: string
  price: number
  description: string
  placeholders: Placeholder[]
  content: {
    html: string
    docx_template?: string
  }
  source: {
    url: string
    license: string
    attribution: string
    modified: string
  }
  metadata: {
    created_at: string
    updated_at: string
    version: string
    downloads: number
    rating: number
  }
  createdAt: Date
  updatedAt: Date
}

export interface Placeholder {
  name: string
  label: string
  type: 'text' | 'date' | 'number' | 'email' | 'select'
  required: boolean
  placeholder?: string
  default?: any
  min?: number
  max?: number
  options?: string[]
}

export interface Order {
  id: string
  templateId: string
  template: Template
  customerEmail: string
  formData: Record<string, any>
  stripePaymentId: string
  amount: number
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  pdfUrl?: string
  docxUrl?: string
  downloadExpiry: Date
  createdAt: Date
  updatedAt: Date
}

export interface Admin {
  id: string
  email: string
  password: string
  createdAt: Date
  updatedAt: Date
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  timestamp: string
  requestId?: string
}

export interface CreateCheckoutSessionData {
  templateId: string
  formData: Record<string, any>
  customerEmail: string
}

export interface PreviewRequest {
  templateId: string
  formData: Record<string, any>
}

export interface DocumentGenerationRequest {
  templateId: string
  formData: Record<string, any>
  order: Order
}

export interface EmailData {
  to: string
  subject: string
  template: string
  data: Record<string, any>
}

export interface StripeWebhookEvent {
  type: string
  data: {
    object: {
      id: string
      metadata: {
        templateId?: string
        customerEmail?: string
        formData?: string
      }
      payment_status?: string
      amount_total?: number
    }
  }
}

export interface RevenueAnalytics {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  ordersByStatus: Record<string, number>
  topTemplates: Array<{
    template: Template
    count: number
    revenue: number
  }>
  recentOrders: Order[]
}

export interface AppConfig {
  database: {
    url: string
  }
  jwt: {
    secret: string
    expiresIn: string
  }
  stripe: {
    secretKey: string
    webhookSecret: string
  }
  r2: {
    accountId: string
    accessKeyId: string
    secretAccessKey: string
    bucket: string
    endpoint: string
  }
  sendgrid: {
    apiKey: string
    fromEmail: string
  }
  app: {
    port: number
    nodeEnv: string
    corsOrigin: string
  }
}

export interface JwtPayload {
  adminId: string
  email: string
  iat?: number
  exp?: number
}