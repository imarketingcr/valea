import { useState, useEffect } from 'react'
import { Menu, X, Phone } from 'lucide-react'
import { cn } from '../../lib/utils'

const navLinks = [
  { label: 'Servicios', href: '#services' },
  { label: 'Agendar Cita', href: '#booking' },
  { label: 'Contacto', href: '#footer' },
]

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const handleNavClick = (href: string) => {
    setMobileOpen(false)
    const el = document.querySelector(href)
    if (el) {
      const offset = 80
      const top = el.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-40 transition-all duration-500',
          isScrolled
            ? 'bg-brand-lino/95 backdrop-blur-md shadow-sm'
            : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between h-20">
          {/* Logo */}
          <a
            href="/"
            className="flex items-center gap-3 shrink-0"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          >
            <img
              src="https://res.cloudinary.com/dkpfptjvm/image/upload/v1780903156/logo_oscuro_transparente_bc5i1j.svg"
              alt="VALEA Aesthetics"
              width="36"
              height="64"
              className={cn(
                'transition-all duration-500 object-contain',
                isScrolled ? 'h-14' : 'h-16'
              )}
            />
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className={cn(
                  'font-opensans text-xs tracking-widest uppercase transition-colors duration-300 cursor-pointer bg-transparent border-none',
                  isScrolled ? 'text-brand-blue hover:text-brand-tierra' : 'text-brand-blue hover:text-brand-tierra'
                )}
              >
                {link.label}
              </button>
            ))}

            {/* Phone */}
            <a
              href="tel:+50670278704"
              className={cn(
                'flex items-center gap-2 font-opensans text-xs tracking-wider transition-colors duration-300',
                isScrolled ? 'text-brand-tierra' : 'text-brand-tierra'
              )}
            >
              <Phone size={14} />
              7027-8704
            </a>

            {/* Dashboard — discreto */}
            <a
              href="/dashboard"
              className="font-opensans text-[10px] tracking-widest uppercase text-brand-bruma hover:text-brand-tierra transition-colors duration-300 border border-brand-bruma/40 px-3 py-1.5 hover:border-brand-tierra"
            >
              Admin
            </a>
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden text-brand-blue p-2 bg-transparent border-none cursor-pointer"
            aria-label="Abrir menú"
          >
            <Menu size={24} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <>
        {/* Overlay */}
        <div
          className={cn(
            'fixed inset-0 z-50 bg-brand-blue/40 backdrop-blur-sm transition-opacity duration-300',
            mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          )}
          onClick={() => setMobileOpen(false)}
        />

        {/* Drawer Panel */}
        <div
          className={cn(
            'fixed top-0 right-0 bottom-0 z-50 w-72 bg-brand-lino flex flex-col transition-transform duration-400',
            mobileOpen ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          <div className="flex items-center justify-between px-6 py-6 border-b border-brand-bruma/30">
            <img
              src="https://res.cloudinary.com/dkpfptjvm/image/upload/v1780903156/logo_oscuro_transparente_bc5i1j.svg"
              alt="VALEA Aesthetics"
              width="32"
              height="56"
              className="h-14 object-contain"
            />
            <button
              onClick={() => setMobileOpen(false)}
              className="text-brand-bruma hover:text-brand-blue bg-transparent border-none cursor-pointer"
              aria-label="Cerrar menú"
            >
              <X size={22} strokeWidth={1.5} />
            </button>
          </div>

          <nav className="flex flex-col gap-1 px-6 py-8 flex-1">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className="text-left font-opensans text-sm tracking-widest uppercase text-brand-blue hover:text-brand-tierra py-3 border-b border-brand-bruma/20 bg-transparent border-x-0 border-t-0 cursor-pointer transition-colors duration-300"
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="px-6 py-6 border-t border-brand-bruma/30 space-y-4">
            <a
              href="tel:+50670278704"
              className="flex items-center gap-2 font-opensans text-sm text-brand-tierra"
              onClick={() => setMobileOpen(false)}
            >
              <Phone size={14} />
              7027-8704
            </a>
            <a
              href="/dashboard"
              className="block text-center font-opensans text-xs tracking-widest uppercase text-brand-bruma hover:text-brand-tierra border border-brand-bruma/40 px-4 py-2 transition-colors duration-300"
              onClick={() => setMobileOpen(false)}
            >
              Acceso Admin
            </a>
          </div>
        </div>
      </>
    </>
  )
}
