// Template types
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
  preview?: {
    thumbnail?: string
    sample_data: Record<string, any>
  }
  metadata: {
    created_at: string
    updated_at: string
    version: string
    downloads: number
    rating: number
  }
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

// Order types
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
  downloadExpiry: string
  createdAt: string
  updatedAt: string
}

// API response types
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

// Form types
export interface TemplateFormData {
  [key: string]: any
}

export interface CheckoutSessionData {
  templateId: string
  formData: TemplateFormData
  customerEmail: string
}

// Admin types
export interface Admin {
  id: string
  email: string
  createdAt: string
}

export interface AdminAuth {
  token: string
  admin: Admin
}

// Analytics types
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