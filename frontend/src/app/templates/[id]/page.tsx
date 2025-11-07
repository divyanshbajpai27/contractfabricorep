'use client'

import React from 'react'
import { TemplateBuilder } from '@/components/TemplateBuilder'

interface PageProps {
  params: {
    id: string
  }
}

export default function TemplatePage({ params }: PageProps) {
  return <TemplateBuilder templateId={params.id} />
}