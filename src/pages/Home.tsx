import { lazy, Suspense } from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import Hero from '../components/sections/Hero'
import Services from '../components/sections/Services'
import Reviews from '../components/sections/Reviews'

// Lazy-load Booking: pulls in react-hook-form, zod, react-datepicker — keeps initial bundle lean
const Booking = lazy(() => import('../components/sections/Booking'))

export default function Home() {
  return (
    <div className="min-h-screen bg-brand-lino">
      <Header />
      <main>
        <Hero />
        <Services />
        <Suspense fallback={<div className="py-20 bg-brand-blue" />}>
          <Booking />
        </Suspense>
        <Reviews />
      </main>
      <Footer />
    </div>
  )
}
