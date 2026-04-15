// Pure marker style helpers. The React component passes the current
// selection id and filter value explicitly so there is no hidden state.

export const COLOR_SELECTED_STROKE = '#ffffff'
export const COLOR_NIGHT = '#D4A843'
export const COLOR_DEFAULT = '#C43E51'

export const RADIUS_SELECTED = 9
export const RADIUS_DEFAULT = 7

export const WEIGHT_SELECTED = 2
export const WEIGHT_DEFAULT = 1.5

export const FILL_OPACITY = 0.9

function isSelected(locale, selezionatoId) {
  return selezionatoId != null && locale && locale.id === selezionatoId
}

export function getDotColor(locale, { selezionatoId, filtro } = {}) {
  if (isSelected(locale, selezionatoId)) return COLOR_SELECTED_STROKE
  if (filtro === 'night') return COLOR_NIGHT
  return COLOR_DEFAULT
}

export function getDotFill(filtro) {
  if (filtro === 'night') return COLOR_NIGHT
  return COLOR_DEFAULT
}

export function getDotRadius(locale, { selezionatoId } = {}) {
  return isSelected(locale, selezionatoId) ? RADIUS_SELECTED : RADIUS_DEFAULT
}

export function getDotWeight(locale, { selezionatoId } = {}) {
  return isSelected(locale, selezionatoId) ? WEIGHT_SELECTED : WEIGHT_DEFAULT
}

export function getDotOpacity() {
  return FILL_OPACITY
}
