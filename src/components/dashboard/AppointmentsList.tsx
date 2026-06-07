/**
 * components/dashboard/AppointmentsList.tsx
 * Vista de todas las citas con filtros por estado y fecha.
 */
import { useState } from 'react'
import { useAppointments } from '../../hooks/useAppointments'
import { formatDisplayTime } from '../../lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Appointment } from '../../types'
import { CheckCircle, XCircle, Circle, CalendarCheck, AlertTriangle } from 'lucide-react'

const STATUS_OPTIONS: { value: Appointment['status'] | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'confirmed', label: 'Confirmadas' },
  { value: 'completed', label: 'Completadas' },
  { value: 'cancelled', label: 'Canceladas' },
]

const statusConfig = {
  pending: { label: 'Pendiente', icon: Circle, className: 'text-amber-500' },
  confirmed: { label: 'Confirmada', icon: CheckCircle, className: 'text-green-500' },
  completed: { label: 'Completada', icon: CheckCircle, className: 'text-brand-oliva' },
  cancelled: { label: 'Cancelada', icon: XCircle, className: 'text-red-400' },
}

interface CancelConfirm {
  id: string
  name: string
}

export default function AppointmentsList() {
  const { appointments, loading, error, updateStatus } = useAppointments()
  const [statusFilter, setStatusFilter] = useState<Appointment['status'] | 'all'>('all')
  const [cancelConfirm, setCancelConfirm] = useState<CancelConfirm | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const filtered = appointments.filter(
    (a) => statusFilter === 'all' || a.status === statusFilter
  )

  const handleStatusChange = (appt: Appointment, newStatus: Appointment['status']) => {
    if (newStatus === 'cancelled') {
      setCancelConfirm({ id: appt.id!, name: appt.patient_name })
      return
    }
    updateStatus(appt.id!, newStatus).catch(console.error)
  }

  const confirmCancel = async () => {
    if (!cancelConfirm) return
    setCancelling(true)
    try {
      await updateStatus(cancelConfirm.id, 'cancelled', 'clinic')
    } catch (e) {
      console.error(e)
    } finally {
      setCancelling(false)
      setCancelConfirm(null)
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-cormorant text-3xl font-light tracking-widest text-brand-blue uppercase">
              Citas
            </h1>
            <p className="font-opensans text-xs text-brand-bruma mt-1">
              {appointments.length} citas registradas
            </p>
          </div>

          {/* Filtros de estado */}
          <div className="flex border border-gray-200 bg-white overflow-x-auto">
            {STATUS_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`px-3 py-2.5 font-opensans text-xs tracking-wider shrink-0 cursor-pointer border-none transition-colors ${
                  statusFilter === value
                    ? 'bg-brand-blue text-brand-lino'
                    : 'text-brand-bruma hover:text-brand-blue bg-transparent'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-white border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 border border-red-100 text-center">
            <p className="font-opensans text-sm text-red-500">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 bg-white border border-gray-100 text-center">
            <CalendarCheck size={32} className="text-brand-bruma mx-auto mb-3" strokeWidth={1} />
            <p className="font-opensans text-sm text-brand-bruma">Sin citas en este filtro.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 divide-y divide-gray-50">
            {/* Header desktop */}
            <div className="hidden lg:grid grid-cols-[1fr_1fr_1.5fr_1fr_1fr] gap-4 px-5 py-3 bg-gray-50">
              {['Fecha', 'Hora', 'Paciente', 'Servicio', 'Estado'].map((h) => (
                <span key={h} className="font-opensans text-xs text-brand-bruma tracking-wider uppercase">{h}</span>
              ))}
            </div>

            {filtered.map((appt) => {
              const status = statusConfig[appt.status ?? 'pending']
              const StatusIcon = status.icon
              return (
                <div key={appt.id} className="px-5 py-4">
                  {/* Desktop */}
                  <div className="hidden lg:grid grid-cols-[1fr_1fr_1.5fr_1fr_1fr] gap-4 items-center">
                    <p className="font-opensans text-sm text-brand-blue">
                      {format(new Date(appt.appointment_date + 'T12:00:00'), "d MMM yyyy", { locale: es })}
                    </p>
                    <p className="font-opensans text-sm text-brand-tierra">
                      {formatDisplayTime(appt.appointment_time)}
                    </p>
                    <div>
                      <p className="font-opensans text-sm font-medium text-brand-blue truncate">{appt.patient_name}</p>
                      <p className="font-opensans text-xs text-brand-bruma">{appt.phone}</p>
                    </div>
                    <p className="font-opensans text-xs text-brand-tierra truncate">{appt.service}</p>

                    {/* Selector de estado */}
                    <select
                      value={appt.status ?? 'pending'}
                      onChange={(e) => handleStatusChange(appt, e.target.value as Appointment['status'])}
                      disabled={appt.status === 'cancelled'}
                      className={`font-opensans text-xs border-none bg-transparent cursor-pointer focus:outline-none disabled:cursor-default ${status.className}`}
                    >
                      <option value="pending">Pendiente</option>
                      <option value="confirmed">Confirmada</option>
                      <option value="completed">Completada</option>
                      <option value="cancelled">Cancelada</option>
                    </select>
                  </div>

                  {/* Mobile */}
                  <div className="lg:hidden flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-opensans text-sm font-medium text-brand-blue">{appt.patient_name}</p>
                      <p className="font-opensans text-xs text-brand-tierra">{appt.service}</p>
                      <p className="font-opensans text-xs text-brand-bruma mt-0.5">
                        {format(new Date(appt.appointment_date + 'T12:00:00'), "d MMM yyyy", { locale: es })} · {formatDisplayTime(appt.appointment_time)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className={`flex items-center gap-1 ${status.className}`}>
                        <StatusIcon size={12} strokeWidth={1.5} />
                        <span className="font-opensans text-xs">{status.label}</span>
                      </div>
                      {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                        <select
                          value={appt.status ?? 'pending'}
                          onChange={(e) => handleStatusChange(appt, e.target.value as Appointment['status'])}
                          className={`font-opensans text-xs border border-gray-200 bg-white px-2 py-1 focus:outline-none ${status.className}`}
                        >
                          <option value="pending">Pendiente</option>
                          <option value="confirmed">Confirmada</option>
                          <option value="completed">Completada</option>
                          <option value="cancelled">Cancelada</option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Cancel confirmation dialog */}
      {cancelConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white max-w-sm w-full p-8 shadow-xl">
            <div className="flex items-start gap-3 mb-5">
              <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <h2 className="font-cormorant text-xl font-light tracking-wider text-brand-blue">
                  Cancelar cita
                </h2>
                <p className="font-opensans text-xs text-brand-bruma mt-1 leading-relaxed">
                  ¿Confirmas que deseas cancelar la cita de{' '}
                  <strong className="text-brand-blue">{cancelConfirm.name}</strong>?
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 px-4 py-3 mb-6">
              <p className="font-opensans text-xs text-amber-700 leading-relaxed">
                Se enviará un correo y WhatsApp al paciente notificándole la cancelación
                e invitándole a reagendar.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCancelConfirm(null)}
                disabled={cancelling}
                className="flex-1 border border-gray-200 font-opensans text-xs tracking-wider uppercase py-3 text-brand-bruma hover:text-brand-blue hover:border-brand-blue transition-colors cursor-pointer bg-transparent disabled:opacity-50"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={confirmCancel}
                disabled={cancelling}
                className="flex-1 bg-red-500 text-white font-opensans text-xs tracking-wider uppercase py-3 hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50"
              >
                {cancelling ? 'Cancelando...' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
