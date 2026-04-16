// POST /api/webhook
// Riceve gli eventi di Stripe. Unico punto in cui is_paid puo' passare a true.
// Il QR viene generato SOLO qui, dopo conferma del pagamento, mai dal frontend.
//
// Sicurezza:
// - Il body DEVE essere letto raw per poter verificare la firma (stripe-signature).
//   Vercel / Next-like runtime: disabilitiamo il bodyParser.
// - STRIPE_WEBHOOK_SECRET e SUPABASE_SERVICE_ROLE_KEY non devono mai finire sul client.

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import QRCode from 'qrcode'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Client Supabase con service role: puo' scrivere bypassando RLS.
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
)

// Vercel: disattiviamo il parser di default cosi' riceviamo il body raw.
export const config = {
  api: {
    bodyParser: false,
  },
}

// Legge il body come Buffer grezzo (serve per la firma di Stripe).
async function readRawBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method not allowed')
  }

  const signature = req.headers['stripe-signature']
  let event

  try {
    const rawBody = await readRawBody(req)
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    // Firma invalida -> rifiutiamo. Non ci fidiamo mai di un body non verificato.
    console.error('[webhook] firma non valida:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const meta = session.metadata || {}

      // Paracadute: paga solo se Stripe dice paid.
      if (session.payment_status !== 'paid') {
        return res.status(200).json({ received: true, skipped: 'not paid' })
      }

      const bigliettoId = meta.bigliettoId
      const userId = meta.userId
      const codice = meta.codice
      if (!bigliettoId || !userId || !codice) {
        console.error('[webhook] metadata incompleti', meta)
        return res.status(200).json({ received: true, skipped: 'missing metadata' })
      }

      // Idempotenza: se questa session e' gia' stata processata, non rifacciamo.
      const existing = await supabaseAdmin
        .from('biglietti')
        .select('id, is_paid, stripe_session_id')
        .eq('id', bigliettoId)
        .single()

      if (existing.data && existing.data.is_paid && existing.data.stripe_session_id === session.id) {
        return res.status(200).json({ received: true, duplicate: true })
      }

      // QR generato SOLO ora, dopo conferma di Stripe.
      const payload = JSON.stringify({
        codice,
        utente: session.customer_details?.email || '',
        locale: meta.localeNome,
        evento: meta.eventoNome,
        giorno: meta.eventoGiorno,
        orario: meta.eventoOrario,
        prezzo: meta.prezzo,
      })
      const qrDataUrl = await QRCode.toDataURL(payload, { width: 200, margin: 2 })

      // Update: is_paid = true + QR + session id (per tracciabilita' e idempotenza).
      // Filtriamo anche per user_id per evitare che un bigliettoId manipolato
      // in metadata aggiorni il biglietto di un altro utente.
      const { error } = await supabaseAdmin
        .from('biglietti')
        .update({
          is_paid: true,
          qr_code: qrDataUrl,
          stripe_session_id: session.id,
        })
        .eq('id', bigliettoId)
        .eq('user_id', userId)

      if (error) {
        console.error('[webhook] update biglietto fallito', error)
        // 500 -> Stripe riprovera'.
        return res.status(500).json({ error: 'DB update failed' })
      }
    }

    return res.status(200).json({ received: true })
  } catch (err) {
    console.error('[webhook] errore gestione evento', err)
    return res.status(500).json({ error: 'Webhook handler error' })
  }
}
