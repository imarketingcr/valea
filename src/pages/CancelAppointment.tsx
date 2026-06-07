import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatDisplayTime } from '../lib/utils'

type PageState = 'loading' | 'not_found' | 'already_cancelled' | 'already_completed' | 'ready' | 'confirming' | 'rescheduling' | 'cancelled' | 'error'

interface ApptSummary {
  patient_name: string
  service: string
  appointment_date: string
  appointment_time: string
  status: string
  confirmation_number?: string
}

export default function CancelAppointment() {
  const [searchParams] = useSearchParams()
  const id = searchParams.get('id')

  const [state, setState] = useState<PageState>('loading')
  const [appt, setAppt] = useState<ApptSummary | null>(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!id) { setState('not_found'); return }

    supabase
      .from('appointments')
      .select('patient_name, service, appointment_date, appointment_time, status, confirmation_number')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setState('not_found'); return }
        if (data.status === 'cancelled') { setState('already_cancelled'); return }
        if (data.status === 'completed') { setState('already_completed'); return }
        setAppt(data)
        setState('ready')
      })
  }, [id])

  const cancelAppointment = async () => {
    const { error } = await supabase.rpc('cancel_appointment_by_client', { p_id: id })
    if (error) throw error
  }

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await cancelAppointment()
      setState('cancelled')
    } catch {
      setState('error')
    } finally {
      setCancelling(false)
    }
  }

  const handleReschedule = async () => {
    setState('rescheduling')
    try {
      await cancelAppointment()
    } catch {
      // Even if cancellation fails, let them book a new appointment
    }
    window.location.href = '/#booking'
  }

  const formatDate = (d: string) =>
    format(new Date(d + 'T12:00:00'), "EEEE d 'de' MMMM, yyyy", { locale: es })

  return (
    <div className="min-h-screen bg-brand-blue flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <img src="/logo_claro_transparente.svg" alt="VALEA Aesthetics" className="h-20 object-contain" />
        </div>

        <div className="bg-brand-lino p-8">
          {(state === 'loading' || state === 'rescheduling') && (
            <div className="text-center py-8 space-y-3">
              <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto" />
              {state === 'rescheduling' && (
                <p className="font-opensans text-xs text-brand-bruma">Preparando tu reagendamiento…</p>
              )}
            </div>
          )}

          {state === 'not_found' && (
            <div className="text-center space-y-4">
              <p className="text-3xl">🔍</p>
              <h1 className="font-cormorant text-2xl font-light tracking-widest text-brand-blue uppercase">
                Cita no encontrada
              </h1>
              <p className="font-opensans text-sm text-brand-bruma leading-relaxed">
                No pudimos encontrar esta cita. Puede que el enlace haya expirado o sea incorrecto.
              </p>
              <a
                href="/"
                className="inline-block font-opensans text-xs text-brand-tierra tracking-wider hover:underline mt-2"
              >
                ← Volver al inicio
              </a>
            </div>
          )}

          {state === 'already_cancelled' && (
            <div className="text-center space-y-4">
              <p className="text-3xl">✅</p>
              <h1 className="font-cormorant text-2xl font-light tracking-widest text-brand-blue uppercase">
                Cita ya cancelada
              </h1>
              <p className="font-opensans text-sm text-brand-bruma leading-relaxed">
                Esta cita ya fue cancelada anteriormente.
              </p>
              <a
                href="/#booking"
                className="inline-block bg-brand-blue text-brand-lino font-opensans text-xs tracking-widest uppercase py-3 px-6 hover:bg-brand-tierra transition-colors duration-300 mt-2"
              >
                Agendar nueva cita
              </a>
            </div>
          )}

          {state === 'already_completed' && (
            <div className="text-center space-y-4">
              <p className="text-3xl">🏁</p>
              <h1 className="font-cormorant text-2xl font-light tracking-widest text-brand-blue uppercase">
                Cita completada
              </h1>
              <p className="font-opensans text-sm text-brand-bruma leading-relaxed">
                Esta cita ya fue realizada y no puede cancelarse.
              </p>
              <a href="/" className="inline-block font-opensans text-xs text-brand-tierra tracking-wider hover:underline mt-2">
                ← Volver al inicio
              </a>
            </div>
          )}

          {state === 'cancelled' && (
            <div className="text-center space-y-5">
              <p className="text-3xl">🗓️</p>
              <h1 className="font-cormorant text-2xl font-light tracking-widest text-brand-blue uppercase">
                Cita cancelada
              </h1>
              <p className="font-opensans text-sm text-brand-bruma leading-relaxed">
                Tu cita fue cancelada exitosamente. Esperamos verte pronto.
              </p>
              <a
                href="/#booking"
                className="block bg-brand-blue text-brand-lino font-opensans text-xs tracking-widest uppercase py-3 text-center hover:bg-brand-tierra transition-colors duration-300"
              >
                Agendar nueva cita →
              </a>
            </div>
          )}

          {state === 'error' && (
            <div className="text-center space-y-4">
              <p className="font-opensans text-sm text-red-500">
                Ocurrió un error. Por favor comunícate con nosotros directamente.
              </p>
              <a href="tel:+50670278704" className="font-opensans text-sm text-brand-blue hover:underline">
                📞 7027-8704
              </a>
            </div>
          )}

          {(state === 'ready' || state === 'confirming') && appt && (
            <>
              <div className="text-center mb-6">
                <span className="text-4xl">📋</span>
                <h1 className="font-cormorant text-2xl font-light tracking-widest text-brand-blue uppercase mt-3">
                  Cancelar cita
                </h1>
                <p className="font-opensans text-sm text-brand-bruma mt-2">
                  Hola <strong className="text-brand-blue">{appt.patient_name.split(' ')[0]}</strong>, encontramos tu cita.
                </p>
              </div>

              {/* Appointment card */}
              <div className="border border-brand-bruma/30 divide-y divide-brand-bruma/15 mb-6">
                {[
                  ['📅 Fecha', formatDate(appt.appointment_date)],
                  ['⏰ Hora', formatDisplayTime(appt.appointment_time)],
                  ['💉 Servicio', appt.service],
                  ['🔖 Ref', appt.confirmation_number ?? '—'],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-3 px-4 py-2.5">
                    <span className="font-opensans text-xs text-brand-bruma w-28 shrink-0">{label}</span>
                    <span className="font-opensans text-xs text-brand-blue font-medium">{value}</span>
                  </div>
                ))}
              </div>

              {state === 'ready' && (
                <>
                  {/* Empathetic message */}
                  <div className="bg-brand-arena/30 border-l-2 border-brand-tierra px-4 py-3 mb-6">
                    <p className="font-opensans text-xs text-brand-tierra leading-relaxed">
                      Entendemos que los imprevistos pasan. Antes de cancelar,
                      ¿te gustaría <strong>reagendar para otra fecha</strong>? Tenemos disponibilidad y
                      nos encantaría atenderte pronto.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleReschedule}
                      className="w-full bg-brand-blue text-brand-lino font-opensans text-xs tracking-widest uppercase py-3 text-center hover:bg-brand-tierra transition-colors duration-300 cursor-pointer"
                    >
                      Reagendar mi cita →
                    </button>
                    <button
                      type="button"
                      onClick={() => setState('confirming')}
                      className="w-full border border-brand-bruma/40 text-brand-bruma font-opensans text-xs tracking-wider uppercase py-3 hover:border-red-300 hover:text-red-400 transition-colors cursor-pointer bg-transparent"
                    >
                      Cancelar de todas formas
                    </button>
                  </div>
                </>
              )}

              {state === 'confirming' && (
                <>
                  <div className="bg-red-50 border border-red-100 px-4 py-3 mb-6 text-center">
                    <p className="font-opensans text-xs text-red-600 leading-relaxed">
                      ¿Confirmas que deseas cancelar esta cita?<br />
                      Esta acción no se puede deshacer.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="w-full bg-red-500 text-white font-opensans text-xs tracking-widest uppercase py-3 hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {cancelling ? 'Cancelando...' : 'Sí, cancelar mi cita'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setState('ready')}
                      className="w-full font-opensans text-xs text-brand-bruma tracking-wider hover:text-brand-blue transition-colors cursor-pointer bg-transparent border-none"
                    >
                      ← Volver
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <p className="text-center font-opensans text-xs text-brand-lino/30 mt-6">
          <a href="/" className="hover:text-brand-lino/60 transition-colors">← Volver al sitio</a>
          {' · '}
          <a href="tel:+50670278704" className="hover:text-brand-lino/60 transition-colors">📞 7027-8704</a>
        </p>
      </div>
    </div>
  )
}
