-- Stripe Checkout: gate QR generation on confirmed payment.
-- is_paid flips to true only from the Stripe webhook (server-side).
-- qr_code stores the QR data URL generated server-side after payment.
-- stripe_session_id lets the webhook be idempotent (Stripe can retry).

alter table biglietti
  add column if not exists is_paid boolean not null default false,
  add column if not exists qr_code text,
  add column if not exists stripe_session_id text;

create index if not exists biglietti_stripe_session_id_idx
  on biglietti (stripe_session_id);
