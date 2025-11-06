'use client'

import { useState } from 'react'
import { ArrowRightIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function Hero() {
  const [email, setEmail] = useState('')

  return (
    <div className="relative bg-gradient-to-br from-teal-50 to-white">
      <div className="container mx-auto px-4 py-20 sm:py-24 lg:py-32">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-primary mb-6">
            Fabricate your contracts
            <span className="text-accent"> instantly.</span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Professional legal templates in seconds. Fill, preview, pay, and download.
            California jurisdiction, secure payments, and instant delivery.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/templates" className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2">
              <DocumentTextIcon className="w-6 h-6" />
              Browse Templates
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
            <Link
              href="#pricing"
              className="btn-secondary text-lg px-8 py-4 inline-flex items-center gap-2"
            >
              View Pricing
            </Link>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-accent mb-2">10+</div>
            <div className="text-gray-600">Legal Templates</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-accent mb-2">&lt;60s</div>
            <div className="text-gray-600">Generation Time</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-accent mb-2">100%</div>
            <div className="text-gray-600">Secure Processing</div>
          </div>
        </div>
      </div>
    </div>
  )
}