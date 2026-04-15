// Pure date/filter helpers extracted from App.jsx so they can be tested
// without rendering the component. Every function accepts an injectable
// `now` to make testing deterministic.

export const GIORNI_MAPPA = [
  'Domenica',
  'Lunedi',
  'Martedi',
  'Mercoledi',
  'Giovedi',
  'Venerdi',
  'Sabato',
]

// A night that starts at 22:00 is still "tonight" at 01:30 the next day.
// The app treats any hour before this cutoff as belonging to the previous
// calendar day.
export const EARLY_MORNING_CUTOFF_HOUR = 6

export function getGiornoOggi(now = new Date()) {
  const ora = now.getHours()
  let giorno = now.getDay()
  if (ora < EARLY_MORNING_CUTOFF_HOUR) {
    giorno = giorno - 1
    if (giorno < 0) giorno = 6
  }
  return GIORNI_MAPPA[giorno]
}

export function getOggiData(now = new Date()) {
  const d = new Date(now.getTime())
  if (d.getHours() < EARLY_MORNING_CUTOFF_HOUR) {
    d.setDate(d.getDate() - 1)
  }
  const anno = d.getFullYear()
  const mese = String(d.getMonth() + 1).padStart(2, '0')
  const giorno = String(d.getDate()).padStart(2, '0')
  return `${anno}-${mese}-${giorno}`
}

export function eventoValido(evento, now = new Date()) {
  if (!evento || !evento.data_evento) return true
  return evento.data_evento >= getOggiData(now)
}

export function eventoStasera(evento, now = new Date()) {
  if (!evento) return false
  if (!evento.data_evento) return evento.giorno === getGiornoOggi(now)
  return evento.data_evento === getOggiData(now)
}

export function localeApertoOra(locale, now = new Date()) {
  if (!locale || !Array.isArray(locale.eventi)) return false
  return locale.eventi.some(
    (e) => eventoValido(e, now) && eventoStasera(e, now),
  )
}

export function filterLocaliByFiltro(locali, filtro, now = new Date()) {
  if (filtro === 'week') return locali
  return locali.filter((l) => localeApertoOra(l, now))
}

export function getLocaliMenu(locali, filtro, now = new Date()) {
  const lista =
    filtro === 'night'
      ? locali.filter((l) => localeApertoOra(l, now))
      : locali
  return lista.slice().sort((a, b) => {
    if (a.nome < b.nome) return -1
    if (a.nome > b.nome) return 1
    return 0
  })
}

export function getEventiMenuLocale(locale, filtro, now = new Date()) {
  const validi = (locale.eventi || []).filter((e) => eventoValido(e, now))
  if (filtro === 'night') {
    return validi.filter((e) => eventoStasera(e, now))
  }
  return validi
}
