// Drag / touch-gesture thresholds. These used to be magic numbers baked into
// App.jsx's onTouchEnd handlers (100, 120, 80). Extracting them both makes
// them testable and documents the intent.

// Vertical swipe distance (px) needed to dismiss the venue panel.
export const PANEL_CLOSE_THRESHOLD_PX = 100

// Vertical swipe distance (px) needed to dismiss the event detail overlay.
export const EVENT_CLOSE_THRESHOLD_PX = 120

// Horizontal swipe distance (px) needed to dismiss the side menu.
export const MENU_CLOSE_THRESHOLD_PX = 80

// Given a current pointer coordinate and the starting coordinate, return a
// clamped non-negative delta. Negative diffs are ignored so the panel never
// overshoots "up" past its docked position.
export function dragDelta(current, start) {
  const diff = current - start
  return diff > 0 ? diff : 0
}

export function shouldClosePanel(offset) {
  return offset > PANEL_CLOSE_THRESHOLD_PX
}

export function shouldCloseEvent(offset) {
  return offset > EVENT_CLOSE_THRESHOLD_PX
}

export function shouldCloseMenu(offset) {
  return offset > MENU_CLOSE_THRESHOLD_PX
}
