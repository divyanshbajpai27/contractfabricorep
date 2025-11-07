'use client'

import React, { useState, useEffect } from 'react'
import { Placeholder, TemplateFormData } from '@/types'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ErrorMessage } from '@/components/ui/ErrorMessage'

interface DynamicFormProps {
  placeholders: Placeholder[]
  formData: TemplateFormData
  onChange: (formData: TemplateFormData) => void
  onValidationChange?: (isValid: boolean, errors: Record<string, string>) => void
  className?: string
}

const DynamicForm: React.FC<DynamicFormProps> = ({
  placeholders,
  formData,
  onChange,
  onValidationChange,
  className
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  useEffect(() => {
    validateForm()
  }, [formData, placeholders])

  const validateField = (placeholder: Placeholder, value: any): string | null => {
    // Check required fields
    if (placeholder.required && (!value || value.toString().trim() === '')) {
      return `${placeholder.label} is required`
    }

    // If field is empty and not required, skip other validations
    if (!value || value.toString().trim() === '') {
      return null
    }

    // Type-specific validations
    switch (placeholder.type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          return 'Please enter a valid email address'
        }
        break

      case 'number':
        const numValue = parseFloat(value)
        if (isNaN(numValue)) {
          return 'Please enter a valid number'
        }
        if (placeholder.min !== undefined && numValue < placeholder.min) {
          return `Value must be at least ${placeholder.min}`
        }
        if (placeholder.max !== undefined && numValue > placeholder.max) {
          return `Value must be at most ${placeholder.max}`
        }
        break

      case 'date':
        const date = new Date(value)
        if (isNaN(date.getTime())) {
          return 'Please enter a valid date'
        }
        break

      case 'text':
        const textValue = value.toString().trim()
        if (placeholder.min !== undefined && textValue.length < placeholder.min) {
          return `Must be at least ${placeholder.min} characters`
        }
        if (placeholder.max !== undefined && textValue.length > placeholder.max) {
          return `Must be at most ${placeholder.max} characters`
        }
        break
    }

    return null
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    placeholders.forEach(placeholder => {
      const value = formData[placeholder.name]
      const error = validateField(placeholder, value)
      if (error) {
        newErrors[placeholder.name] = error
      }
    })

    setErrors(newErrors)
    const isValid = Object.keys(newErrors).length === 0
    onValidationChange?.(isValid, newErrors)

    return isValid
  }

  const handleFieldChange = (placeholder: Placeholder, value: any) => {
    const newFormData = {
      ...formData,
      [placeholder.name]: value
    }
    onChange(newFormData)

    // Validate field if it has been touched
    if (touched[placeholder.name]) {
      const error = validateField(placeholder, value)
      setErrors(prev => ({
        ...prev,
        [placeholder.name]: error || ''
      }))
    }
  }

  const handleFieldBlur = (placeholder: Placeholder) => {
    setTouched(prev => ({
      ...prev,
      [placeholder.name]: true
    }))

    const value = formData[placeholder.name]
    const error = validateField(placeholder, value)
    setErrors(prev => ({
      ...prev,
      [placeholder.name]: error || ''
    }))
  }

  const renderField = (placeholder: Placeholder) => {
    const value = formData[placeholder.name] || placeholder.default || ''
    const error = touched[placeholder.name] ? errors[placeholder.name] : undefined

    switch (placeholder.type) {
      case 'select':
        return (
          <Select
            key={placeholder.name}
            label={placeholder.label}
            value={value.toString()}
            onChange={(e) => handleFieldChange(placeholder, e.target.value)}
            onBlur={() => handleFieldBlur(placeholder)}
            error={error}
            required={placeholder.required}
            placeholder={placeholder.placeholder}
            options={placeholder.options?.map(option => ({
              value: option,
              label: option
            })) || []}
          />
        )

      case 'number':
        return (
          <Input
            key={placeholder.name}
            type="number"
            label={placeholder.label}
            value={value.toString()}
            onChange={(e) => handleFieldChange(placeholder, e.target.value)}
            onBlur={() => handleFieldBlur(placeholder)}
            error={error}
            required={placeholder.required}
            placeholder={placeholder.placeholder}
            min={placeholder.min}
            max={placeholder.max}
          />
        )

      case 'date':
        return (
          <Input
            key={placeholder.name}
            type="date"
            label={placeholder.label}
            value={value.toString()}
            onChange={(e) => handleFieldChange(placeholder, e.target.value)}
            onBlur={() => handleFieldBlur(placeholder)}
            error={error}
            required={placeholder.required}
          />
        )

      case 'email':
        return (
          <Input
            key={placeholder.name}
            type="email"
            label={placeholder.label}
            value={value.toString()}
            onChange={(e) => handleFieldChange(placeholder, e.target.value)}
            onBlur={() => handleFieldBlur(placeholder)}
            error={error}
            required={placeholder.required}
            placeholder={placeholder.placeholder}
          />
        )

      case 'text':
      default:
        return (
          <Input
            key={placeholder.name}
            type="text"
            label={placeholder.label}
            value={value.toString()}
            onChange={(e) => handleFieldChange(placeholder, e.target.value)}
            onBlur={() => handleFieldBlur(placeholder)}
            error={error}
            required={placeholder.required}
            placeholder={placeholder.placeholder}
            minLength={placeholder.min}
            maxLength={placeholder.max}
          />
        )
    }
  }

  // Group placeholders by category or create a logical order
  const groupedPlaceholders = placeholders.reduce((groups, placeholder) => {
    // Simple grouping - you could enhance this based on your needs
    const group = placeholder.required ? 'required' : 'optional'
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(placeholder)
    return groups
  }, {} as Record<string, Placeholder[]>)

  return (
    <div className={`space-y-6 ${className}`}>
      {Object.entries(groupedPlaces).map(([groupName, group]) => (
        <div key={groupName}>
          {groupName === 'required' && group.length > 0 && (
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Required Information
            </h3>
          )}
          {groupName === 'optional' && group.length > 0 && (
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Additional Details
            </h3>
          )}
          <div className="space-y-4">
            {group.map(placeholder => renderField(placeholder))}
          </div>
        </div>
      ))}

      {/* Form Summary */}
      {Object.keys(errors).length > 0 && (
        <ErrorMessage
          message="Please correct the errors above before proceeding."
        />
      )}
    </div>
  )
}

export { DynamicForm }