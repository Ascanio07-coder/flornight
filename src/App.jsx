import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from './supabase'

var firenzeBounds = [
  [43.7270, 11.1540],
  [43.8130, 11.3300]
]

var giorniMappa = ['Domenica', 'Lunedi', 'Martedi', 'Mercoledi', 'Giovedi', 'Venerdi', 'Sabato']

function App() {
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

  var audioRefState = useRef(null)
  var playState = useState(false)
  var playing = playState[0]
  var setPlaying = playState[1]

  // Touch tracking per tendina 1
  var touch1Start = useRef(0)
  var touch1Offset = useState(0)
  var offset1 = touch1Offset[0]
  var setOffset1 = touch1Offset[1]
  var dragging1 = useRef(false)

  // Touch tracking per tendina 2
  var touch2Start = useRef(0)
  var touch2Offset = useState(0)
  var offset2 = touch2Offset[0]
  var setOffset2 = touch2Offset[1]
  var dragging2 = useRef(false)

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
  }, [])

  function getGiornoOggi() {
    var now = new Date()
    var ora = now.getHours()
    var giorno = now.getDay()
    if (ora < 6) {
      giorno = giorno - 1
      if (giorno < 0) giorno = 6
    }
    return giorniMappa[giorno]
  }

  function getOggiData() {
    var now = new Date()
    var ora = now.getHours()
    if (ora < 6) {
      now.setDate(now.getDate() - 1)
    }
    var anno = now.getFullYear()
    var mese = String(now.getMonth() + 1)
    if (mese.length < 2) mese = '0' + mese
    var giorno = String(now.getDate())
    if (giorno.length < 2) giorno = '0' + giorno
    return anno + '-' + mese + '-' + giorno
  }

  function eventoValido(evento) {
    if (!evento.data_evento) return true
    return evento.data_evento >= getOggiData()
  }

  function eventoStasera(evento) {
    if (!evento.data_evento) return evento.giorno === getGiornoOggi()
    return evento.data_evento === getOggiData()
  }

  function localeApertoOra(locale) {
    return locale.eventi.filter(function(e) { return eventoValido(e) && eventoStasera(e) }).length > 0
  }

  function getLocaliVisibili() {
    if (filtro === 'week') return locali
    return locali.filter(function(l) { return localeApertoOra(l) })
  }

  function getDotColor(locale) {
    if (selezionato && selezionato.id === locale.id) return '#ffffff'
    if (filtro === 'night') return '#D4A843'
    return '#C43E51'
  }

  function getDotFill(locale) {
    if (filtro === 'night') return '#D4A843'
    return '#C43E51'
  }

  function getDotWeight(locale) {
    if (selezionato && selezionato.id === locale.id) return 2
    return 1.5
  }

  function selezionaLocale(locale) {
    setSelezionato(locale)
    setPannelloAperto(true)
    setEventoAperto(null)
    setOffset1(0)
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
    supabase.from('analytics').insert({ tipo: 'view_evento', locale_id: selezionato.id, evento_id: evento.id }).then(function(res) {
      if (res.error) console.log('Analytics errore:', res.error.message)
    })
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
    if (filtro === 'week') {
      setFiltro('night')
    } else {
      setFiltro('week')
    }
    setPannelloAperto(false)
    setSelezionato(null)
    setEventoAperto(null)
    stopAudio()
  }

  function getEventiVisibili() {
    if (!selezionato) return []
    var validi = selezionato.eventi.filter(function(e) { return eventoValido(e) })
    if (filtro === 'night') {
      return validi.filter(function(e) { return eventoStasera(e) })
    }
    return validi
  }

  // Touch handlers tendina 1
  function onTouch1Start(e) {
    touch1Start.current = e.touches[0].clientY
    dragging1.current = true
  }

  function onTouch1Move(e) {
    if (!dragging1.current) return
    var diff = e.touches[0].clientY - touch1Start.current
    if (diff > 0) {
      setOffset1(diff)
    }
  }

  function onTouch1End() {
    dragging1.current = false
    if (offset1 > 100) {
      chiudiPannello()
    }
    setOffset1(0)
  }

  // Touch handlers tendina 2
  function onTouch2Start(e) {
    touch2Start.current = e.touches[0].clientY
    dragging2.current = true
  }

  function onTouch2Move(e) {
    if (!dragging2.current) return
    var diff = e.touches[0].clientY - touch2Start.current
    if (diff > 0) {
      setOffset2(diff)
    }
  }

  function onTouch2End() {
    dragging2.current = false
    if (offset2 > 120) {
      chiudiEvento()
    }
    setOffset2(0)
  }

  var eventiVisibili = getEventiVisibili()
  var hasEventImage = eventoAperto && eventoAperto.immagine_url && eventoAperto.immagine_url.length > 0
  var hasLogo = selezionato && selezionato.logo_url && selezionato.logo_url.length > 0
  var hasFrase = eventoAperto && eventoAperto.frase && eventoAperto.frase.length > 0
  var hasAudio = eventoAperto && eventoAperto.audio_url && eventoAperto.audio_url.length > 0
  var localiVisibili = getLocaliVisibili()

  var tendina1Style = {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    zIndex: 1000,
    background: '#181818',
    borderRadius: '16px 16px 0 0',
    maxHeight: '55vh',
    transform: pannelloAperto ? 'translateY(' + offset1 + 'px)' : 'translateY(100%)',
    transition: dragging1.current ? 'none' : 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    overflowY: dragging1.current ? 'hidden' : 'auto',
    color: '#fff',
    WebkitOverflowScrolling: 'touch'
  }

  var tendina2Style = {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    zIndex: 1100,
    background: '#121212',
    transform: eventoAperto ? 'translateY(' + offset2 + 'px)' : 'translateY(100%)',
    transition: dragging2.current ? 'none' : 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    overflowY: dragging2.current ? 'hidden' : 'auto',
    color: '#fff',
    WebkitOverflowScrolling: 'touch'
  }

  return (
    <div style={{ height: '100%', width: '100%', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', background: '#121212', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        zIndex: 1000, background: 'rgba(12,12,12,0.9)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        padding: '10px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <span style={{ color: '#fff', fontSize: '18px', letterSpacing: '3px', fontWeight: 400 }}>
          FLORNIGHT
        </span>
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
          {filtro === 'night' ? 'STASERA' : 'SETTIMANA'}
        </button>
      </div>

      <MapContainer
        center={[43.7696, 11.2558]}
        zoom={15}
        style={{ height: '100%', width: '100%', background: '#121212', filter: 'brightness(1.3) contrast(1.1)' }}
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
              key={locale.id}
              center={[locale.lat, locale.lng]}
              radius={7}
              pathOptions={{
                color: getDotColor(locale),
                fillColor: getDotFill(locale),
                fillOpacity: 0.85,
                weight: getDotWeight(locale)
              }}
              eventHandlers={{
                click: function() { selezionaLocale(locale) }
              }}
            />
          )
        })}
      </MapContainer>

      {filtro === 'night' && !pannelloAperto && (
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

      <div
        onTouchStart={onTouch1Start}
        onTouchMove={onTouch1Move}
        onTouchEnd={onTouch1End}
        style={tendina1Style}
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

      <div
        onTouchStart={onTouch2Start}
        onTouchMove={onTouch2Move}
        onTouchEnd={onTouch2End}
        style={tendina2Style}
      >
        {eventoAperto && (
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px', flexShrink: 0
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
              {hasEventImage ? (
                <img
                  src={eventoAperto.immagine_url}
                  alt={eventoAperto.nome}
                  style={{
                    width: '100%', borderRadius: '6px',
                    aspectRatio: '1/1', objectFit: 'cover', display: 'block',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.6)'
                  }}
                />
              ) : (
                <div style={{
                  width: '100%', borderRadius: '6px',
                  aspectRatio: '1/1', background: '#282828',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '64px', boxShadow: '0 12px 32px rgba(0,0,0,0.6)'
                }}>
                  🎵
                </div>
              )}
            </div>

            <div style={{ padding: '28px 36px', flex: 1 }}>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: 700, letterSpacing: '0.2px' }}>
                {eventoAperto.nome}
              </h2>

              {hasFrase && (
                <p style={{ margin: '0 0 18px 0', color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: '1.4' }}>
                  {eventoAperto.frase}
                </p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                <span>{eventoAperto.giorno}</span>
                <span style={{ opacity: 0.3 }}>|</span>
                <span>{eventoAperto.orario}</span>
              </div>

              <span style={{
                display: 'inline-block',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                padding: '8px 24px',
                borderRadius: '20px', fontSize: '15px', fontWeight: 600,
                color: '#fff'
              }}>
                {eventoAperto.prezzo}
              </span>

              {hasAudio && (
                <div style={{ marginTop: '32px' }}>
                  <audio
                    ref={audioRefState}
                    src={eventoAperto.audio_url}
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