// Pure label helpers extracted from Admin.jsx.

export function getRuoloLabel(ruolo) {
  if (ruolo === 'admin') return 'Admin'
  if (ruolo === 'proprietario') return 'Proprietario'
  if (ruolo === 'organizzatore') return 'Organizzatore'
  return ruolo
}

export function getNomeLocale(locali, localeId) {
  if (!Array.isArray(locali)) return 'Sconosciuto'
  const found = locali.find((l) => l.id === localeId)
  return found ? found.nome : 'Sconosciuto'
}
