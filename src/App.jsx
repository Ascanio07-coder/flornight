import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from './supabase'
import {
  getGiornoOggi as libGetGiornoOggi,
  filterLocaliByFiltro,
  getLocaliMenu as libGetLocaliMenu,
  getEventiMenuLocale as libGetEventiMenuLocale,
  eventoValido as libEventoValido,
  eventoStasera as libEventoStasera,
} from './lib/dateFilters.js'
import {
  getDotColor as libGetDotColor,
  getDotFill as libGetDotFill,
  getDotRadius as libGetDotRadius,
  getDotWeight as libGetDotWeight,
  getDotOpacity as libGetDotOpacity,
} from './lib/markers.js'
import {
  dragDelta,
  shouldClosePanel,
  shouldCloseEvent,
  shouldCloseMenu,
} from './lib/gestures.js'
import { getDemoPoster, getDemoFrase, getDemoAudioUrl } from './lib/demoContent.js'
import QRCode from 'qrcode'

var firenzeBounds = [
  [43.7270, 11.1540],
  [43.8130, 11.3300]
]

var isApp = typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches

function App() {
  var splashState = useState(isApp)
  var showSplash = splashState[0]
  var setShowSplash = splashState[1]

  var localiState = useState([])
  var locali = localiState[0]
  var setLocali = localiState[1]

  var selState = useState(null)
  var selezionato = selState[0]
  var setSelezionato = selState[1]

  var pannelloState = useState(false)
  var pannelloAperto = pannelloState[0]
  var setPannelloAperto = pannelloState[1]

  var evState = useState(null)
  var eventoAperto = evState[0]
  var setEventoAperto = evState[1]

  var filtroState = useState('week')
  var filtro = filtroState[0]
  var setFiltro = filtroState[1]

  var menuState = useState(false)
  var menuAperto = menuState[0]
  var setMenuAperto = menuState[1]

  var menuLocaleState = useState(null)
  var menuLocaleEspanso = menuLocaleState[0]
  var setMenuLocaleEspanso = menuLocaleState[1]

  var searchState = useState('')
  var searchQuery = searchState[0]
  var setSearchQuery = searchState[1]

  var currentUserState = useState(null)
  var currentUser = currentUserState[0]
  var setCurrentUser = currentUserState[1]

  var bigliettiState = useState([])
  var biglietti = bigliettiState[0]
  var setBiglietti = bigliettiState[1]

  var ticketsApertoState = useState(false)
  var ticketsAperto = ticketsApertoState[0]
  var setTicketsAperto = ticketsApertoState[1]

  var qrCacheRef = useRef({})
  var qrBumpState = useState(0)
  var setQrBump = qrBumpState[1]

  var touchTicketsStart = useRef(0)
  var touchTicketsOffset = useState(0)
  var offsetTickets = touchTicketsOffset[0]
  var setOffsetTickets = touchTicketsOffset[1]
  var draggingTickets = useRef(false)

  var audioRefState = useRef(null)
  var playState = useState(false)
  var playing = playState[0]
  var setPlaying = playState[1]

  var touch1Start = useRef(0)
  var touch1Offset = useState(0)
  var offset1 = touch1Offset[0]
  var setOffset1 = touch1Offset[1]
  var dragging1 = useRef(false)

  var touch2Start = useRef(0)
  var touch2Offset = useState(0)
  var offset2 = touch2Offset[0]
  var setOffset2 = touch2Offset[1]
  var dragging2 = useRef(false)

  var touchMenuStart = useRef(0)
  var touchMenuOffset = useState(0)
  var offsetMenu = touchMenuOffset[0]
  var setOffsetMenu = touchMenuOffset[1]
  var draggingMenu = useRef(false)

  // Splash screen timer
  useEffect(function() {
    if (isApp) {
      setTimeout(function() { setShowSplash(false) }, 2200)
    }
  }, [setShowSplash])

  // Controlla se l'utente e gia loggato
  useEffect(function() {
    supabase.auth.getSession().then(function(res) {
      if (res.data.session) {
        setCurrentUser(res.data.session.user)
      }
    })
  }, [])

  // Carica biglietti quando l'utente e autenticato
  useEffect(function() {
    if (!currentUser) return
    supabase.from('biglietti').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }).then(function(res) {
      setBiglietti(res.data || [])
    })
  }, [currentUser])

  // Genera QR code SOLO per i biglietti pagati (is_paid = true).
  // La fonte di verita' del pagamento e' il webhook di Stripe: il frontend
  // non deve mai produrre un QR per un biglietto non confermato.
  // Se il webhook ha gia' salvato qr_code nel DB, lo usiamo direttamente.
  useEffect(function() {
    var cache = qrCacheRef.current
    biglietti.forEach(function(b) {
      if (!b.is_paid) return
      if (cache[b.codice]) return
      if (b.qr_code) {
        cache[b.codice] = b.qr_code
        setQrBump(function(n) { return n + 1 })
        return
      }
      var payload = JSON.stringify({
        codice: b.codice,
        utente: currentUser ? currentUser.email : '',
        locale: b.locale_nome,
        evento: b.evento_nome,
        giorno: b.evento_giorno,
        orario: b.evento_orario,
        prezzo: b.prezzo
      })
      QRCode.toDataURL(payload, { width: 200, margin: 2 }).then(function(url) {
        cache[b.codice] = url
        setQrBump(function(n) { return n + 1 })
      })
    })
  }, [biglietti, currentUser])

  useEffect(function() {
    supabase.from('locali').select('*').then(function(res1) {
      supabase.from('eventi').select('*').then(function(res2) {
        var locs = res1.data || []
        var evs = res2.data || []
        var risultato = locs.map(function(locale) {
          return {
            id: locale.id,
            nome: locale.nome,
            indirizzo: locale.indirizzo,
            descrizione: locale.descrizione,
            lat: locale.lat,
            lng: locale.lng,
            logo_url: locale.logo_url,
            eventi: evs.filter(function(e) { return e.locale_id === locale.id })
          }
        })
        setLocali(risultato)
      })
    })
  }, [setLocali])

  function getGiornoOggi() { return libGetGiornoOggi() }
  function eventoValido(evento) { return libEventoValido(evento) }
  function eventoStasera(evento) { return libEventoStasera(evento) }

  function getLocaliVisibili() {
    return filterLocaliByFiltro(locali, filtro)
  }

  function getLocaliMenu() {
    return libGetLocaliMenu(locali, filtro)
  }

  function getDotColor(locale) {
    return libGetDotColor(locale, { selezionatoId: selezionato ? selezionato.id : null, filtro: filtro })
  }

  function getDotFill() {
    return libGetDotFill(filtro)
  }

  function getDotWeight(locale) {
    return libGetDotWeight(locale, { selezionatoId: selezionato ? selezionato.id : null })
  }

  function getDotRadius(locale) {
    return libGetDotRadius(locale, { selezionatoId: selezionato ? selezionato.id : null })
  }

  function getDotOpacity() {
    return libGetDotOpacity()
  }

  function selezionaLocale(locale) {
    setSelezionato(locale)
    setPannelloAperto(true)
    setEventoAperto(null)
    setOffset1(0)
    setMenuAperto(false)
    setMenuLocaleEspanso(null)
    stopAudio()
    supabase.from('analytics').insert({ tipo: 'view_locale', locale_id: locale.id }).then(function(res) {
      if (res.error) console.log('Analytics errore:', res.error.message)
    })
  }

  function chiudiPannello() {
    setPannelloAperto(false)
    setSelezionato(null)
    setEventoAperto(null)
    setOffset1(0)
    stopAudio()
  }

  function apriEvento(evento) {
    stopAudio()
    setEventoAperto(evento)
    setOffset2(0)
    supabase.from('analytics').insert({ tipo: 'view_evento', locale_id: selezionato ? selezionato.id : null, evento_id: evento.id }).then(function(res) {
      if (res.error) console.log('Analytics errore:', res.error.message)
    })
  }

  function apriEventoDaMenu(locale, evento) {
    setSelezionato(locale)
    setPannelloAperto(false)
    setMenuAperto(false)
    setMenuLocaleEspanso(null)
    stopAudio()
    setEventoAperto(evento)
    setOffset2(0)
    supabase.from('analytics').insert({ tipo: 'view_evento', locale_id: locale.id, evento_id: evento.id }).then(function(res) {
      if (res.error) console.log('Analytics errore:', res.error.message)
    })
  }

  function menuClickLocale(locale) {
    if (filtro === 'night') {
      var eventiStasera = locale.eventi.filter(function(e) { return eventoValido(e) && eventoStasera(e) })
      if (eventiStasera.length === 1) {
        setSelezionato(locale)
        apriEventoDaMenu(locale, eventiStasera[0])
      } else if (eventiStasera.length > 1) {
        setMenuLocaleEspanso(menuLocaleEspanso === locale.id ? null : locale.id)
      }
    } else {
      setMenuLocaleEspanso(menuLocaleEspanso === locale.id ? null : locale.id)
    }
  }

  function getEventiMenuLocale(locale) {
    return libGetEventiMenuLocale(locale, filtro)
  }

  function chiudiEvento() {
    stopAudio()
    setEventoAperto(null)
    setOffset2(0)
  }

  function toggleAudio() {
    if (!audioRefState.current) return
    if (playing) {
      audioRefState.current.pause()
      setPlaying(false)
    } else {
      audioRefState.current.play().then(function() {
        setPlaying(true)
      }).catch(function() {
        setPlaying(false)
      })
    }
  }

  function stopAudio() {
    if (audioRefState.current) {
      audioRefState.current.pause()
      audioRefState.current.currentTime = 0
    }
    setPlaying(false)
  }

  function getEventBorder(i, totale) {
    if (i < totale - 1) return '1px solid rgba(255,255,255,0.06)'
    return 'none'
  }

  function toggleFiltro() {
    var newFiltro = filtro === 'week' ? 'night' : 'week'
    setFiltro(newFiltro)
    setPannelloAperto(false)
    setSelezionato(null)
    setEventoAperto(null)
    setMenuLocaleEspanso(null)
    stopAudio()
  }

  function getEventiVisibili() {
    if (!selezionato) return []
    return libGetEventiMenuLocale(selezionato, filtro)
  }

  function onTouch1Start(e) { touch1Start.current = e.touches[0].clientY; dragging1.current = true }
  function onTouch1Move(e) { if (!dragging1.current) return; setOffset1(dragDelta(e.touches[0].clientY, touch1Start.current)) }
  function onTouch1End() { dragging1.current = false; if (shouldClosePanel(offset1)) chiudiPannello(); setOffset1(0) }

  function onTouch2Start(e) { touch2Start.current = e.touches[0].clientY; dragging2.current = true }
  function onTouch2Move(e) { if (!dragging2.current) return; setOffset2(dragDelta(e.touches[0].clientY, touch2Start.current)) }
  function onTouch2End() { dragging2.current = false; if (shouldCloseEvent(offset2)) chiudiEvento(); setOffset2(0) }

  function onTouchMenuStart(e) { touchMenuStart.current = e.touches[0].clientX; draggingMenu.current = true }
  function onTouchMenuMove(e) { if (!draggingMenu.current) return; setOffsetMenu(dragDelta(e.touches[0].clientX, touchMenuStart.current)) }
  function onTouchMenuEnd() { draggingMenu.current = false; if (shouldCloseMenu(offsetMenu)) { setMenuAperto(false) } setOffsetMenu(0) }

  function onTouchTicketsStart(e) { touchTicketsStart.current = e.touches[0].clientX; draggingTickets.current = true }
  function onTouchTicketsMove(e) { if (!draggingTickets.current) return; setOffsetTickets(dragDelta(e.touches[0].clientX, touchTicketsStart.current)) }
  function onTouchTicketsEnd() { draggingTickets.current = false; if (shouldCloseMenu(offsetTickets)) { setTicketsAperto(false) } setOffsetTickets(0) }

  // Click su "Acquista":
  // 1) inserisce il biglietto con is_paid=false (pending)
  // 2) chiede al backend una Checkout Session Stripe
  // 3) reindirizza l'utente a Stripe
  // Il QR verra' sbloccato solo quando il webhook conferma il pagamento.
  function clickPrezzo(evento, locale) {
    if (!currentUser) {
      window.location.href = '/utente?redirect=/'
      return
    }
    var codice = 'FN-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase()
    supabase.from('biglietti').insert({
      user_id: currentUser.id,
      evento_id: evento.id,
      locale_id: locale.id,
      codice: codice,
      evento_nome: evento.nome,
      locale_nome: locale.nome,
      evento_giorno: evento.giorno,
      evento_orario: evento.orario || '',
      prezzo: evento.prezzo || '',
      is_paid: false
    }).select().single().then(function(res) {
      if (res.error || !res.data) {
        alert('Errore creazione biglietto: ' + (res.error ? res.error.message : 'sconosciuto'))
        return
      }
      var biglietto = res.data
      // Chiamiamo il backend per creare la sessione Stripe.
      // Nessuna chiave segreta viaggia sul client: solo id/metadata pubblici.
      fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          bigliettoId: biglietto.id,
          codice: codice,
          evento: {
            id: evento.id,
            nome: evento.nome,
            giorno: evento.giorno,
            orario: evento.orario || '',
            prezzo: evento.prezzo || ''
          },
          locale: {
            id: locale.id,
            nome: locale.nome
          }
        })
      }).then(function(r) {
        return r.json().then(function(data) { return { ok: r.ok, data: data } })
      }).then(function(result) {
        if (!result.ok || !result.data || !result.data.url) {
          alert('Errore avvio pagamento: ' + (result.data && result.data.error ? result.data.error : 'sconosciuto'))
          return
        }
        window.location.href = result.data.url
      }).catch(function(err) {
        alert('Errore di rete: ' + err.message)
      })
    })
  }

  var eventiVisibili = getEventiVisibili()
  var hasEventImage = eventoAperto && eventoAperto.immagine_url && eventoAperto.immagine_url.length > 0
  var hasLogo = selezionato && selezionato.logo_url && selezionato.logo_url.length > 0
  var hasFrase = eventoAperto && eventoAperto.frase && eventoAperto.frase.length > 0
  var hasAudio = eventoAperto && eventoAperto.audio_url && eventoAperto.audio_url.length > 0

  // Demo fallbacks for events without custom content
  var eventoPoster = hasEventImage ? eventoAperto.immagine_url : (eventoAperto ? getDemoPoster(eventoAperto.id) : null)
  var eventoFrase = hasFrase ? eventoAperto.frase : (eventoAperto ? getDemoFrase(eventoAperto.id) : null)
  var eventoAudio = hasAudio ? eventoAperto.audio_url : (eventoAperto ? getDemoAudioUrl(eventoAperto.id) : null)

  var localiVisibili = getLocaliVisibili()
  var localiMenu = getLocaliMenu()

  // Search filter for the side menu
  var q = searchQuery.trim().toLowerCase()
  var localiMenuFiltrati = q.length === 0 ? localiMenu : localiMenu.filter(function(locale) {
    if (locale.nome.toLowerCase().indexOf(q) >= 0) return true
    if (locale.indirizzo && locale.indirizzo.toLowerCase().indexOf(q) >= 0) return true
    var evs = getEventiMenuLocale(locale)
    return evs.some(function(ev) {
      if (ev.nome && ev.nome.toLowerCase().indexOf(q) >= 0) return true
      if (ev.frase && ev.frase.toLowerCase().indexOf(q) >= 0) return true
      return false
    })
  })

  // SPLASH SCREEN (solo app)
  if (showSplash) {
    return (
      <div style={{
        height: '100%', width: '100%', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: '#0a0a0a', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif'
      }}>
        <img src="/icon.png" alt="FLORNIGHT" style={{
          width: '120px', height: '120px', borderRadius: '24px',
          animation: 'splashFade 2s ease-in-out',
          marginBottom: '24px'
        }} />
        <span style={{
          color: '#fff', fontSize: '22px', letterSpacing: '6px', fontWeight: 300,
          animation: 'splashFade 2s ease-in-out'
        }}>
          FLORNIGHT
        </span>
        <span style={{
          color: 'rgba(255,255,255,0.3)', fontSize: '11px', letterSpacing: '3px',
          marginTop: '8px', animation: 'splashFade 2s ease-in-out'
        }}>
          LA NOTTE DI FIRENZE
        </span>
        <style>{'@keyframes splashFade { 0% { opacity: 0; transform: scale(0.9); } 30% { opacity: 1; transform: scale(1); } 100% { opacity: 1; transform: scale(1); } }'}</style>
      </div>
    )
  }

  var headerPadding = isApp ? '14px 20px' : '10px 20px'
  var headerFontSize = isApp ? '20px' : '18px'
  var transSpeed = isApp ? '0.4s' : '0.35s'

  return (
    <div style={{ height: '100%', width: '100%', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', background: '#121212', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' }}>

      {/* CSS per animazioni app */}
      {isApp && (
        <style>{'@keyframes glow { 0% { box-shadow: 0 0 4px rgba(196,62,81,0.3); } 50% { box-shadow: 0 0 12px rgba(196,62,81,0.6); } 100% { box-shadow: 0 0 4px rgba(196,62,81,0.3); } }'}</style>
      )}

      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        zIndex: 1000, background: 'rgba(12,12,12,0.9)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        padding: headerPadding,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: isApp ? '50px' : '10px'
      }}>
        <span style={{ color: '#fff', fontSize: headerFontSize, letterSpacing: '3px', fontWeight: 400 }}>
          FLORNIGHT
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={toggleFiltro}
            style={{
              padding: '5px 14px', borderRadius: '16px',
              border: filtro === 'night' ? '1px solid #D4A843' : '1px solid rgba(255,255,255,0.2)',
              cursor: 'pointer', fontSize: '11px', fontWeight: 500,
              background: filtro === 'night' ? 'rgba(212,168,67,0.15)' : 'transparent',
              color: filtro === 'night' ? '#D4A843' : 'rgba(255,255,255,0.6)',
              transition: 'all 0.3s ease', letterSpacing: '0.5px'
            }}
          >
            STASERA
          </button>
          <a
            href="/utente"
            aria-label="Account utente"
            style={{
              width: '30px', height: '30px', borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.7)', textDecoration: 'none',
              cursor: 'pointer'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
            </svg>
          </a>
        </div>
      </div>

      {/* Mappa */}
      <MapContainer
        center={[43.7696, 11.2558]}
        zoom={15}
        style={{ height: '100%', width: '100%', background: '#121212', filter: isApp ? 'brightness(1.75) contrast(1.15)' : 'brightness(1.6) contrast(1.1)' }}
        maxBounds={firenzeBounds}
        maxBoundsViscosity={1.0}
        minZoom={13}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="OpenStreetMap CARTO"
        />
        {localiVisibili.map(function(locale) {
          return (
            <CircleMarker
              key={'hit-' + locale.id}
              center={[locale.lat, locale.lng]}
              radius={35}
              pathOptions={{
                stroke: false,
                fillColor: '#000',
                fillOpacity: 0.01
              }}
              eventHandlers={{
                click: function() { selezionaLocale(locale) }
              }}
            />
          )
        })}
        {localiVisibili.map(function(locale) {
          return (
            <CircleMarker
              key={locale.id}
              center={[locale.lat, locale.lng]}
              radius={getDotRadius(locale)}
              pathOptions={{
                color: getDotColor(locale),
                fillColor: getDotFill(),
                fillOpacity: getDotOpacity(),
                weight: getDotWeight(locale),
                interactive: false
              }}
            />
          )
        })}
      </MapContainer>

      {/* Indicatore night */}
      {filtro === 'night' && !pannelloAperto && !menuAperto && (
        <div style={{
          position: 'absolute', bottom: '24px',
          left: '50%', transform: 'translateX(-50%)',
          zIndex: 999, background: 'rgba(212,168,67,0.1)',
          border: '1px solid rgba(212,168,67,0.3)', borderRadius: '16px',
          padding: '5px 14px', fontSize: '11px', color: '#D4A843',
          letterSpacing: '0.5px'
        }}>
          {getGiornoOggi()}
        </div>
      )}

      {/* Bottone tickets */}
      {!menuAperto && !eventoAperto && !ticketsAperto && (
        <div
          onClick={function() { setTicketsAperto(true) }}
          style={{
            position: 'absolute', bottom: '80px', right: '20px',
            zIndex: 999, width: isApp ? '48px' : '44px', height: isApp ? '48px' : '44px',
            background: isApp ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
            <path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" />
          </svg>
          {biglietti.length > 0 && (
            <div style={{
              position: 'absolute', top: '-4px', right: '-4px',
              width: '18px', height: '18px', borderRadius: '50%',
              background: '#C43E51', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '10px', fontWeight: 700,
              color: '#fff'
            }}>
              {biglietti.length}
            </div>
          )}
        </div>
      )}

      {/* Bottone menu */}
      {!menuAperto && !eventoAperto && !ticketsAperto && (
        <div
          onClick={function() { setMenuAperto(true); setMenuLocaleEspanso(null); setSearchQuery('') }}
          style={{
            position: 'absolute', bottom: '24px', right: '20px',
            zIndex: 999, width: isApp ? '48px' : '44px', height: isApp ? '48px' : '44px',
            background: isApp ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '12px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '4px', cursor: 'pointer'
          }}
        >
          <div style={{ width: '18px', height: '1.5px', background: 'rgba(255,255,255,0.7)', borderRadius: '1px' }}></div>
          <div style={{ width: '18px', height: '1.5px', background: 'rgba(255,255,255,0.7)', borderRadius: '1px' }}></div>
          <div style={{ width: '18px', height: '1.5px', background: 'rgba(255,255,255,0.7)', borderRadius: '1px' }}></div>
        </div>
      )}

      {/* Menu laterale */}
      <div
        onTouchStart={onTouchMenuStart}
        onTouchMove={onTouchMenuMove}
        onTouchEnd={onTouchMenuEnd}
        style={{
        position: 'absolute',
        top: 0, bottom: 0, right: 0,
        width: isApp ? '88%' : '85%',
        zIndex: 1200,
        background: isApp ? '#0f0f0f' : '#141414',
        transform: menuAperto ? ('translateX(' + offsetMenu + 'px)') : 'translateX(100%)',
        transition: draggingMenu.current ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        color: '#fff',
        boxShadow: menuAperto ? '-8px 0 32px rgba(0,0,0,0.5)' : 'none'
      }}>
        {/* Handle verticale (stile delle altre tendine) */}
        <div
          onClick={function() { setMenuAperto(false) }}
          style={{
            position: 'absolute',
            left: '8px', top: '50%', transform: 'translateY(-50%)',
            width: '3px', height: '32px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '2px', cursor: 'pointer',
            zIndex: 5
          }}
        />
        <div style={{
          height: '100%',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y'
        }}>
        <div style={{ paddingTop: isApp ? '60px' : '20px', paddingRight: '20px', paddingBottom: '100px', paddingLeft: '28px' }}>
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
              {filtro === 'night' ? 'STASERA' : 'TUTTI I LOCALI'}
            </span>
          </div>

          {/* Barra di ricerca */}
          <div style={{ position: 'relative', marginBottom: '18px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" />
            </svg>
            <input
              type="text"
              placeholder="Cerca locale, evento, frase..."
              value={searchQuery}
              onChange={function(e) { setSearchQuery(e.target.value) }}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 12px 10px 36px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff', fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {localiMenuFiltrati.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
              {q.length > 0 ? 'Nessun risultato per "' + searchQuery + '"' : 'Nessun locale aperto stasera'}
            </p>
          )}

          {localiMenuFiltrati.map(function(locale) {
            var espanso = menuLocaleEspanso === locale.id
            var eventiLocale = getEventiMenuLocale(locale)
            var hasLoc = locale.logo_url && locale.logo_url.length > 0

            return (
              <div key={locale.id} style={{ marginBottom: '2px' }}>
                <div
                  onClick={function() { menuClickLocale(locale) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 8px', cursor: 'pointer',
                    background: espanso ? 'rgba(255,255,255,0.04)' : 'transparent',
                    borderRadius: '10px',
                    transition: 'background 0.2s ease'
                  }}
                >
                  {hasLoc ? (
                    <img src={locale.logo_url} alt={locale.nome} style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#282828', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                      {locale.nome.charAt(0)}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 500 }}>{locale.nome}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{locale.indirizzo}</div>
                  </div>
                  {filtro === 'week' && (
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>{espanso ? '-' : '+'}</span>
                  )}
                </div>

                {espanso && eventiLocale.length > 0 && (
                  <div style={{ paddingLeft: '56px', paddingBottom: '8px' }}>
                    {eventiLocale.map(function(ev) {
                      return (
                        <div
                          key={ev.id}
                          onClick={function() { apriEventoDaMenu(locale, ev) }}
                          style={{
                            padding: '8px 0', cursor: 'pointer',
                            borderBottom: '1px solid rgba(255,255,255,0.04)'
                          }}
                        >
                          <div style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>{ev.nome}</div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                            {ev.giorno} - {ev.orario} - {ev.prezzo}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        </div>

        {/* Bottone chiudi menu (X) in basso a destra */}
        <div
          onClick={function() { setMenuAperto(false) }}
          style={{
            position: 'absolute', bottom: '24px', right: '20px',
            zIndex: 10,
            width: isApp ? '48px' : '44px', height: isApp ? '48px' : '44px',
            background: isApp ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', lineHeight: 1, color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer'
          }}
        >
          ×
        </div>
      </div>

      {/* Overlay menu */}
      {menuAperto && (
        <div
          onClick={function() { setMenuAperto(false) }}
          style={{
            position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
            zIndex: 1150, background: 'rgba(0,0,0,0.5)'
          }}
        />
      )}

      {/* Tendina Tickets */}
      <div
        onTouchStart={onTouchTicketsStart}
        onTouchMove={onTouchTicketsMove}
        onTouchEnd={onTouchTicketsEnd}
        style={{
          position: 'absolute',
          top: 0, bottom: 0, right: 0,
          width: isApp ? '88%' : '85%',
          zIndex: 1200,
          background: isApp ? '#0f0f0f' : '#141414',
          transform: ticketsAperto ? ('translateX(' + offsetTickets + 'px)') : 'translateX(100%)',
          transition: draggingTickets.current ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          color: '#fff',
          boxShadow: ticketsAperto ? '-8px 0 32px rgba(0,0,0,0.5)' : 'none'
        }}
      >
        <div
          onClick={function() { setTicketsAperto(false) }}
          style={{
            position: 'absolute',
            left: '8px', top: '50%', transform: 'translateY(-50%)',
            width: '3px', height: '32px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '2px', cursor: 'pointer',
            zIndex: 5
          }}
        />
        <div style={{
          height: '100%',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y'
        }}>
          <div style={{ paddingTop: isApp ? '60px' : '20px', paddingRight: '20px', paddingBottom: '100px', paddingLeft: '28px' }}>
            <div style={{ marginBottom: '24px' }}>
              <span style={{ fontSize: '14px', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                I MIEI BIGLIETTI
              </span>
            </div>

            {!currentUser && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '16px' }}>Accedi per vedere i tuoi biglietti</p>
                <a href="/utente?redirect=/" style={{
                  display: 'inline-block', padding: '10px 24px', borderRadius: '10px',
                  background: '#C43E51', color: '#fff', fontSize: '14px', fontWeight: 600,
                  textDecoration: 'none'
                }}>Accedi</a>
              </div>
            )}

            {currentUser && biglietti.length === 0 && (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>
                Nessun biglietto acquistato
              </p>
            )}

            {biglietti.map(function(b) {
              var qrUrl = qrCacheRef.current[b.codice]
              return (
                <div key={b.codice} style={{
                  background: '#1a1a2e', borderRadius: '16px',
                  padding: '20px', marginBottom: '16px',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{b.evento_nome}</div>
                      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{b.locale_nome}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
                        {b.evento_giorno}{b.evento_orario ? ' - ' + b.evento_orario : ''}
                      </div>
                    </div>
                    <span style={{
                      background: 'rgba(196,62,81,0.15)', border: '1px solid rgba(196,62,81,0.3)',
                      padding: '4px 12px', borderRadius: '10px',
                      fontSize: '12px', fontWeight: 600, color: '#C43E51',
                      whiteSpace: 'nowrap'
                    }}>
                      {b.prezzo}
                    </span>
                  </div>

                  {/* Il QR esiste solo se Stripe ha confermato il pagamento
                      (is_paid viene impostato a true solo dal webhook). */}
                  {b.is_paid && qrUrl && (
                    <div style={{ textAlign: 'center', background: '#fff', borderRadius: '12px', padding: '16px' }}>
                      <img src={qrUrl} alt={'QR ' + b.codice} style={{ width: '160px', height: '160px' }} />
                    </div>
                  )}
                  {!b.is_paid && (
                    <div style={{
                      textAlign: 'center', background: 'rgba(255,255,255,0.04)',
                      border: '1px dashed rgba(255,255,255,0.12)',
                      borderRadius: '12px', padding: '20px', color: 'rgba(255,255,255,0.45)',
                      fontSize: '13px', lineHeight: '1.5'
                    }}>
                      Pagamento non ancora completato.<br />
                      Il QR verra' generato dopo la conferma Stripe.
                    </div>
                  )}

                  <div style={{ textAlign: 'center', marginTop: '12px' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', letterSpacing: '1px', fontFamily: 'monospace' }}>
                      {b.codice}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div
          onClick={function() { setTicketsAperto(false) }}
          style={{
            position: 'absolute', bottom: '24px', right: '20px',
            zIndex: 10,
            width: isApp ? '48px' : '44px', height: isApp ? '48px' : '44px',
            background: isApp ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', lineHeight: 1, color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer'
          }}
        >
          ×
        </div>
      </div>

      {/* Overlay tickets */}
      {ticketsAperto && (
        <div
          onClick={function() { setTicketsAperto(false) }}
          style={{
            position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
            zIndex: 1150, background: 'rgba(0,0,0,0.5)'
          }}
        />
      )}

      {/* Tendina 1 */}
      <div
        onTouchStart={onTouch1Start}
        onTouchMove={onTouch1Move}
        onTouchEnd={onTouch1End}
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          zIndex: 1000,
          background: '#181818',
          borderRadius: '16px 16px 0 0',
          maxHeight: '55vh',
          transform: pannelloAperto ? 'translateY(' + offset1 + 'px)' : 'translateY(100%)',
          transition: dragging1.current ? 'none' : 'transform ' + transSpeed + ' cubic-bezier(0.4, 0, 0.2, 1)',
          overflowY: dragging1.current ? 'hidden' : 'auto',
          color: '#fff',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {selezionato && (
          <div style={{ padding: '14px 24px 24px 24px' }}>
            <div
              onClick={chiudiPannello}
              style={{
                width: '32px', height: '3px', background: 'rgba(255,255,255,0.2)',
                borderRadius: '2px', margin: '0 auto 16px auto', cursor: 'pointer'
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
              {selezionato.logo_url && selezionato.logo_url.length > 0 && (
                <img src={selezionato.logo_url} alt={selezionato.nome} style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
              )}
              <div>
                <h2 style={{ margin: '0 0 2px 0', fontSize: '18px', fontWeight: 600, letterSpacing: '0.3px' }}>
                  {selezionato.nome}
                </h2>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                  {selezionato.indirizzo}
                </p>
              </div>
            </div>

            {selezionato.descrizione && (
              <p style={{ margin: '0 0 18px 0', color: 'rgba(255,255,255,0.35)', fontSize: '13px', lineHeight: '1.5' }}>
                {selezionato.descrizione}
              </p>
            )}

            <p style={{ margin: '0 0 10px 0', fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.3)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              {filtro === 'night' ? 'Stasera' : 'Programma'}
            </p>

            {eventiVisibili.length === 0 && (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Nessun evento</p>
            )}

            {eventiVisibili.map(function(evento, i) {
              return (
                <div key={i}
                  onClick={function() { apriEvento(evento) }}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 0', cursor: 'pointer',
                    borderBottom: getEventBorder(i, eventiVisibili.length)
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#fff' }}>{evento.nome}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '3px' }}>
                      {evento.giorno} - {evento.orario}
                    </div>
                  </div>
                  <span style={{
                    color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 500,
                    background: 'rgba(255,255,255,0.06)', padding: '3px 10px',
                    borderRadius: '10px'
                  }}>
                    {evento.prezzo}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Tendina 2 - Evento */}
      <div
        onTouchStart={onTouch2Start}
        onTouchMove={onTouch2Move}
        onTouchEnd={onTouch2End}
        style={{
          position: 'absolute',
          top: 0, bottom: 0, left: 0, right: 0,
          zIndex: 1300,
          background: '#121212',
          transform: eventoAperto ? 'translateY(' + offset2 + 'px)' : 'translateY(100%)',
          transition: dragging2.current ? 'none' : 'transform ' + transSpeed + ' cubic-bezier(0.4, 0, 0.2, 1)',
          overflowY: dragging2.current ? 'hidden' : 'auto',
          color: '#fff',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {eventoAperto && (
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px', flexShrink: 0,
              paddingTop: isApp ? '50px' : '14px'
            }}>
              <div
                onClick={chiudiEvento}
                style={{
                  width: '32px', height: '32px', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: '20px', color: 'rgba(255,255,255,0.6)'
                }}
              >
                &#8964;
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {hasLogo ? '' : (selezionato ? selezionato.nome : '')}
              </div>
              <div style={{ width: '32px' }}></div>
            </div>

            {hasLogo && (
              <div style={{ textAlign: 'center', padding: '0 20px 14px 20px' }}>
                <img
                  src={selezionato.logo_url}
                  alt={selezionato.nome}
                  style={{ height: '40px', objectFit: 'contain', opacity: 0.9 }}
                />
              </div>
            )}

            <div style={{ padding: '0 36px', flexShrink: 0 }}>
              <img
                src={eventoPoster}
                alt={eventoAperto.nome}
                style={{
                  width: '100%', borderRadius: '6px',
                  aspectRatio: '1/1', objectFit: 'cover', display: 'block',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.6)'
                }}
              />
            </div>

            <div style={{ padding: '28px 36px', flex: 1 }}>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: 700, letterSpacing: '0.2px' }}>
                {eventoAperto.nome}
              </h2>

              {eventoFrase && (
                <p style={{ margin: '0 0 18px 0', color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: '1.4' }}>
                  {eventoFrase}
                </p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                <span>{eventoAperto.giorno}</span>
                <span style={{ opacity: 0.3 }}>|</span>
                <span>{eventoAperto.orario}</span>
              </div>

              <span
                onClick={function(e) { e.stopPropagation(); clickPrezzo(eventoAperto, selezionato) }}
                style={{
                  display: 'inline-block',
                  background: '#C43E51',
                  border: '1px solid rgba(196,62,81,0.4)',
                  padding: '10px 28px',
                  borderRadius: '20px', fontSize: '15px', fontWeight: 600,
                  color: '#fff', cursor: 'pointer',
                  transition: 'transform 0.15s ease',
                }}
              >
                {eventoAperto.prezzo} — Acquista
              </span>

              {eventoAudio && (
                <div style={{ marginTop: '32px' }}>
                  <audio
                    ref={audioRefState}
                    src={eventoAudio}
                    preload="auto"
                    onEnded={function() { setPlaying(false) }}
                  />
                  <div
                    onClick={toggleAudio}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      background: '#fff', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', flexShrink: 0
                    }}>
                      <span style={{ fontSize: '18px', color: '#000', marginLeft: playing ? '0' : '2px' }}>
                        {playing ? 'II' : '\u25B6'}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>
                        {playing ? 'In riproduzione' : 'Ascolta'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                        Sound della serata
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App