import { ShieldCheckIcon, LockClosedIcon, UserGroupIcon } from '@heroicons/react/24/outline'

const trustFeatures = [
  {
    name: 'Secure & Encrypted',
    description: 'Your data is protected with industry-standard encryption and security measures.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'PCI Compliant',
    description: 'Payment processing through Stripe, meeting the highest security standards.',
    icon: LockClosedIcon,
  },
  {
    name: 'Trusted by Professionals',
    description: 'Used by businesses, freelancers, and legal professionals across California.',
    icon: UserGroupIcon,
  },
]

export default function Trust() {
  return (
    <div className="py-16 bg-white border-t border-gray-200">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-primary mb-4">
            Built on Trust and Security
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We take your security and privacy seriously. Your data and documents are protected at every step.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {trustFeatures.map((feature) => (
            <div key={feature.name} className="text-center">
              <div className="w-16 h-16 bg-teal-100 text-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">{feature.name}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 mb-4">
            <strong>Legal Disclaimer:</strong> ContractFabrico provides template documents for informational purposes only
            and does not constitute legal advice. No attorney-client relationship is created.
            You should consult a licensed attorney before using any document.
          </p>
          <div className="flex justify-center space-x-6 text-xs text-gray-400">
            <span>© 2024 ContractFabrico</span>
            <span>•</span>
            <a href="/terms" className="hover:text-accent">Terms of Service</a>
            <span>•</span>
            <a href="/privacy" className="hover:text-accent">Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  )
}