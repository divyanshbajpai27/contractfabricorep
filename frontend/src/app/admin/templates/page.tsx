'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { SuccessMessage } from '@/components/ui/SuccessMessage'
import { Input } from '@/components/ui/Input'
import { adminApi } from '@/lib/api'
import type { Template } from '@/types'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentIcon,
  ArrowPathIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

type SortField = 'title' | 'category' | 'price' | 'createdAt' | 'downloads'
type SortDirection = 'asc' | 'desc'

interface FilterOptions {
  search: string
  category: string
  sortField: SortField
  sortDirection: SortDirection
}

export default function TemplateManagement() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Filter and sort state
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    category: '',
    sortField: 'createdAt',
    sortDirection: 'desc',
  })
  const [showFilters, setShowFilters] = useState(false)

  // Modal state
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [showTemplateDetails, setShowTemplateDetails] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Form state for editing
  const [editForm, setEditForm] = useState({
    title: '',
    category: '',
    price: '',
    description: '',
  })

  useEffect(() => {
    loadTemplates()
    loadCategories()
  }, [])

  const loadTemplates = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const templatesData = await adminApi.getTemplates()
      setTemplates(templatesData)
    } catch (error: any) {
      console.error('Templates loading error:', error)
      setError('Failed to load templates. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      // Extract categories from templates or use API if available
      const uniqueCategories = Array.from(new Set(templates.map(t => t.category)))
      setCategories(uniqueCategories)
    } catch (error) {
      console.error('Categories loading error:', error)
    }
  }

  // Filter and sort templates
  const getFilteredAndSortedTemplates = (): Template[] => {
    let filtered = [...templates]

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(template => template.category === filters.category)
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(template =>
        template.title.toLowerCase().includes(searchLower) ||
        template.description.toLowerCase().includes(searchLower) ||
        template.category.toLowerCase().includes(searchLower) ||
        template.jurisdiction.toLowerCase().includes(searchLower)
      )
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[filters.sortField]
      let bValue: any = b[filters.sortField]

      if (filters.sortField === 'price' || filters.sortField === 'downloads') {
        aValue = parseFloat(aValue as string)
        bValue = parseFloat(bValue as string)
      } else if (filters.sortField === 'createdAt') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      if (aValue < bValue) {
        return filters.sortDirection === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return filters.sortDirection === 'asc' ? 1 : -1
      }
      return 0
    })

    return filtered
  }

  const filteredTemplates = getFilteredAndSortedTemplates()

  // Handle sort change
  const handleSort = (field: SortField) => {
    setFilters(prev => ({
      ...prev,
      sortField: field,
      sortDirection: prev.sortField === field && prev.sortDirection === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Handle template edit
  const handleEdit = () => {
    if (!selectedTemplate) return

    setIsProcessing(true)
    setError(null)

    try {
      // TODO: Implement template update API call
      // await adminApi.updateTemplate(selectedTemplate.id, editForm)

      // For now, just simulate success
      setTimeout(() => {
        setSuccess(`Template "${editForm.title}" updated successfully`)

        // Update template locally
        setTemplates(prev => prev.map(template =>
          template.id === selectedTemplate.id
            ? {
                ...template,
                title: editForm.title,
                category: editForm.category,
                price: parseFloat(editForm.price),
                description: editForm.description,
              }
            : template
        ))

        setShowEditModal(false)
        setSelectedTemplate(null)
        setIsProcessing(false)
      }, 1500)
    } catch (error: any) {
      console.error('Template update error:', error)
      setError('Failed to update template. Please try again.')
      setIsProcessing(false)
    }
  }

  // Handle template delete
  const handleDelete = async () => {
    if (!selectedTemplate) return

    setIsProcessing(true)
    setError(null)

    try {
      // TODO: Implement template delete API call
      // await adminApi.deleteTemplate(selectedTemplate.id)

      // For now, just simulate success
      setTimeout(() => {
        setSuccess(`Template "${selectedTemplate.title}" deleted successfully`)

        // Remove template locally
        setTemplates(prev => prev.filter(template => template.id !== selectedTemplate.id))

        setShowDeleteModal(false)
        setSelectedTemplate(null)
        setIsProcessing(false)
      }, 1500)
    } catch (error: any) {
      console.error('Template delete error:', error)
      setError('Failed to delete template. Please try again.')
      setIsProcessing(false)
    }
  }

  // Open edit modal
  const openEditModal = (template: Template) => {
    setSelectedTemplate(template)
    setEditForm({
      title: template.title,
      category: template.category,
      price: template.price.toString(),
      description: template.description,
    })
    setShowEditModal(true)
  }

  // Format functions
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getSortIcon = (field: SortField) => {
    if (filters.sortField !== field) {
      return <div className="w-4 h-4" />
    }

    return filters.sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  if (isLoading && templates.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Template Management</h1>
            <p className="mt-2 text-gray-600">
              Manage contract templates, edit details, and track performance.
            </p>
          </div>
          <Button onClick={() => window.location.href = '/admin/templates/new'}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Template
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} />
        </div>
      )}
      {success && (
        <div className="mb-6">
          <SuccessMessage message={success} />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg border border-gray-200 mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="Search templates..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Refresh */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={loadTemplates}
                  disabled={isLoading}
                  className="w-full"
                >
                  <ArrowPathIcon className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                  Refresh
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="bg-white shadow rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Templates ({filteredTemplates.length})
            </h3>
          </div>

          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <div key={template.id} className="bg-gray-50 rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  {/* Template Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900 mb-1">
                        {template.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                          {template.category}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {template.jurisdiction}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Template Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {template.description}
                  </p>

                  {/* Template Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Price</p>
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(template.price)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Downloads</p>
                      <p className="text-sm font-medium text-gray-900">{template.metadata.downloads}</p>
                    </div>
                  </div>

                  {/* Template Metadata */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Created:</span>
                      <span className="text-gray-900">{formatDate(template.metadata.created_at)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Rating:</span>
                      <span className="text-gray-900">⭐ {template.metadata.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTemplate(template)
                        setShowTemplateDetails(true)
                      }}
                      className="flex-1"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(template)}
                      className="flex-1"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTemplate(template)
                        setShowDeleteModal(true)
                      }}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No templates found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filters.search || filters.category
                  ? 'Try adjusting your filters or search terms.'
                  : 'No templates have been created yet.'}
              </p>
              <div className="mt-6">
                <Button onClick={() => window.location.href = '/admin/templates/new'}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Template Details Modal */}
      <Modal
        isOpen={showTemplateDetails}
        onClose={() => {
          setShowTemplateDetails(false)
          setSelectedTemplate(null)
        }}
        title="Template Details"
        size="lg"
      >
        {selectedTemplate && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Title</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedTemplate.title}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Category</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedTemplate.category}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Jurisdiction</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedTemplate.jurisdiction}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Price</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatCurrency(selectedTemplate.price)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Description</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-900">{selectedTemplate.description}</p>
              </div>
            </div>

            {/* Placeholders */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Form Fields ({selectedTemplate.placeholders.length})</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  {selectedTemplate.placeholders.map((placeholder, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                      <div>
                        <span className="text-sm font-medium text-gray-900">{placeholder.label}</span>
                        <span className="ml-2 text-xs text-gray-500">({placeholder.name})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                          {placeholder.type}
                        </span>
                        {placeholder.required && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                            Required
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Source Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Source Information</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">License</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedTemplate.source.license}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Attribution</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedTemplate.source.attribution}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Source URL</dt>
                    <dd className="mt-1">
                      <a
                        href={selectedTemplate.source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-teal-600 hover:text-teal-500"
                      >
                        {selectedTemplate.source.url}
                      </a>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTemplateDetails(false)
                  setSelectedTemplate(null)
                }}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowTemplateDetails(false)
                  openEditModal(selectedTemplate)
                }}
                className="flex-1"
              >
                Edit Template
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Template Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedTemplate(null)
        }}
        title="Edit Template"
        size="md"
      >
        {selectedTemplate && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Template title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                >
                  <option value="">Select category</option>
                  <option value="Business">Business</option>
                  <option value="HR">HR</option>
                  <option value="IP">Intellectual Property</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (USD)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="9.99"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Template description"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedTemplate(null)
                }}
                disabled={isProcessing}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEdit}
                loading={isProcessing}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedTemplate(null)
        }}
        title="Delete Template"
        size="md"
      >
        {selectedTemplate && (
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <TrashIcon className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">Delete Confirmation</h4>
                  <p className="mt-1 text-sm text-red-700">
                    Are you sure you want to delete "{selectedTemplate.title}"? This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedTemplate(null)
                }}
                disabled={isProcessing}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                loading={isProcessing}
                disabled={isProcessing}
                variant="destructive"
                className="flex-1"
              >
                {isProcessing ? 'Deleting...' : 'Delete Template'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}