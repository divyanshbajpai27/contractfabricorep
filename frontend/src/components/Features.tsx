import {
  ShieldCheckIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  CreditCardIcon,
  EnvelopeIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

const features = [
  {
    name: 'Secure Payments',
    description: 'PCI-compliant Stripe checkout with India account support. USD transactions with instant confirmation.',
    icon: CreditCardIcon,
  },
  {
    name: 'Instant Generation',
    description: 'Professional contracts in under 60 seconds. PDF and DOCX formats ready for immediate download.',
    icon: ClockIcon,
  },
  {
    name: 'Legal Compliance',
    description: 'California jurisdiction templates with proper disclaimers. Source attribution and license compliance.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'Email Delivery',
    description: 'Automatic email with download links. 7-day access to generated documents with invoice.',
    icon: EnvelopeIcon,
  },
  {
    name: 'Quality Templates',
    description: 'Sourced from Docracy, Avodocs, and other open legal platforms. Regularly updated and verified.',
    icon: DocumentArrowDownIcon,
  },
  {
    name: 'Automated Process',
    description: 'End-to-end automation from template selection to document delivery. Minimal manual intervention.',
    icon: CheckCircleIcon,
  },
]

export default function Features() {
  return (
    <div className="py-20 bg-gray-50">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-primary mb-4">
            Why Choose ContractFabrico?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Professional contract generation with enterprise-grade security and compliance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.name} className="card text-center group hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 bg-accent text-white rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">{feature.name}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}