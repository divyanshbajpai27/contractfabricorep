import Hero from '@/components/Hero'
import Features from '@/components/Features'
import Pricing from '@/components/Pricing'
import Templates from '@/components/Templates'
import Trust from '@/components/Trust'
import Footer from '@/components/Footer'

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Features />
      <Templates />
      <Pricing />
      <Trust />
      <Footer />
    </main>
  )
}