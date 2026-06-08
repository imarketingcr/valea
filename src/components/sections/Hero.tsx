import { motion, type Variants } from 'framer-motion'
import { Phone } from 'lucide-react'
import Button from '../ui/Button'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.7, ease: [0.25, 0, 0, 1] as [number, number, number, number] },
  }),
}

export default function Hero() {
  const handleBooking = () => {
    const el = document.getElementById('booking')
    if (el) {
      const offset = 80
      const top = el.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  return (
    <section className="relative min-h-[60vh] md:min-h-[70vh] flex items-center overflow-hidden bg-brand-lino pt-20">
      {/* SVG decorativo de fondo — isotipo simplificado */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" aria-hidden="true">
        <svg
          viewBox="0 0 400 400"
          className="w-[500px] h-[500px] opacity-[0.04] text-brand-blue"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
        >
          {/* Silueta floral/orgánica minimalista evocando el isotipo de VALEA */}
          <circle cx="200" cy="200" r="180" />
          <circle cx="200" cy="200" r="130" />
          <ellipse cx="200" cy="160" rx="50" ry="90" />
          <path d="M 130 200 Q 200 120 270 200 Q 200 280 130 200 Z" />
          <line x1="200" y1="20" x2="200" y2="380" />
          <line x1="20" y1="200" x2="380" y2="200" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Columna texto */}
          <div className="order-2 lg:order-1 py-10 lg:py-16">
            <motion.p
              custom={0}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="font-opensans text-xs font-medium tracking-[0.3em] uppercase text-brand-tierra mb-5"
            >
              Clínica Estética Médica
            </motion.p>

            <motion.h1
              custom={1}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="font-cormorant text-5xl md:text-6xl lg:text-7xl font-light tracking-[0.05em] text-brand-blue leading-[1.1] mb-6"
            >
              El Arte de la<br />
              <em className="not-italic font-extralight text-brand-tierra">Naturalidad.</em>
            </motion.h1>

            <motion.p
              custom={2}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="font-opensans text-base font-light text-brand-tierra/80 leading-relaxed max-w-md mb-8"
            >
              Tratamientos personalizados que realzan tu belleza natural con
              precisión médica y sensibilidad estética.
            </motion.p>

            <motion.div
              custom={3}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="flex flex-col sm:flex-row gap-4 items-start sm:items-center"
            >
              <Button variant="primary" size="lg" onClick={handleBooking}>
                Agendar mi Cita
              </Button>

              <a
                href="tel:+50670278704"
                className="flex items-center gap-2 font-opensans text-sm text-brand-tierra hover:text-brand-blue transition-colors duration-300"
              >
                <Phone size={15} />
                <span>7027-8704</span>
              </a>
            </motion.div>

            {/* Credencial doctora */}
            <motion.div
              custom={4}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="mt-10 pt-8 border-t border-brand-bruma/40 flex items-center gap-4"
            >
              <div className="w-8 h-px bg-brand-arena" />
              <p className="font-opensans text-xs tracking-wider text-brand-bruma uppercase">
                Dra. Carolina Castillo Rodas — Código MED16178
              </p>
            </motion.div>
          </div>

          {/* Columna imagen */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
            className="order-1 lg:order-2 relative"
          >
            <div className="relative aspect-[4/5] lg:aspect-[3/4] overflow-hidden">
              {/* Placeholder elegante con gradiente si no hay imagen */}
              <div
                id="hero-image"
                className="w-full h-full bg-gradient-to-br from-brand-arena/30 via-brand-bruma/20 to-brand-lino relative"
                style={{ minHeight: '380px' }}
              >
                {/* Si hay imagen de hero, se muestra; sino el gradiente */}
                <img
                  src="https://res.cloudinary.com/dkpfptjvm/image/upload/f_auto,q_auto/v1780903156/flores_abpwce.jpg"
                  alt="VALEA Aesthetics — Clínica Estética"
                  width="1920"
                  height="1280"
                  fetchPriority="high"
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                />

                {/* Overlay sutil */}
                <div className="absolute inset-0 bg-gradient-to-l from-brand-lino/60 to-transparent" />

                {/* Badge flotante */}
                <div className="absolute bottom-6 left-6 bg-brand-lino/90 backdrop-blur-sm px-5 py-3 border border-brand-arena/30">
                  <p className="font-cormorant text-base text-brand-blue tracking-wider">
                    Resultados naturales
                  </p>
                  <p className="font-opensans text-xs text-brand-tierra/80 tracking-wider">
                    Precisión médica
                  </p>
                </div>
              </div>

              {/* Marco decorativo */}
              <div className="absolute -bottom-3 -right-3 w-full h-full border border-brand-arena/40 pointer-events-none" aria-hidden="true" />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
