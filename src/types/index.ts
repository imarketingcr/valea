/**
 * types/index.ts — Tipos globales del proyecto VALEA Aesthetics
 * Coinciden exactamente con el schema de Supabase
 */

// ─── CITAS ────────────────────────────────────────────────────────────────────
export interface Appointment {
  id?: string
  created_at?: string
  patient_name: string
  phone: string
  email: string
  service: string
  appointment_date: string       // DATE → 'YYYY-MM-DD'
  appointment_time: string       // TIME → 'HH:MM'
  notes?: string
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  cancelled_by?: 'client' | 'clinic'
  outlook_event_id?: string
  confirmation_number?: string
}

// ─── PACIENTES ────────────────────────────────────────────────────────────────
export interface MedicalHistory {
  allergies?: string
  previous_surgeries?: string
  chronic_diseases?: string
  family_history?: string
  [key: string]: string | undefined
}

export interface SystemsReview {
  cardiovascular?: string
  respiratory?: string
  digestive?: string
  neurological?: string
  dermatological?: string
  musculoskeletal?: string
  endocrine?: string
  genitourinary?: string
  [key: string]: string | undefined
}

export interface Patient {
  id?: string
  created_at?: string
  updated_at?: string
  full_name: string
  id_number?: string
  birth_date?: string
  age?: number
  sex?: 'Femenino' | 'Masculino' | 'Otro'
  address?: string
  phone?: string
  email?: string
  emergency_contact?: string
  emergency_phone?: string
  record_number?: string
  consultation_reason?: string
  current_condition?: string
  medical_history?: MedicalHistory
  current_medications?: string
  previous_studies?: string
  systems_review?: SystemsReview
  active?: boolean
  notes?: string
}

// ─── NOTAS DE EVOLUCIÓN ───────────────────────────────────────────────────────
export interface EvolutionNote {
  id?: string
  patient_id: string
  created_at?: string
  visit_date: string
  blood_pressure?: string
  heart_rate?: number
  temperature?: number
  weight?: number
  note_text: string
  diagnosis?: string
  treatment_changes?: string
  doctor_name?: string
  signed?: boolean
}

// ─── TRATAMIENTOS ─────────────────────────────────────────────────────────────
export interface Medication {
  name: string
  dose: string
  route: string
  frequency: string
  duration: string
}

export interface Treatment {
  id?: string
  patient_id: string
  created_at?: string
  treatment_date: string
  service: string
  medications?: Medication[]
  procedures?: string
  studies_ordered?: string
  follow_up_date?: string
  notes?: string
}

// ─── CONSENTIMIENTOS ──────────────────────────────────────────────────────────
export interface Consent {
  id?: string
  patient_id: string
  created_at?: string
  consent_type: string
  consent_text?: string
  signed_at?: string
  signed_by?: string
  document_url?: string
}

// ─── REVIEWS (landing page) ───────────────────────────────────────────────────
export interface Review {
  id: number
  name: string
  avatar_initial: string
  rating: number
  text: string
  service: string
}

// ─── SERVICIOS DISPONIBLES ────────────────────────────────────────────────────
export const SERVICES = [
  'Toxina Botulínica (Botox)',
  'Rellenos con Ácido Hialurónico',
  'Bioestimuladores de Colágeno',
  'Peeling Facial',
  'Perfilado Facial',
] as const

export type Service = typeof SERVICES[number]

// ─── DISPONIBILIDAD ───────────────────────────────────────────────────────────

/** Slot ya reservado con datos del paciente (para tooltips en el dashboard) */
export interface OccupiedSlot {
  time: string          // 'HH:MM'
  patientName: string   // visible solo en dashboard (privacidad)
  service: string       // visible solo en dashboard
}

// ─── KPIs del Dashboard ───────────────────────────────────────────────────────
export interface DashboardKPIs {
  totalPatients: number
  appointmentsToday: number
  appointmentsThisWeek: number
  newThisMonth: number
}
