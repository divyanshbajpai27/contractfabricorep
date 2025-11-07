import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Template } from '@/types'
import { Button } from '@/components/ui/Button'

interface TemplateCardProps {
  template: Template
  className?: string
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, className }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Business: 'bg-blue-100 text-blue-800',
      HR: 'bg-green-100 text-green-800',
      IP: 'bg-purple-100 text-purple-800',
      'Real Estate': 'bg-orange-100 text-orange-800',
      Freelance: 'bg-pink-100 text-pink-800',
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden ${className}`}>
      {/* Template Thumbnail */}
      <div className="aspect-w-16 aspect-h-9 bg-gray-100 h-48 relative">
        {template.preview?.thumbnail ? (
          <Image
            src={template.preview.thumbnail}
            alt={template.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-teal-100">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-teal-600 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-sm text-teal-600 font-medium">{template.title}</p>
            </div>
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-2 right-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
            {template.category}
          </span>
        </div>
      </div>

      {/* Template Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {template.title}
          </h3>
          <span className="text-lg font-bold text-teal-600 ml-2 flex-shrink-0">
            {formatPrice(template.price)}
          </span>
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {template.description}
        </p>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <svg
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {template.jurisdiction}
          </div>
          <div className="flex items-center">
            <svg
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            {template.metadata.downloads} downloads
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link href={`/templates/${template.id}`} className="flex-1">
            <Button className="w-full" size="sm">
              Use Template
            </Button>
          </Link>
          <Button variant="outline" size="sm">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  )
}

export { TemplateCard }