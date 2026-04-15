// Pure form validators. Supabase enforces most of this on the server, but
// running validation client-side saves a round trip and lets us surface
// friendly Italian error messages identical to the existing UI.

export const MIN_PASSWORD_LENGTH = 6

export function isValidPassword(pass) {
  return typeof pass === 'string' && pass.length >= MIN_PASSWORD_LENGTH
}

// Matches the user-facing error messages produced by Utente.jsx:registrati
// so we can drop-in replace the inline validation.
export function validateSignupForm({ email, pass, nome }) {
  if (!email || !pass || !nome) return 'Compila tutti i campi'
  if (!isValidPassword(pass)) {
    return 'La password deve avere almeno 6 caratteri'
  }
  return null
}

// Validate the lat/lng inputs used when creating a venue in Admin.jsx.
// The current code just passes parseFloat() results directly to Supabase
// without range or NaN checks.
export function validateLatLng(lat, lng) {
  const latN = typeof lat === 'number' ? lat : parseFloat(lat)
  const lngN = typeof lng === 'number' ? lng : parseFloat(lng)
  if (Number.isNaN(latN) || Number.isNaN(lngN)) {
    return 'Coordinate non valide'
  }
  if (latN < -90 || latN > 90) return 'Latitudine fuori range'
  if (lngN < -180 || lngN > 180) return 'Longitudine fuori range'
  return null
}
