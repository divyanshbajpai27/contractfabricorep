import axios from 'axios'
import type { ApiResponse, Template, Order, TemplateFormData, CheckoutSessionData } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add request ID
apiClient.interceptors.request.use((config) => {
  config.headers['x-request-id'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  return config
})

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// Template API
export const templateApi = {
  getAll: async (): Promise<Template[]> => {
    const response = await apiClient.get<ApiResponse<Template[]>>('/api/templates')
    return response.data.data || []
  },

  getById: async (id: string): Promise<Template | null> => {
    const response = await apiClient.get<ApiResponse<Template>>(`/api/templates/${id}`)
    return response.data.data || null
  },

  getCategories: async (): Promise<string[]> => {
    const response = await apiClient.get<ApiResponse<string[]>>('/api/templates/categories')
    return response.data.data || []
  },

  // Preview generation
  generatePreview: async (templateId: string, formData: TemplateFormData): Promise<string> => {
    const response = await apiClient.post<ApiResponse<{ previewUrl: string }>>('/api/preview', {
      templateId,
      formData,
    })
    return response.data.data?.previewUrl || ''
  },
}

// Payment API
export const paymentApi = {
  createCheckoutSession: async (data: CheckoutSessionData): Promise<string> => {
    const response = await apiClient.post<ApiResponse<{ sessionId: string }>>('/api/payment/create-checkout-session', data)
    return response.data.data?.sessionId || ''
  },
}

// Order API
export const orderApi = {
  getById: async (id: string, email: string): Promise<Order | null> => {
    const response = await apiClient.get<ApiResponse<Order>>(`/api/orders/${id}`, {
      params: { email },
    })
    return response.data.data || null
  },

  getDownloadUrl: async (id: string, email: string): Promise<{ pdfUrl: string; docxUrl: string } | null> => {
    const response = await apiClient.get<ApiResponse<{ pdfUrl: string; docxUrl: string }>>(`/api/orders/${id}/download`, {
      params: { email },
    })
    return response.data.data || null
  },
}

// Admin API
export const adminApi = {
  login: async (email: string, password: string): Promise<{ token: string }> => {
    const response = await apiClient.post<ApiResponse<{ token: string }>>('/api/admin/login', {
      email,
      password,
    })
    return response.data.data || { token: '' }
  },

  getTemplates: async (): Promise<Template[]> => {
    const response = await apiClient.get<ApiResponse<Template[]>>('/api/admin/templates')
    return response.data.data || []
  },

  getOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get<ApiResponse<Order[]>>('/api/admin/orders')
    return response.data.data || []
  },

  getAnalytics: async () => {
    const response = await apiClient.get('/api/admin/analytics')
    return response.data.data
  },
}

export default apiClient