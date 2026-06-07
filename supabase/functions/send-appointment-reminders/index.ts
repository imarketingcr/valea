import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AppointmentRecord {
  id: string
  patient_name: string
  phone: string
  email: string
  service: string
  appointment_date: string
  appointment_time: string
  notes?: string
  status: string
  confirmation_number?: string
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('es-CR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`
}

/** Normalizes a Costa Rica phone number to E.164 (+506XXXXXXXX) */
function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('506') && digits.length === 11) return `+${digits}`
  if (digits.length === 8) return `+506${digits}`
  if (phone.startsWith('+') && digits.length >= 10) return `+${digits}`
  return null
}

/** Returns tomorrow's date in Costa Rica (UTC-6) as YYYY-MM-DD */
function getTomorrowCR(): string {
  // Edge functions run in UTC; CR is UTC-6 (no DST)
  const crNow = new Date(Date.now() - 6 * 60 * 60 * 1000)
  const tomorrowCR = new Date(crNow.getTime() + 24 * 60 * 60 * 1000)
  const y = tomorrowCR.getUTCFullYear()
  const m = String(tomorrowCR.getUTCMonth() + 1).padStart(2, '0')
  const d = String(tomorrowCR.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// ─── Twilio WhatsApp ───────────────────────────────────────────────────────────

async function sendTwilioWhatsApp(to: string, body: string): Promise<void> {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
  const from = Deno.env.get('TWILIO_WHATSAPP_FROM')

  if (!accountSid || !authToken || !from) return

  try {
    const credentials = btoa(`${accountSid}:${authToken}`)
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: `whatsapp:${from}`,
          To: `whatsapp:${to}`,
          Body: body,
        }),
      }
    )
    if (!res.ok) console.error('[Twilio] Error:', res.status, await res.text())
    else console.log('[Twilio] Reminder enviado a', to)
  } catch (err) {
    console.error('[Twilio] Error inesperado:', err)
  }
}

// ─── Notifications ─────────────────────────────────────────────────────────────

async function sendReminderEmail(appt: AppointmentRecord): Promise<void> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  const fromEmail = Deno.env.get('FROM_EMAIL') ?? 'notificaciones@valeacr.com'
  const clinicName = Deno.env.get('CLINIC_NAME') ?? 'VALEA Aesthetics'
  const doctorName = Deno.env.get('DOCTOR_NAME') ?? 'Dra. Carolina Castillo Rodas'

  if (!apiKey || !appt.email) return

  const fecha = formatDate(appt.appointment_date)
  const hora = formatTime(appt.appointment_time)
  const firstName = appt.patient_name.split(' ')[0]
  const confirmNum = appt.confirmation_number ?? '—'

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:'Open Sans',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0;padding:40px 0;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="background:#FAF9F6;max-width:580px;">
  <tr><td style="background:#1C4BA7;padding:28px 40px;text-align:center;">
    <p style="margin:0;color:#D1BAA6;font-family:Georgia,serif;font-size:26px;font-weight:300;letter-spacing:6px;text-transform:uppercase;">VALEA</p>
    <p style="margin:4px 0 0;color:rgba(250,249,246,0.6);font-size:11px;letter-spacing:3px;text-transform:uppercase;">Aesthetics</p>
  </td></tr>
  <tr><td style="padding:36px 40px 0;text-align:center;">
    <span style="font-size:44px;">🔔</span>
    <h1 style="margin:16px 0 0;color:#1C4BA7;font-family:Georgia,serif;font-size:24px;font-weight:300;letter-spacing:2px;">
      Recordatorio de Cita
    </h1>
    <p style="margin:10px 0 0;color:#8B6D53;font-size:14px;line-height:1.6;">
      Hola <strong>${firstName}</strong>, te recordamos que <strong>mañana</strong> tienes una cita en ${clinicName}.
    </p>
  </td></tr>
  <tr><td style="padding:24px 40px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #D1BAA6;border-collapse:collapse;">
      ${[
        ['📅 Fecha', fecha],
        ['⏰ Hora', hora],
        ['💉 Servicio', appt.service],
        ['🔖 Confirmación', confirmNum],
        ['📍 Lugar', 'VALEA Aesthetics — Alajuela, CR'],
      ].map(([label, value]) => `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #f0ede8;background:#faf9f6;width:42%;">
          <span style="font-size:12px;color:#929471;text-transform:uppercase;letter-spacing:1px;">${label}</span>
        </td>
        <td style="padding:10px 16px;border-bottom:1px solid #f0ede8;">
          <span style="font-size:13px;color:#1C4BA7;font-weight:500;">${value}</span>
        </td>
      </tr>`).join('')}
    </table>
  </td></tr>
  <tr><td style="padding:0 40px 32px;text-align:center;">
    <p style="margin:0;color:#8B6D53;font-size:13px;line-height:1.7;">
      Recuerda llegar <strong>10 minutos antes</strong>. Para cancelar o reagendar:<br/>
      <a href="tel:+50670278704" style="color:#1C4BA7;text-decoration:none;">📞 7027-8704</a>
      &nbsp;·&nbsp;
      <a href="mailto:info@valeacr.com" style="color:#1C4BA7;text-decoration:none;">📧 info@valeacr.com</a>
    </p>
  </td></tr>
  <tr><td style="background:#1C4BA7;padding:20px 40px;text-align:center;">
    <p style="margin:0;color:rgba(250,249,246,0.7);font-size:12px;">${doctorName} · ${clinicName}</p>
    <p style="margin:4px 0 0;color:rgba(250,249,246,0.4);font-size:11px;letter-spacing:1px;">Alajuela, Costa Rica</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `${clinicName} <${fromEmail}>`,
      to: [appt.email],
      subject: `🔔 Recordatorio: tu cita mañana en ${clinicName}`,
      html,
    }),
  })

  if (!res.ok) console.error('[Resend] Error reminder email:', res.status, await res.text())
  else console.log('[Resend] Reminder enviado a:', appt.email)
}

async function sendReminderWhatsApp(appt: AppointmentRecord): Promise<void> {
  const phone = normalizePhone(appt.phone)
  if (!phone) return

  const fecha = formatDate(appt.appointment_date)
  const hora = formatTime(appt.appointment_time)
  const firstName = appt.patient_name.split(' ')[0]

  const message = [
    `🔔 *Recordatorio de Cita — VALEA Aesthetics*`,
    ``,
    `Hola ${firstName}, te recordamos que *mañana* tienes cita con nosotros.`,
    ``,
    `📅 *Fecha:* ${fecha}`,
    `⏰ *Hora:* ${hora}`,
    `💉 *Servicio:* ${appt.service}`,
    ``,
    `Recuerda llegar 10 minutos antes.`,
    `Para cancelar: 📞 7027-8704`,
    `📍 VALEA Aesthetics — Alajuela, Costa Rica`,
  ].join('\n')

  await sendTwilioWhatsApp(phone, message)
}

// ─── Handler ───────────────────────────────────────────────────────────────────

serve(async (_req: Request) => {
  const tomorrowStr = getTomorrowCR()
  console.log(`[reminders] Buscando citas confirmadas para ${tomorrowStr}`)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('appointment_date', tomorrowStr)
    .eq('status', 'confirmed')

  if (error) {
    console.error('[reminders] Error consultando citas:', error)
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 })
  }

  if (!appointments || appointments.length === 0) {
    console.log(`[reminders] Sin citas para ${tomorrowStr}`)
    return new Response(JSON.stringify({ ok: true, sent: 0, date: tomorrowStr }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  console.log(`[reminders] Enviando ${appointments.length} recordatorio(s)`)

  await Promise.all(
    appointments.map((appt: AppointmentRecord) =>
      Promise.allSettled([
        sendReminderEmail(appt),
        sendReminderWhatsApp(appt),
      ])
    )
  )

  return new Response(
    JSON.stringify({ ok: true, sent: appointments.length, date: tomorrowStr }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
