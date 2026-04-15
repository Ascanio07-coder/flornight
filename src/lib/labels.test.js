import { describe, it, expect } from 'vitest'
import { getRuoloLabel, getNomeLocale } from './labels.js'

describe('getRuoloLabel', () => {
  it('maps the known staff roles to Italian labels', () => {
    expect(getRuoloLabel('admin')).toBe('Admin')
    expect(getRuoloLabel('proprietario')).toBe('Proprietario')
    expect(getRuoloLabel('organizzatore')).toBe('Organizzatore')
  })

  it('returns the raw value for unknown roles (fallback)', () => {
    expect(getRuoloLabel('bouncer')).toBe('bouncer')
    expect(getRuoloLabel('')).toBe('')
  })

  it('returns undefined when given undefined', () => {
    expect(getRuoloLabel(undefined)).toBeUndefined()
  })
})

describe('getNomeLocale', () => {
  const locali = [
    { id: 1, nome: 'Bar Centrale' },
    { id: 2, nome: 'Caffe Oltrarno' },
  ]

  it('returns the venue name when found', () => {
    expect(getNomeLocale(locali, 1)).toBe('Bar Centrale')
    expect(getNomeLocale(locali, 2)).toBe('Caffe Oltrarno')
  })

  it('returns "Sconosciuto" when the id is missing', () => {
    expect(getNomeLocale(locali, 99)).toBe('Sconosciuto')
  })

  it('returns "Sconosciuto" for empty or invalid inputs', () => {
    expect(getNomeLocale([], 1)).toBe('Sconosciuto')
    expect(getNomeLocale(null, 1)).toBe('Sconosciuto')
    expect(getNomeLocale(undefined, 1)).toBe('Sconosciuto')
  })
})
