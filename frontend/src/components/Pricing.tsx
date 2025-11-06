'use client'

import { CheckIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

const plans = [
  {
    name: 'Basic',
    price: '9.99',
    description: 'Perfect for individuals and small needs',
    features: [
      'Professional contract templates',
      'PDF + DOCX download formats',
      'Email delivery with download links',
      '7-day document access',
      'Basic customer support',
    ],
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '19.99',
    description: 'Ideal for businesses and regular use',
    features: [
      'Everything in Basic',
      'Advanced contract templates',
      'Priority email support',
      'Custom branding options',
      'Document version history',
      'Unlimited revisions for 30 days',
    ],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '49.99',
    description: 'For teams with high-volume needs',
    features: [
      'Everything in Professional',
      'Unlimited document generation',
      'Dedicated account manager',
      'Custom template creation',
      'Team collaboration tools',
      'API access for integrations',
      'Priority processing queue',
    ],
    highlighted: false,
  },
]

export default function Pricing() {
  return (
    <div className="py-20 bg-gray-50" id="pricing">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-primary mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the plan that works best for your needs. No hidden fees or long-term commitments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`card relative ${
                plan.highlighted
                  ? 'ring-2 ring-accent shadow-xl scale-105'
                  : 'hover:shadow-lg'
              } transition-all duration-300`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-accent text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-primary mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center mb-4">
                  <span className="text-4xl font-bold text-accent">${plan.price}</span>
                  <span className="text-gray-600 ml-2">/document</span>
                </div>
                <p className="text-gray-600">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <CheckIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="text-center">
                <Link
                  href="/templates"
                  className={`w-full inline-block py-3 px-6 rounded-lg font-medium transition-colors duration-200 ${
                    plan.highlighted
                      ? 'bg-accent text-white hover:bg-teal-600'
                      : 'bg-gray-100 text-primary hover:bg-gray-200'
                  }`}
                >
                  Get Started
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl font-heading font-semibold text-primary mb-6">
              Frequently Asked Questions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              <div>
                <h4 className="font-semibold text-primary mb-2">What payment methods do you accept?</h4>
                <p className="text-gray-600 text-sm">
                  We accept all major credit cards, debit cards, and digital payment methods through Stripe.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-2">Can I modify the templates?</h4>
                <p className="text-gray-600 text-sm">
                  Yes, all templates are customizable. You can fill in your specific details during the generation process.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-2">How long are documents accessible?</h4>
                <p className="text-gray-600 text-sm">
                  Your generated documents are available for download for 7 days with unlimited access during that period.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-2">Are the templates legally binding?</h4>
                <p className="text-gray-600 text-sm">
                  Our templates provide a solid foundation but should be reviewed by a qualified attorney for your specific needs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}