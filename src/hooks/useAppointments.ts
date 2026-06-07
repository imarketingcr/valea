/**
 * hooks/useAppointments.ts — Hook para gestión de citas con Supabase.
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Appointment, DashboardKPIs } from '../types'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: err } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })

      if (err) throw err
      setAppointments(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar citas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const updateStatus = async (
    id: string,
    status: Appointment['status'],
    cancelledBy?: 'client' | 'clinic',
  ) => {
    const patch: Partial<Appointment> = { status }
    if (status === 'cancelled' && cancelledBy) patch.cancelled_by = cancelledBy

    const { error: err } = await supabase
      .from('appointments')
      .update(patch)
      .eq('id', id)

    if (err) throw err
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...patch } : a))
    )
  }

  return { appointments, loading, error, refetch: fetchAppointments, updateStatus }
}

export function useTodayAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd')
    supabase
      .from('appointments')
      .select('*')
      .eq('appointment_date', today)
      .order('appointment_time', { ascending: true })
      .then(({ data }) => {
        setAppointments(data || [])
        setLoading(false)
      })
  }, [])

  return { appointments, loading }
}

export function usePatientAppointments(patientEmail: string | undefined) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!patientEmail) { setLoading(false); return }
    setLoading(true)
    supabase
      .from('appointments')
      .select('*')
      .eq('email', patientEmail)
      .order('appointment_date', { ascending: false })
      .then(({ data }) => {
        setAppointments(data || [])
        setLoading(false)
      })
  }, [patientEmail, refreshKey])

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), [])

  return { appointments, loading, refetch }
}

export function useDashboardKPIs() {
  const [kpis, setKpis] = useState<DashboardKPIs>({
    totalPatients: 0,
    appointmentsToday: 0,
    appointmentsThisWeek: 0,
    newThisMonth: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchKPIs = async () => {
      const today = format(new Date(), 'yyyy-MM-dd')
      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
      const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
      const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
      const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd')

      const [
        { count: totalPatients },
        { count: appointmentsToday },
        { count: appointmentsThisWeek },
        { count: newThisMonth },
      ] = await Promise.all([
        supabase.from('patients').select('*', { count: 'exact', head: true }),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('appointment_date', today),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).gte('appointment_date', weekStart).lte('appointment_date', weekEnd),
        supabase.from('patients').select('*', { count: 'exact', head: true }).gte('created_at', monthStart).lte('created_at', monthEnd),
      ])

      setKpis({
        totalPatients: totalPatients ?? 0,
        appointmentsToday: appointmentsToday ?? 0,
        appointmentsThisWeek: appointmentsThisWeek ?? 0,
        newThisMonth: newThisMonth ?? 0,
      })
      setLoading(false)
    }

    fetchKPIs()
  }, [])

  return { kpis, loading }
}
