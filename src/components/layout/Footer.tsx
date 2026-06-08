import { MapPin, Phone, Mail, Globe, Instagram } from 'lucide-react'

export default function Footer() {
  return (
    <footer id="footer" className="bg-brand-blue text-brand-lino">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-20">
        {/* Logo centrado */}
        <div className="flex justify-center mb-12">
          <img
            src="https://res.cloudinary.com/dkpfptjvm/image/upload/v1780903156/logo_claro_transparente_uc22dn.svg"
            alt="VALEA Aesthetics"
            width="42"
            height="80"
            className="h-20 object-contain"
          />
        </div>

        {/* Tres columnas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
          {/* Sobre VALEA */}
          <div>
            <h3 className="font-cormorant text-lg tracking-widest uppercase text-brand-arena mb-4 font-light">
              Sobre VALEA
            </h3>
            <p className="font-opensans text-sm text-brand-lino/70 leading-relaxed">
              El arte de la naturalidad. En VALEA Aesthetics combinamos precisión médica
              con sensibilidad estética para realzar tu belleza única, con tratamientos
              seguros y resultados naturales.
            </p>
            <p className="font-opensans text-xs text-brand-lino/40 mt-4 tracking-wider italic">
              "Tan única como tu esencia."
            </p>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="font-cormorant text-lg tracking-widest uppercase text-brand-arena mb-4 font-light">
              Contacto
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin size={14} className="text-brand-arena mt-0.5 shrink-0" />
                <span className="font-opensans text-sm text-brand-lino/70">Alajuela, Alajuela</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={14} className="text-brand-arena shrink-0" />
                <a
                  href="tel:+50670278704"
                  className="font-opensans text-sm text-brand-lino/70 hover:text-brand-arena transition-colors"
                >
                  7027-8704
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={14} className="text-brand-arena shrink-0" />
                <a
                  href="mailto:info@valeacr.com"
                  className="font-opensans text-sm text-brand-lino/70 hover:text-brand-arena transition-colors"
                >
                  info@valeacr.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Globe size={14} className="text-brand-arena shrink-0" />
                <span className="font-opensans text-sm text-brand-lino/70">www.valeacr.com</span>
              </li>
              <li className="flex items-center gap-3">
                <Instagram size={14} className="text-brand-arena shrink-0" />
                <a
                  href="https://instagram.com/valeacr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-opensans text-sm text-brand-lino/70 hover:text-brand-arena transition-colors"
                >
                  @valeacr
                </a>
              </li>
            </ul>
          </div>

          {/* Links rápidos */}
          <div>
            <h3 className="font-cormorant text-lg tracking-widest uppercase text-brand-arena mb-4 font-light">
              Navegación
            </h3>
            <ul className="space-y-3">
              {[
                { label: 'Nuestros Servicios', href: '#services' },
                { label: 'Agendar Cita', href: '#booking' },
                { label: 'Testimonios', href: '#reviews' },
              ].map((link) => (
                <li key={link.href}>
                  <button
                    onClick={() => {
                      const el = document.querySelector(link.href)
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }
                    }}
                    className="font-opensans text-sm text-brand-lino/70 hover:text-brand-arena transition-colors duration-300 bg-transparent border-none cursor-pointer text-left tracking-wider"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
              <li>
                <a
                  href="/dashboard"
                  className="font-opensans text-xs text-brand-lino/30 hover:text-brand-lino/60 transition-colors duration-300 tracking-wider"
                >
                  Acceso Administrador
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Línea decorativa + copyright */}
      <div className="border-t border-brand-arena/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="font-opensans text-xs text-brand-lino/40 tracking-wider">
            © 2025 VALEA Aesthetics. Dra. Carolina Castillo Rodas — Código MED16178
          </p>
          <div className="w-16 h-px bg-brand-arena/30" />
          <p className="font-opensans text-xs text-brand-lino/30 tracking-wider">
            Alajuela, Costa Rica
          </p>
        </div>
      </div>
    </footer>
  )
}
