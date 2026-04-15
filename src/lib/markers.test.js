import { describe, it, expect } from 'vitest'
import {
  COLOR_SELECTED_STROKE,
  COLOR_NIGHT,
  COLOR_DEFAULT,
  RADIUS_SELECTED,
  RADIUS_DEFAULT,
  WEIGHT_SELECTED,
  WEIGHT_DEFAULT,
  FILL_OPACITY,
  getDotColor,
  getDotFill,
  getDotRadius,
  getDotWeight,
  getDotOpacity,
} from './markers.js'

const locale = { id: 1 }
const other = { id: 2 }

describe('getDotColor', () => {
  it('highlights the selected venue in white', () => {
    expect(
      getDotColor(locale, { selezionatoId: 1, filtro: 'week' }),
    ).toBe(COLOR_SELECTED_STROKE)
  })

  it('uses the night gold when filter is "night" and not selected', () => {
    expect(
      getDotColor(locale, { selezionatoId: null, filtro: 'night' }),
    ).toBe(COLOR_NIGHT)
  })

  it('uses the default red in week mode', () => {
    expect(
      getDotColor(locale, { selezionatoId: null, filtro: 'week' }),
    ).toBe(COLOR_DEFAULT)
  })

  it('does not highlight a different venue', () => {
    expect(
      getDotColor(locale, { selezionatoId: 2, filtro: 'week' }),
    ).toBe(COLOR_DEFAULT)
  })
})

describe('getDotFill', () => {
  it('uses night gold when filter is night', () => {
    expect(getDotFill('night')).toBe(COLOR_NIGHT)
  })

  it('defaults to red otherwise', () => {
    expect(getDotFill('week')).toBe(COLOR_DEFAULT)
    expect(getDotFill(undefined)).toBe(COLOR_DEFAULT)
  })
})

describe('getDotRadius', () => {
  it('grows the dot when selected', () => {
    expect(getDotRadius(locale, { selezionatoId: 1 })).toBe(RADIUS_SELECTED)
  })

  it('returns the default radius otherwise', () => {
    expect(getDotRadius(locale, { selezionatoId: null })).toBe(RADIUS_DEFAULT)
    expect(getDotRadius(other, { selezionatoId: 1 })).toBe(RADIUS_DEFAULT)
  })
})

describe('getDotWeight', () => {
  it('thickens the stroke when selected', () => {
    expect(getDotWeight(locale, { selezionatoId: 1 })).toBe(WEIGHT_SELECTED)
  })

  it('uses the default weight otherwise', () => {
    expect(getDotWeight(locale, { selezionatoId: null })).toBe(WEIGHT_DEFAULT)
  })
})

describe('getDotOpacity', () => {
  it('is a stable constant', () => {
    expect(getDotOpacity()).toBe(FILL_OPACITY)
    expect(FILL_OPACITY).toBe(0.9)
  })
})
