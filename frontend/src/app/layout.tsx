import type { Metadata } from 'next'
import { Inter, Roboto } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-heading'
})

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-body'
})

export const metadata: Metadata = {
  title: 'ContractFabrico - Instant Contract Generation',
  description: 'Fabricate your contracts instantly. Professional legal templates with secure payment processing.',
  keywords: 'instant contract generator, download NDA, generate agreement online',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://contractfabrico.com'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${roboto.variable} font-body antialiased`}>
        {children}
      </body>
    </html>
  )
}