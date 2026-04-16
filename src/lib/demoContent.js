// Demo content pool used as fallback when events are missing
// immagine_url, frase or audio_url. Keeps the site looking populated
// during development and presentations.
//
// Each function picks a deterministic entry from the pool using a
// seed (typically the event id) so a given event always shows the
// same fallback content across page reloads.

// ── Poster SVG data URIs (inline, no external dependencies) ────────

function makeSvgDataUri(gradient, icon, subtitle) {
  var svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">' +
    '<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">' +
    gradient +
    '</linearGradient></defs>' +
    '<rect width="600" height="600" fill="url(#g)"/>' +
    '<text x="300" y="260" text-anchor="middle" font-size="120" fill="rgba(255,255,255,0.15)">' + icon + '</text>' +
    '<text x="300" y="380" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="600" letter-spacing="4" fill="rgba(255,255,255,0.6)">FLORNIGHT</text>' +
    '<text x="300" y="415" text-anchor="middle" font-family="sans-serif" font-size="14" fill="rgba(255,255,255,0.3)">' + subtitle + '</text>' +
    '</svg>'
  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

var DEMO_POSTERS = [
  makeSvgDataUri(
    '<stop offset="0%" stop-color="#1a0533"/><stop offset="100%" stop-color="#C43E51"/>',
    '\u266B', 'LA NOTTE DI FIRENZE'
  ),
  makeSvgDataUri(
    '<stop offset="0%" stop-color="#0d1b2a"/><stop offset="100%" stop-color="#D4A843"/>',
    '\u2605', 'EVENTI E SERATE'
  ),
  makeSvgDataUri(
    '<stop offset="0%" stop-color="#1b0a2e"/><stop offset="100%" stop-color="#6C3483"/>',
    '\u263E', 'MUSICA DAL VIVO'
  ),
  makeSvgDataUri(
    '<stop offset="0%" stop-color="#0a1628"/><stop offset="50%" stop-color="#1a3a5c"/><stop offset="100%" stop-color="#C43E51"/>',
    '\u2764', 'DRINK &amp; DANCE'
  ),
  makeSvgDataUri(
    '<stop offset="0%" stop-color="#1c1c1c"/><stop offset="100%" stop-color="#D4A843"/>',
    '\u2726', 'OGNI NOTTE UNA STORIA'
  ),
  makeSvgDataUri(
    '<stop offset="0%" stop-color="#0f2027"/><stop offset="50%" stop-color="#203a43"/><stop offset="100%" stop-color="#2c5364"/>',
    '\u266A', 'CLUBBING FIRENZE'
  ),
]

// ── Phrases ────────────────────────────────────────────────────────

var DEMO_FRASI = [
  'Firenze non dorme mai. Vieni a scoprire il lato notturno della citta.',
  'Musica, drink e atmosfera unica sotto le stelle di Firenze.',
  'Ogni serata e un viaggio. Lasciati trasportare dal sound.',
  'La notte fiorentina ti aspetta. Non perdere questa serata.',
  'Dove la musica incontra l\'arte. Firenze dopo il tramonto.',
  'Vivi la notte come non l\'hai mai vissuta. Ti aspettiamo.',
  'Beat, luci e sorrisi. La ricetta perfetta per stasera.',
  'Stasera succede qualcosa di speciale. Non mancare.',
  'Il cuore pulsante della nightlife fiorentina batte qui.',
  'Aperitivo, cena, clubbing — tutto in una notte sola.',
]

// ── Audio (generated as WAV blobs on-demand) ───────────────────────
//
// These are short ambient tones produced via additive synthesis.
// They give the audio player something to demo without requiring
// external URLs. Replace with real tracks in production.

var TONE_CONFIGS = [
  { freqs: [110, 165, 220, 330], dur: 10, label: 'Deep Ambient' },
  { freqs: [261.6, 329.6, 392, 523.2], dur: 10, label: 'Ethereal Chord' },
  { freqs: [146.8, 174.6, 220, 261.6], dur: 10, label: 'Mysterious Night' },
  { freqs: [196, 246.9, 293.7, 370], dur: 10, label: 'Warm Glow' },
]

function writeString(view, offset, str) {
  for (var i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}

function generateAmbientBlob(config) {
  var sampleRate = 22050
  var numSamples = Math.floor(sampleRate * config.dur)
  var buffer = new ArrayBuffer(44 + numSamples * 2)
  var view = new DataView(buffer)

  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + numSamples * 2, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(view, 36, 'data')
  view.setUint32(40, numSamples * 2, true)

  var fadeLen = sampleRate * 1.5
  for (var i = 0; i < numSamples; i++) {
    var t = i / sampleRate
    var sample = 0
    for (var f = 0; f < config.freqs.length; f++) {
      sample += Math.sin(2 * Math.PI * config.freqs[f] * t)
    }
    sample /= config.freqs.length
    // Slow tremolo for movement
    sample *= 1 + 0.15 * Math.sin(2 * Math.PI * 0.3 * t)
    // Fade in / out
    var env = 1
    if (i < fadeLen) env = i / fadeLen
    if (i > numSamples - fadeLen) env = (numSamples - i) / fadeLen
    sample *= env * 0.45
    view.setInt16(44 + i * 2, Math.round(sample * 32767), true)
  }

  return new Blob([buffer], { type: 'audio/wav' })
}

var audioUrlCache = {}

// ── Public API ─────────────────────────────────────────────────────

export function getDemoPoster(seed) {
  var idx = (typeof seed === 'number' ? Math.abs(seed) : 0) % DEMO_POSTERS.length
  return DEMO_POSTERS[idx]
}

export function getDemoFrase(seed) {
  var idx = (typeof seed === 'number' ? Math.abs(seed) : 0) % DEMO_FRASI.length
  return DEMO_FRASI[idx]
}

export function getDemoAudioUrl(seed) {
  if (typeof window === 'undefined') return null
  var idx = (typeof seed === 'number' ? Math.abs(seed) : 0) % TONE_CONFIGS.length
  if (!audioUrlCache[idx]) {
    var blob = generateAmbientBlob(TONE_CONFIGS[idx])
    audioUrlCache[idx] = URL.createObjectURL(blob)
  }
  return audioUrlCache[idx]
}

export { DEMO_POSTERS, DEMO_FRASI, TONE_CONFIGS }
