// POST /api/create-checkout-session
// Crea una Stripe Checkout Session per il biglietto appena "prenotato"
// (inserito con is_paid=false dal frontend) e restituisce session.url,
// che il client usa per reindirizzare l'utente a Stripe.
//
// Il webhook (/api/webhook) conferma il pagamento e sblocca il QR.
// STRIPE_SECRET_KEY deve esistere SOLO lato server: non va mai esposta al frontend.

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// "15€", "15", "15,50 €" -> 1550 (centesimi)
function parsePrezzoToCents(prezzo) {
  if (prezzo == null) return 0
  const cleaned = String(prezzo).replace(/[^\d.,]/g, '').replace(',', '.')
  const euro = parseFloat(cleaned)
  if (!isFinite(euro) || euro <= 0) return 0
  return Math.round(euro * 100)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, bigliettoId, codice, evento, locale } = req.body || {}

    // Validazione minima dei campi richiesti.
    if (!userId || !bigliettoId || !codice || !evento || !locale) {
      return res.status(400).json({ error: 'Parametri mancanti' })
    }

    const unitAmount = parsePrezzoToCents(evento.prezzo)
    if (!unitAmount) {
      return res.status(400).json({ error: 'Prezzo evento non valido' })
    }

    // URL di ritorno: torna all'app dell'utente, con flag per UI.
    const origin =
      req.headers.origin ||
      (req.headers.host ? 'https://' + req.headers.host : '')

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${evento.nome} — ${locale.nome}`,
              description: [evento.giorno, evento.orario].filter(Boolean).join(' '),
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      // Metadata letti dal webhook per collegare il pagamento al biglietto.
      // NB: i valori metadata di Stripe devono essere stringhe.
      metadata: {
        userId: String(userId),
        bigliettoId: String(bigliettoId),
        codice: String(codice),
        eventoId: String(evento.id ?? ''),
        localeId: String(locale.id ?? ''),
        eventoNome: String(evento.nome ?? ''),
        localeNome: String(locale.nome ?? ''),
        eventoGiorno: String(evento.giorno ?? ''),
        eventoOrario: String(evento.orario ?? ''),
        prezzo: String(evento.prezzo ?? ''),
      },
      success_url: `${origin}/?ticket=success&codice=${encodeURIComponent(codice)}`,
      cancel_url: `${origin}/?ticket=cancel&codice=${encodeURIComponent(codice)}`,
    })

    return res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('[create-checkout-session]', err)
    return res.status(500).json({ error: 'Errore creazione sessione Stripe' })
  }
}
