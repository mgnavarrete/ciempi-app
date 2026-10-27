import nodemailer from 'nodemailer'

/**
 * Envío de correos (solo "recuperar contraseña"). Se configura con variables
 * de entorno SMTP_*; sin ellas, el enlace queda en el registro del servidor
 * (journalctl -u ciempi-api) y la contraseña también se puede cambiar con
 * `npm run cuenta -- clave <correo> <nueva>`.
 */

const URL_APP = process.env.APP_URL ?? 'http://localhost:5173'

const transporte = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    })
  : null

export async function enviarRecuperacion(correo: string, token: string, log: (m: string) => void): Promise<void> {
  const enlace = `${URL_APP}/?recuperar=${encodeURIComponent(token)}`
  if (!transporte) {
    log(`Sin SMTP configurado. Enlace de recuperación para ${correo}: ${enlace}`)
    return
  }
  await transporte.sendMail({
    from: process.env.SMTP_FROM ?? 'Ciempi <no-responder@ciempi.app>',
    to: correo,
    subject: 'Crea tu contraseña nueva de Ciempi',
    text: `Hola. Para crear una contraseña nueva para Ciempi abre este enlace (vale por 1 hora):\n\n${enlace}\n\nSi no fuiste tú, ignora este correo: tu contraseña no cambia.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#2d3b52">
  <h2 style="color:#247586">Recupera tu contraseña de Ciempi</h2>
  <p>Hola. Recibimos una solicitud para crear una contraseña nueva para tu cuenta de Ciempi.</p>
  <p><a href="${enlace}" style="display:inline-block;background:#247586;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:bold">Crear contraseña nueva</a></p>
  <p style="color:#5d6b80;font-size:14px">El enlace vale por 1 hora. Si no fuiste tú, ignora este correo: tu contraseña no cambia.</p>
</div>`,
  })
}
