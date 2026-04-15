import { describe, it, expect } from 'vitest'
import {
  PANEL_CLOSE_THRESHOLD_PX,
  EVENT_CLOSE_THRESHOLD_PX,
  MENU_CLOSE_THRESHOLD_PX,
  dragDelta,
  shouldClosePanel,
  shouldCloseEvent,
  shouldCloseMenu,
} from './gestures.js'

describe('threshold constants', () => {
  it('preserves the original App.jsx magic numbers', () => {
    expect(PANEL_CLOSE_THRESHOLD_PX).toBe(100)
    expect(EVENT_CLOSE_THRESHOLD_PX).toBe(120)
    expect(MENU_CLOSE_THRESHOLD_PX).toBe(80)
  })
})

describe('dragDelta', () => {
  it('returns the positive delta', () => {
    expect(dragDelta(250, 100)).toBe(150)
  })

  it('clamps negative deltas to zero (no upward bounce)', () => {
    expect(dragDelta(50, 100)).toBe(0)
  })

  it('returns zero when there is no movement', () => {
    expect(dragDelta(100, 100)).toBe(0)
  })
})

describe('shouldClosePanel', () => {
  it('closes when the drag exceeds the threshold', () => {
    expect(shouldClosePanel(PANEL_CLOSE_THRESHOLD_PX + 1)).toBe(true)
  })

  it('keeps the panel open at exactly the threshold', () => {
    // Matches the strict `>` comparison used in App.jsx onTouch1End.
    expect(shouldClosePanel(PANEL_CLOSE_THRESHOLD_PX)).toBe(false)
  })

  it('keeps the panel open below the threshold', () => {
    expect(shouldClosePanel(10)).toBe(false)
  })
})

describe('shouldCloseEvent', () => {
  it('closes when the drag exceeds the threshold', () => {
    expect(shouldCloseEvent(EVENT_CLOSE_THRESHOLD_PX + 1)).toBe(true)
  })

  it('keeps the event open at exactly the threshold', () => {
    expect(shouldCloseEvent(EVENT_CLOSE_THRESHOLD_PX)).toBe(false)
  })
})

describe('shouldCloseMenu', () => {
  it('closes when the drag exceeds the threshold', () => {
    expect(shouldCloseMenu(MENU_CLOSE_THRESHOLD_PX + 1)).toBe(true)
  })

  it('keeps the menu open at exactly the threshold', () => {
    expect(shouldCloseMenu(MENU_CLOSE_THRESHOLD_PX)).toBe(false)
  })
})
