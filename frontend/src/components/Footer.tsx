import Link from 'next/link'
import { EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline'

const footerLinks = {
  'Product': [
    { name: 'Templates', href: '/templates' },
    { name: 'Pricing', href: '/#pricing' },
    { name: 'Features', href: '/#features' },
  ],
  'Company': [
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/contact' },
    { name: 'Blog', href: '/blog' },
  ],
  'Legal': [
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Refund Policy', href: '/refunds' },
    { name: 'Cookie Policy', href: '/cookies' },
  ],
  'Support': [
    { name: 'Help Center', href: '/help' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Documentation', href: '/docs' },
    { name: 'Contact Support', href: 'mailto:support@contractfabrico.com' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-primary text-white">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold mb-4">ContractFabrico</h3>
            <p className="text-gray-300 mb-6 max-w-md">
              Professional contract generation made simple. Secure, instant, and reliable legal templates for your business needs.
            </p>
            <div className="space-y-2">
              <div className="flex items-center text-gray-300">
                <EnvelopeIcon className="w-4 h-4 mr-2" />
                <span className="text-sm">support@contractfabrico.com</span>
              </div>
              <div className="flex items-center text-gray-300">
                <PhoneIcon className="w-4 h-4 mr-2" />
                <span className="text-sm">1-800-FABRIC</span>
              </div>
              <div className="flex items-center text-gray-300">
                <MapPinIcon className="w-4 h-4 mr-2" />
                <span className="text-sm">San Francisco, CA</span>
              </div>
            </div>
          </div>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-300 hover:text-accent transition-colors duration-200 text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} ContractFabrico. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="/sitemap.xml" className="text-gray-400 hover:text-accent transition-colors duration-200">
                Sitemap
              </a>
              <a href="/robots.txt" className="text-gray-400 hover:text-accent transition-colors duration-200">
                Robots
              </a>
              <a href="/rss.xml" className="text-gray-400 hover:text-accent transition-colors duration-200">
                RSS
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}