import { describe, it, expect } from 'vitest'
import {
  GIORNI_MAPPA,
  EARLY_MORNING_CUTOFF_HOUR,
  getGiornoOggi,
  getOggiData,
  eventoValido,
  eventoStasera,
  localeApertoOra,
  filterLocaliByFiltro,
  getLocaliMenu,
  getEventiMenuLocale,
} from './dateFilters.js'

// Helpers for building Date fixtures that don't depend on host timezone edge
// cases. We construct times with explicit local components.
function at(y, m, d, h, min = 0) {
  return new Date(y, m - 1, d, h, min, 0, 0)
}

describe('getGiornoOggi', () => {
  it('returns the current day after the 6am cutoff', () => {
    // Wednesday 2026-04-15 at 14:00
    expect(getGiornoOggi(at(2026, 4, 15, 14))).toBe('Mercoledi')
  })

  it('treats pre-6am hours as the previous day', () => {
    // Wednesday 2026-04-15 at 02:30 still counts as Tuesday night
    expect(getGiornoOggi(at(2026, 4, 15, 2, 30))).toBe('Martedi')
  })

  it('wraps Sunday 05:00 back to Saturday', () => {
    // Sunday 2026-04-19 at 05:00 -> Saturday
    expect(getGiornoOggi(at(2026, 4, 19, 5))).toBe('Sabato')
  })

  it('returns Domenica at 06:00 sharp on Sunday', () => {
    expect(getGiornoOggi(at(2026, 4, 19, 6))).toBe('Domenica')
  })

  it('GIORNI_MAPPA matches JS Date.getDay() order (0=Sunday)', () => {
    expect(GIORNI_MAPPA).toHaveLength(7)
    expect(GIORNI_MAPPA[0]).toBe('Domenica')
    expect(GIORNI_MAPPA[6]).toBe('Sabato')
  })

  it('uses the expected cutoff hour constant', () => {
    expect(EARLY_MORNING_CUTOFF_HOUR).toBe(6)
  })
})

describe('getOggiData', () => {
  it('formats the current date as YYYY-MM-DD', () => {
    expect(getOggiData(at(2026, 4, 15, 12))).toBe('2026-04-15')
  })

  it('rolls back to the previous day before 6am', () => {
    expect(getOggiData(at(2026, 4, 15, 3))).toBe('2026-04-14')
  })

  it('handles month boundary rollback (1st -> previous month)', () => {
    expect(getOggiData(at(2026, 5, 1, 2))).toBe('2026-04-30')
  })

  it('handles year boundary rollback (Jan 1st -> Dec 31st)', () => {
    expect(getOggiData(at(2026, 1, 1, 1))).toBe('2025-12-31')
  })

  it('pads single-digit months and days with leading zero', () => {
    expect(getOggiData(at(2026, 3, 7, 10))).toBe('2026-03-07')
  })

  it('does not mutate the input Date', () => {
    const input = at(2026, 5, 1, 2)
    const snapshot = input.getTime()
    getOggiData(input)
    expect(input.getTime()).toBe(snapshot)
  })
})

describe('eventoValido', () => {
  const now = at(2026, 4, 15, 12)

  it('treats events without data_evento as always valid', () => {
    expect(eventoValido({ giorno: 'Lunedi' }, now)).toBe(true)
  })

  it('rejects events in the past', () => {
    expect(eventoValido({ data_evento: '2026-04-14' }, now)).toBe(false)
  })

  it('accepts events today', () => {
    expect(eventoValido({ data_evento: '2026-04-15' }, now)).toBe(true)
  })

  it('accepts events in the future', () => {
    expect(eventoValido({ data_evento: '2026-04-20' }, now)).toBe(true)
  })

  it('uses the pre-6am rollback when deciding today', () => {
    const earlyMorning = at(2026, 4, 15, 3)
    // Event dated yesterday should still count as valid before 6am
    expect(eventoValido({ data_evento: '2026-04-14' }, earlyMorning)).toBe(true)
  })
})

describe('eventoStasera', () => {
  const now = at(2026, 4, 15, 21) // Wednesday evening

  it('matches by giorno when data_evento is missing', () => {
    expect(eventoStasera({ giorno: 'Mercoledi' }, now)).toBe(true)
    expect(eventoStasera({ giorno: 'Lunedi' }, now)).toBe(false)
  })

  it('matches by data_evento when present', () => {
    expect(eventoStasera({ data_evento: '2026-04-15' }, now)).toBe(true)
    expect(eventoStasera({ data_evento: '2026-04-16' }, now)).toBe(false)
  })

  it('uses the pre-6am rollback when matching', () => {
    const lateNight = at(2026, 4, 16, 2) // counts as 2026-04-15
    expect(eventoStasera({ data_evento: '2026-04-15' }, lateNight)).toBe(true)
  })

  it('returns false for null/undefined events', () => {
    expect(eventoStasera(null, now)).toBe(false)
    expect(eventoStasera(undefined, now)).toBe(false)
  })
})

describe('localeApertoOra', () => {
  const now = at(2026, 4, 15, 21)

  it('returns false for venues with no events today', () => {
    const locale = {
      eventi: [
        { data_evento: '2026-04-20' }, // future but not tonight
        { data_evento: '2026-04-14' }, // past
      ],
    }
    expect(localeApertoOra(locale, now)).toBe(false)
  })

  it('returns true when at least one event is tonight', () => {
    const locale = {
      eventi: [
        { data_evento: '2026-04-14' },
        { data_evento: '2026-04-15' },
      ],
    }
    expect(localeApertoOra(locale, now)).toBe(true)
  })

  it('gracefully handles missing eventi array', () => {
    expect(localeApertoOra({}, now)).toBe(false)
    expect(localeApertoOra(null, now)).toBe(false)
  })
})

describe('filterLocaliByFiltro', () => {
  const now = at(2026, 4, 15, 21)
  const locali = [
    { id: 1, nome: 'A', eventi: [{ data_evento: '2026-04-15' }] },
    { id: 2, nome: 'B', eventi: [{ data_evento: '2026-04-20' }] },
    { id: 3, nome: 'C', eventi: [] },
  ]

  it('returns all venues when filter is "week"', () => {
    expect(filterLocaliByFiltro(locali, 'week', now)).toHaveLength(3)
  })

  it('keeps only venues open tonight when filter is "night"', () => {
    const result = filterLocaliByFiltro(locali, 'night', now)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(1)
  })

  it('returns empty list when no venues match "night"', () => {
    expect(
      filterLocaliByFiltro(
        [{ id: 1, nome: 'A', eventi: [{ data_evento: '2026-04-20' }] }],
        'night',
        now,
      ),
    ).toEqual([])
  })
})

describe('getLocaliMenu', () => {
  const now = at(2026, 4, 15, 21)
  const locali = [
    { id: 1, nome: 'Zeta', eventi: [{ data_evento: '2026-04-15' }] },
    { id: 2, nome: 'Alpha', eventi: [{ data_evento: '2026-04-20' }] },
    { id: 3, nome: 'Mike', eventi: [{ data_evento: '2026-04-15' }] },
  ]

  it('sorts by name alphabetically in week mode', () => {
    const result = getLocaliMenu(locali, 'week', now)
    expect(result.map((l) => l.nome)).toEqual(['Alpha', 'Mike', 'Zeta'])
  })

  it('filters to tonight-only and still sorts in night mode', () => {
    const result = getLocaliMenu(locali, 'night', now)
    expect(result.map((l) => l.nome)).toEqual(['Mike', 'Zeta'])
  })

  it('does not mutate the input array order', () => {
    const input = locali.slice()
    const before = input.map((l) => l.id)
    getLocaliMenu(input, 'week', now)
    expect(input.map((l) => l.id)).toEqual(before)
  })
})

describe('getEventiMenuLocale', () => {
  const now = at(2026, 4, 15, 21)
  const locale = {
    eventi: [
      { id: 1, data_evento: '2026-04-15' }, // tonight
      { id: 2, data_evento: '2026-04-20' }, // future
      { id: 3, data_evento: '2026-04-14' }, // past
      { id: 4, giorno: 'Mercoledi' }, // recurring tonight
    ],
  }

  it('week mode returns all non-expired events', () => {
    const result = getEventiMenuLocale(locale, 'week', now)
    expect(result.map((e) => e.id)).toEqual([1, 2, 4])
  })

  it('night mode returns only events happening tonight', () => {
    const result = getEventiMenuLocale(locale, 'night', now)
    expect(result.map((e) => e.id)).toEqual([1, 4])
  })

  it('handles venues with no events', () => {
    expect(getEventiMenuLocale({ eventi: [] }, 'week', now)).toEqual([])
    expect(getEventiMenuLocale({}, 'night', now)).toEqual([])
  })
})
