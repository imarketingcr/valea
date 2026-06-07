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
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  cancelled_by?: 'client' | 'clinic'
  outlook_event_id?: string
  confirmation_number?: string
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: AppointmentRecord
  old_record?: AppointmentRecord
  schema: string
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

function normalizeTime(timeStr: string): string {
  return timeStr.substring(0, 5)
}

/** Normalizes a Costa Rica phone number to E.164 (+506XXXXXXXX) */
function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('506') && digits.length === 11) return `+${digits}`
  if (digits.length === 8) return `+506${digits}`
  if (phone.startsWith('+') && digits.length >= 10) return `+${digits}`
  return null
}

// ─── Twilio WhatsApp ───────────────────────────────────────────────────────────

async function sendTwilioWhatsApp(to: string, body: string): Promise<void> {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
  const from = Deno.env.get('TWILIO_WHATSAPP_FROM')

  if (!accountSid || !authToken || !from) {
    console.log('[Twilio] Variables no configuradas — omitiendo WhatsApp')
    return
  }

  try {
    const cleanFrom = from.replace(/^whatsapp:/i, '')
    const cleanTo = to.replace(/^whatsapp:/i, '')
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
          From: `whatsapp:${cleanFrom}`,
          To: `whatsapp:${cleanTo}`,
          Body: body,
        }),
      }
    )
    if (!res.ok) console.error('[Twilio] Error:', res.status, await res.text())
    else console.log('[Twilio] Mensaje enviado a', to)
  } catch (err) {
    console.error('[Twilio] Error inesperado:', err)
  }
}

// ─── Microsoft Outlook Calendar ────────────────────────────────────────────────

async function getMicrosoftAccessToken(): Promise<string | null> {
  const tenantId = Deno.env.get('AZURE_TENANT_ID')
  const clientId = Deno.env.get('AZURE_CLIENT_ID')
  const clientSecret = Deno.env.get('AZURE_CLIENT_SECRET')

  if (!tenantId || !clientId || !clientSecret) {
    console.log('[Outlook] Variables Azure no configuradas — omitiendo calendario')
    return null
  }

  try {
    const res = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
          scope: 'https://graph.microsoft.com/.default',
        }),
      }
    )
    if (!res.ok) {
      console.error('[Outlook] Error obteniendo token:', await res.text())
      return null
    }
    const data = await res.json()
    return data.access_token as string
  } catch (err) {
    console.error('[Outlook] Error en autenticación:', err)
    return null
  }
}

async function createOutlookCalendarEvent(appt: AppointmentRecord): Promise<void> {
  const userEmail = Deno.env.get('OUTLOOK_CALENDAR_USER_EMAIL')
  if (!userEmail) return

  const accessToken = await getMicrosoftAccessToken()
  if (!accessToken) return

  try {
    const time = normalizeTime(appt.appointment_time)
    const [h, m] = time.split(':').map(Number)
    const endH = String(h + 1).padStart(2, '0')
    const endTime = `${endH}:${String(m).padStart(2, '0')}`

    const event = {
      subject: `VALEA | ${appt.patient_name} — ${appt.service}`,
      body: {
        contentType: 'text',
        content: [
          `Paciente: ${appt.patient_name}`,
          `Teléfono: ${appt.phone}`,
          `Email: ${appt.email}`,
          `Servicio: ${appt.service}`,
          appt.notes ? `Notas: ${appt.notes}` : '',
          `Ref: #${appt.confirmation_number ?? '—'}`,
        ].filter(Boolean).join('\n'),
      },
      start: {
        dateTime: `${appt.appointment_date}T${time}:00`,
        timeZone: 'America/Costa_Rica',
      },
      end: {
        dateTime: `${appt.appointment_date}T${endTime}:00`,
        timeZone: 'America/Costa_Rica',
      },
      location: { displayName: 'VALEA Aesthetics, Alajuela, Costa Rica' },
    }

    const res = await fetch(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userEmail)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    )

    if (!res.ok) {
      console.error('[Outlook] Error al crear evento:', res.status, await res.text())
    } else {
      const data = await res.json()
      console.log('[Outlook] Evento creado:', data.id)
      // Persist event ID so we can delete it later on cancellation
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      )
      const { error: dbErr } = await supabase
        .from('appointments')
        .update({ outlook_event_id: data.id })
        .eq('id', appt.id)
      if (dbErr) console.error('[Outlook] Error guardando event ID:', dbErr.message)
    }
  } catch (err) {
    console.error('[Outlook] Error inesperado:', err)
  }
}

async function deleteOutlookCalendarEvent(eventId: string): Promise<void> {
  const userEmail = Deno.env.get('OUTLOOK_CALENDAR_USER_EMAIL')
  if (!userEmail) return

  const accessToken = await getMicrosoftAccessToken()
  if (!accessToken) return

  try {
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userEmail)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )
    if (res.status === 204 || res.status === 404) {
      console.log('[Outlook] Evento eliminado:', eventId)
    } else {
      console.error('[Outlook] Error eliminando evento:', res.status, await res.text())
    }
  } catch (err) {
    console.error('[Outlook] Error inesperado al eliminar:', err)
  }
}

// ─── Emails ────────────────────────────────────────────────────────────────────

function emailWrapper(content: string, clinicName: string, doctorName: string): string {
  return `<!DOCTYPE html>
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
  ${content}
  <tr><td style="background:#1C4BA7;padding:20px 40px;text-align:center;">
    <p style="margin:0;color:rgba(250,249,246,0.7);font-size:12px;">${doctorName} · ${clinicName}</p>
    <p style="margin:4px 0 0;color:rgba(250,249,246,0.4);font-size:11px;letter-spacing:1px;">Alajuela, Costa Rica</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`
}

function detailRows(rows: [string, string][]): string {
  return rows.map(([label, value]) => `
  <tr>
    <td style="padding:10px 16px;border-bottom:1px solid #f0ede8;background:#faf9f6;width:42%;">
      <span style="font-size:12px;color:#929471;text-transform:uppercase;letter-spacing:1px;">${label}</span>
    </td>
    <td style="padding:10px 16px;border-bottom:1px solid #f0ede8;">
      <span style="font-size:13px;color:#1C4BA7;font-weight:500;">${value}</span>
    </td>
  </tr>`).join('')
}

async function sendClientEmail(appt: AppointmentRecord): Promise<void> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  const fromEmail = Deno.env.get('FROM_EMAIL') ?? 'notificaciones@valeacr.com'
  const clinicName = Deno.env.get('CLINIC_NAME') ?? 'VALEA Aesthetics'
  const doctorName = Deno.env.get('DOCTOR_NAME') ?? 'Dra. Carolina Castillo Rodas'

  if (!apiKey || !appt.email) return

  const fecha = formatDate(appt.appointment_date)
  const hora = formatTime(appt.appointment_time)
  const firstName = appt.patient_name.split(' ')[0]
  const confirmNum = appt.confirmation_number ?? '—'
  const isConfirmed = appt.status === 'confirmed'
  const statusLabel = isConfirmed ? 'Confirmada ✅' : 'Pendiente de confirmación ⏳'

  const pendingBanner = isConfirmed ? '' : `
  <tr><td style="padding:16px 40px 0;">
    <p style="margin:0;background:#FFF8E1;border-left:3px solid #FFC107;padding:12px 16px;color:#7B5B2A;font-size:13px;line-height:1.6;">
      Tu solicitud está <strong>pendiente de confirmación</strong>. La doctora la revisará y recibirás una notificación cuando sea aprobada.
    </p>
  </td></tr>`

  const content = `
  <tr><td style="padding:36px 40px 0;text-align:center;">
    <span style="font-size:44px;">${isConfirmed ? '✅' : '📋'}</span>
    <h1 style="margin:16px 0 0;color:#1C4BA7;font-family:Georgia,serif;font-size:24px;font-weight:300;letter-spacing:2px;">
      ${isConfirmed ? '¡Cita Confirmada!' : 'Solicitud Recibida'}
    </h1>
    <p style="margin:10px 0 0;color:#8B6D53;font-size:14px;line-height:1.6;">
      Hola <strong>${firstName}</strong>, ${isConfirmed
        ? 'tu cita ha sido confirmada.'
        : 'hemos recibido tu solicitud de cita.'}
    </p>
  </td></tr>
  ${pendingBanner}
  <tr><td style="padding:24px 40px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #D1BAA6;border-collapse:collapse;">
      ${detailRows([
        ['🔖 Confirmación', confirmNum],
        ['💉 Servicio', appt.service],
        ['📅 Fecha', fecha],
        ['⏰ Hora', hora],
        ['📍 Lugar', 'VALEA Aesthetics — Alajuela, CR'],
        ['📋 Estado', statusLabel],
      ])}
    </table>
  </td></tr>
  <tr><td style="padding:0 40px 32px;text-align:center;">
    <p style="margin:0;color:#8B6D53;font-size:13px;line-height:1.7;">
      Recuerda llegar <strong>10 minutos antes</strong>. Para cancelar o reagendar:<br/>
      <a href="tel:+50670278704" style="color:#1C4BA7;text-decoration:none;">📞 7027-8704</a>
      &nbsp;·&nbsp;
      <a href="mailto:info@valeacr.com" style="color:#1C4BA7;text-decoration:none;">📧 info@valeacr.com</a>
    </p>
    ${isConfirmed ? `
    <p style="margin:20px 0 0;">
      <a href="https://valeacr.com/cancelar?id=${appt.id}"
         style="font-family:'Open Sans',Helvetica,Arial,sans-serif;font-size:11px;color:#929471;text-decoration:underline;">
        ¿Necesitas cancelar? Haz clic aquí
      </a>
    </p>` : ''}
  </td></tr>`

  const html = emailWrapper(content, clinicName, doctorName)

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `${clinicName} <${fromEmail}>`,
      to: [appt.email],
      subject: isConfirmed
        ? `✅ Cita confirmada — ${clinicName} (${fecha})`
        : `📋 Solicitud recibida — ${clinicName}`,
      html,
    }),
  })

  if (!res.ok) console.error('[Resend] Error email cliente:', res.status, await res.text())
  else console.log('[Resend] Email enviado al cliente:', appt.email)
}

async function sendDoctorEmail(appt: AppointmentRecord): Promise<void> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  const fromEmail = Deno.env.get('FROM_EMAIL') ?? 'notificaciones@valeacr.com'
  const clinicName = Deno.env.get('CLINIC_NAME') ?? 'VALEA Aesthetics'
  const doctorName = Deno.env.get('DOCTOR_NAME') ?? 'Dra. Carolina Castillo Rodas'
  const doctorEmail = Deno.env.get('DOCTOR_EMAIL')

  if (!apiKey || !doctorEmail) return

  const fecha = formatDate(appt.appointment_date)
  const hora = formatTime(appt.appointment_time)
  const confirmNum = appt.confirmation_number ?? '—'

  const rows: [string, string][] = [
    ['👤 Paciente', appt.patient_name],
    ['📞 Teléfono', appt.phone],
    ['📧 Email', appt.email],
    ['💉 Servicio', appt.service],
    ['📅 Fecha', fecha],
    ['⏰ Hora', hora],
    ['🔖 Ref', `#${confirmNum}`],
  ]
  if (appt.notes) rows.push(['📝 Notas', appt.notes])

  const content = `
  <tr><td style="padding:32px 40px 0;">
    <h2 style="margin:0;color:#1C4BA7;font-family:Georgia,serif;font-size:22px;font-weight:300;">
      🔔 Nueva solicitud de cita
    </h2>
    <p style="margin:12px 0 0;color:#8B6D53;font-size:14px;line-height:1.6;">
      ${doctorName}, se recibió una nueva solicitud desde el sitio web que requiere tu aprobación.
    </p>
  </td></tr>
  <tr><td style="padding:20px 40px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #D1BAA6;border-collapse:collapse;">
      ${detailRows(rows)}
    </table>
  </td></tr>
  <tr><td style="padding:0 40px 32px;text-align:center;">
    <a href="https://valeacr.com/dashboard/appointments"
       style="display:inline-block;background:#1C4BA7;color:#FAF9F6;font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:14px 28px;text-decoration:none;">
      Aprobar en el Dashboard →
    </a>
  </td></tr>`

  const html = emailWrapper(content, clinicName, doctorName)

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `${clinicName} <${fromEmail}>`,
      to: [doctorEmail],
      subject: `🔔 Nueva cita — ${appt.patient_name} (${fecha} ${hora})`,
      html,
    }),
  })

  if (!res.ok) console.error('[Resend] Error email doctora:', res.status, await res.text())
  else console.log('[Resend] Email enviado a la doctora:', doctorEmail)
}

// ─── WhatsApp ──────────────────────────────────────────────────────────────────

async function sendClientWhatsApp(appt: AppointmentRecord): Promise<void> {
  const phone = normalizePhone(appt.phone)
  if (!phone) {
    console.log('[Twilio] Número de cliente no normalizable:', appt.phone)
    return
  }

  const fecha = formatDate(appt.appointment_date)
  const hora = formatTime(appt.appointment_time)
  const firstName = appt.patient_name.split(' ')[0]
  const isConfirmed = appt.status === 'confirmed'
  const ref = appt.confirmation_number ?? '—'

  const message = isConfirmed
    ? [
        `✅ *¡Cita Confirmada — VALEA Aesthetics!*`,
        ``,
        `Hola ${firstName}, tu cita ha sido confirmada.`,
        ``,
        `📅 *Fecha:* ${fecha}`,
        `⏰ *Hora:* ${hora}`,
        `💉 *Servicio:* ${appt.service}`,
        `🔖 *Ref:* #${ref}`,
        ``,
        `Recuerda llegar 10 minutos antes. ¡Te esperamos!`,
        `📍 VALEA Aesthetics — Alajuela, Costa Rica`,
        ``,
        `¿Necesitas cancelar? https://valeacr.com/cancelar?id=${appt.id}`,
      ].join('\n')
    : [
        `📋 *Solicitud Recibida — VALEA Aesthetics*`,
        ``,
        `Hola ${firstName}, hemos recibido tu solicitud de cita.`,
        ``,
        `📅 *Fecha solicitada:* ${fecha}`,
        `⏰ *Hora:* ${hora}`,
        `💉 *Servicio:* ${appt.service}`,
        `🔖 *Ref:* #${ref}`,
        ``,
        `Tu cita está *pendiente de confirmación*. Te avisaremos cuando sea aprobada.`,
        ``,
        `Consultas: 📞 7027-8704`,
      ].join('\n')

  await sendTwilioWhatsApp(phone, message)
}

async function sendDoctorWhatsApp(appt: AppointmentRecord): Promise<void> {
  const doctorPhone = Deno.env.get('DOCTOR_WHATSAPP_TO')
  if (!doctorPhone) return

  const fecha = formatDate(appt.appointment_date)
  const hora = formatTime(appt.appointment_time)

  const message = [
    `🏥 *Nueva Cita VALEA — Requiere Aprobación*`,
    ``,
    `👤 *Paciente:* ${appt.patient_name}`,
    `📅 *Fecha:* ${fecha}`,
    `⏰ *Hora:* ${hora}`,
    `💉 *Servicio:* ${appt.service}`,
    `📞 *Tel:* ${appt.phone}`,
    `📧 ${appt.email}`,
    `🔖 *Ref:* #${appt.confirmation_number ?? '—'}`,
    ``,
    `_Ingresa al dashboard para aprobar o rechazar._`,
  ].join('\n')

  await sendTwilioWhatsApp(doctorPhone, message)
}

// ─── Cancellation notifications ────────────────────────────────────────────────

async function sendCancellationEmailToClient(appt: AppointmentRecord): Promise<void> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  const fromEmail = Deno.env.get('FROM_EMAIL') ?? 'notificaciones@valeacr.com'
  const clinicName = Deno.env.get('CLINIC_NAME') ?? 'VALEA Aesthetics'
  const doctorName = Deno.env.get('DOCTOR_NAME') ?? 'Dra. Carolina Castillo Rodas'

  if (!apiKey || !appt.email) return

  const fecha = formatDate(appt.appointment_date)
  const hora = formatTime(appt.appointment_time)
  const firstName = appt.patient_name.split(' ')[0]

  const content = `
  <tr><td style="padding:36px 40px 0;text-align:center;">
    <span style="font-size:44px;">😔</span>
    <h1 style="margin:16px 0 0;color:#1C4BA7;font-family:Georgia,serif;font-size:24px;font-weight:300;letter-spacing:2px;">
      Cita Cancelada
    </h1>
    <p style="margin:10px 0 0;color:#8B6D53;font-size:14px;line-height:1.6;">
      Hola <strong>${firstName}</strong>, lamentamos informarte que tuvimos que cancelar tu cita.
    </p>
  </td></tr>
  <tr><td style="padding:20px 40px;">
    <div style="background:#FFF8E1;border-left:3px solid #FFC107;padding:14px 18px;">
      <p style="margin:0;color:#7B5B2A;font-size:13px;line-height:1.7;">
        Entendemos que esto puede ser un inconveniente y pedimos disculpas. Surgió un imprevisto
        que nos obliga a cancelar la cita del <strong>${fecha} a las ${hora}</strong>.
      </p>
    </div>
  </td></tr>
  <tr><td style="padding:0 40px 12px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #D1BAA6;border-collapse:collapse;">
      ${detailRows([
        ['💉 Servicio', appt.service],
        ['📅 Fecha', fecha],
        ['⏰ Hora', hora],
        ['🔖 Ref', `#${appt.confirmation_number ?? '—'}`],
      ])}
    </table>
  </td></tr>
  <tr><td style="padding:20px 40px 32px;text-align:center;">
    <p style="margin:0 0 20px;color:#8B6D53;font-size:13px;line-height:1.6;">
      Te invitamos a reagendar tu cita. Tenemos disponibilidad próxima y nos encantaría atenderte.
    </p>
    <a href="https://valeacr.com/#booking"
       style="display:inline-block;background:#1C4BA7;color:#FAF9F6;font-family:'Open Sans',Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:14px 28px;text-decoration:none;">
      Reagendar mi cita →
    </a>
    <p style="margin:20px 0 0;color:#8B6D53;font-size:12px;">
      O contáctanos: <a href="tel:+50670278704" style="color:#1C4BA7;text-decoration:none;">📞 7027-8704</a>
    </p>
  </td></tr>`

  const html = emailWrapper(content, clinicName, doctorName)

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `${clinicName} <${fromEmail}>`,
      to: [appt.email],
      subject: `Cita cancelada — ${clinicName} (${fecha})`,
      html,
    }),
  })

  if (!res.ok) console.error('[Resend] Error email cancelación cliente:', res.status, await res.text())
  else console.log('[Resend] Email cancelación enviado al cliente:', appt.email)
}

async function sendCancellationWhatsAppToClient(appt: AppointmentRecord): Promise<void> {
  const phone = normalizePhone(appt.phone)
  if (!phone) return

  const fecha = formatDate(appt.appointment_date)
  const hora = formatTime(appt.appointment_time)
  const firstName = appt.patient_name.split(' ')[0]

  const message = [
    `😔 *VALEA Aesthetics — Cita Cancelada*`,
    ``,
    `Hola ${firstName}, lamentamos informarte que tuvimos que cancelar tu cita del *${fecha} a las ${hora}*.`,
    ``,
    `Pedimos disculpas por el inconveniente. Te invitamos a reagendar a la fecha más cercana.`,
    ``,
    `📅 *Reagendar:* https://valeacr.com/#booking`,
    `📞 *Tel:* 7027-8704`,
  ].join('\n')

  await sendTwilioWhatsApp(phone, message)
}

// ─── Handler ───────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  let payload: WebhookPayload
  try {
    payload = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  if (payload.table !== 'appointments') {
    return new Response('OK — evento ignorado', { status: 200 })
  }

  const appt = payload.record
  const tasks: Promise<void>[] = []

  if (payload.type === 'INSERT') {
    console.log(`[notify] INSERT — ${appt.confirmation_number} — ${appt.patient_name} (${appt.status})`)

    // Email + WhatsApp al cliente siempre
    tasks.push(
      sendClientEmail(appt).catch(e => console.error('[notify] Error email cliente:', e)),
      sendClientWhatsApp(appt).catch(e => console.error('[notify] Error WhatsApp cliente:', e)),
    )

    if (appt.status === 'pending') {
      // Formulario público: notificar a la doctora
      tasks.push(
        sendDoctorEmail(appt).catch(e => console.error('[notify] Error email doctora:', e)),
        sendDoctorWhatsApp(appt).catch(e => console.error('[notify] Error WhatsApp doctora:', e)),
      )
    } else if (appt.status === 'confirmed') {
      // Dashboard: la doctora agendó directamente → crear evento en Outlook
      tasks.push(
        createOutlookCalendarEvent(appt).catch(e => console.error('[notify] Error Outlook:', e)),
      )
    }

  } else if (
    payload.type === 'UPDATE' &&
    payload.old_record?.status !== 'confirmed' &&
    appt.status === 'confirmed'
  ) {
    // Doctora aprobó la cita
    console.log(`[notify] UPDATE confirmed — ${appt.confirmation_number} — ${appt.patient_name}`)

    tasks.push(
      sendClientEmail(appt).catch(e => console.error('[notify] Error email confirmación:', e)),
      sendClientWhatsApp(appt).catch(e => console.error('[notify] Error WhatsApp confirmación:', e)),
      createOutlookCalendarEvent(appt).catch(e => console.error('[notify] Error Outlook confirmación:', e)),
    )

  } else if (
    payload.type === 'UPDATE' &&
    payload.old_record?.status !== 'cancelled' &&
    appt.status === 'cancelled'
  ) {
    console.log(`[notify] UPDATE cancelled (by ${appt.cancelled_by ?? 'unknown'}) — ${appt.confirmation_number} — ${appt.patient_name}`)

    // Remove calendar event regardless of who cancelled
    if (appt.outlook_event_id) {
      tasks.push(
        deleteOutlookCalendarEvent(appt.outlook_event_id).catch(e => console.error('[notify] Error eliminando Outlook:', e)),
      )
    }

    // Only send client notification when the clinic cancelled
    if (appt.cancelled_by === 'clinic') {
      tasks.push(
        sendCancellationEmailToClient(appt).catch(e => console.error('[notify] Error email cancelación:', e)),
        sendCancellationWhatsAppToClient(appt).catch(e => console.error('[notify] Error WhatsApp cancelación:', e)),
      )
    }

  } else {
    return new Response('OK — evento ignorado', { status: 200 })
  }

  await Promise.all(tasks)

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
