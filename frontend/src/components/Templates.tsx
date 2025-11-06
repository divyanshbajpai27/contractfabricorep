'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DocumentTextIcon, EyeIcon } from '@heroicons/react/24/outline'
import type { Template } from '@/types'
import { templateApi } from '@/lib/api'

const sampleTemplates: Template[] = [
  {
    id: 'nda-california',
    title: 'California Non-Disclosure Agreement',
    category: 'Business',
    jurisdiction: 'California',
    price: 9.99,
    description: 'Standard mutual NDA for California business relationships',
    placeholders: [],
    content: { html: '', docx_template: '' },
    source: {
      url: 'https://www.docracy.com',
      license: 'Creative Commons BY-SA',
      attribution: 'Docracy',
      modified: 'Updated for ContractFabrico'
    },
    preview: {
      sample_data: {}
    },
    metadata: {
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      version: '1.0',
      downloads: 0,
      rating: 0
    }
  },
  {
    id: 'employment-agreement',
    title: 'Employment Agreement',
    category: 'HR',
    jurisdiction: 'California',
    price: 14.99,
    description: 'Comprehensive employment contract for California businesses',
    placeholders: [],
    content: { html: '', docx_template: '' },
    source: {
      url: 'https://www.avodocs.com',
      license: 'MIT License',
      attribution: 'Avodocs',
      modified: 'Updated for ContractFabrico'
    },
    preview: {
      sample_data: {}
    },
    metadata: {
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      version: '1.0',
      downloads: 0,
      rating: 0
    }
  },
  {
    id: 'freelance-services',
    title: 'Freelance Services Agreement',
    category: 'Freelance',
    jurisdiction: 'California',
    price: 12.99,
    description: 'Service agreement template for freelancers and clients',
    placeholders: [],
    content: { html: '', docx_template: '' },
    source: {
      url: 'https://www.jotform.com',
      license: 'Creative Commons BY',
      attribution: 'Jotform Legal Templates',
      modified: 'Updated for ContractFabrico'
    },
    preview: {
      sample_data: {}
    },
    metadata: {
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      version: '1.0',
      downloads: 0,
      rating: 0
    }
  }
]

const categories = ['All', 'Business', 'HR', 'Freelance', 'Real Estate', 'Intellectual Property']

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>(sampleTemplates)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const fetchedTemplates = await templateApi.getAll()
      if (fetchedTemplates.length > 0) {
        setTemplates(fetchedTemplates)
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = selectedCategory === 'All'
    ? templates
    : templates.filter(template => template.category === selectedCategory)

  return (
    <div className="py-20 bg-white" id="templates">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-primary mb-4">
            Professional Legal Templates
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Choose from our curated collection of California-compliant legal documents.
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                  selectedCategory === category
                    ? 'bg-accent text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading templates...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTemplates.map((template) => (
              <div key={template.id} className="card group hover:shadow-xl transition-all duration-300">
                <div className="mb-4">
                  <div className="w-full h-32 bg-gradient-to-br from-teal-50 to-gray-50 rounded-lg flex items-center justify-center group-hover:from-teal-100 group-hover:to-gray-100 transition-colors duration-300">
                    <DocumentTextIcon className="w-12 h-12 text-accent" />
                  </div>
                </div>

                <div className="flex items-start justify-between mb-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                    {template.category}
                  </span>
                  <span className="text-lg font-bold text-primary">${template.price}</span>
                </div>

                <h3 className="text-lg font-semibold text-primary mb-2 line-clamp-2">
                  {template.title}
                </h3>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {template.description}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>📍 {template.jurisdiction}</span>
                  <span>⭐ {template.metadata.rating}/5</span>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/templates/${template.id}`}
                    className="flex-1 btn-primary text-sm py-2 text-center"
                  >
                    Use Template
                  </Link>
                  <button
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    title="Preview template"
                  >
                    <EyeIcon className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            href="/templates"
            className="btn-secondary text-lg px-8 py-4 inline-flex items-center gap-2"
          >
            View All Templates
          </Link>
        </div>
      </div>
    </div>
  )
}