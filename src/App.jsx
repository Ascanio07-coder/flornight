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

  function localeApertoOra(locale) {
    var oggi = getGiornoOggi()
    var eventiOggi = locale.eventi.filter(function(e) { return e.giorno === oggi })
    return eventiOggi.length > 0
  }

  function getLocaliVisibili() {
    if (filtro === 'week') return locali
    return locali.filter(function(l) { return localeApertoOra(l) })
  }

  function getDotColor(locale) {
    if (selezionato && selezionato.id === locale.id) return '#ffffff'
    if (filtro === 'night') return '#FFD700'
    return '#ff0000'
  }

  function getDotFill(locale) {
    if (filtro === 'night') return '#FFD700'
    return '#ff0000'
  }

  function getDotWeight(locale) {
    if (selezionato && selezionato.id === locale.id) return 3
    return 2
  }

  function selezionaLocale(locale) {
    setSelezionato(locale)
    setPannelloAperto(true)
    setEventoAperto(null)
    stopAudio()
  }

  function chiudiPannello() {
    setPannelloAperto(false)
    setSelezionato(null)
    setEventoAperto(null)
    stopAudio()
  }

  function apriEvento(evento) {
    stopAudio()
    setEventoAperto(evento)
  }

  function chiudiEvento() {
    stopAudio()
    setEventoAperto(null)
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
    if (i < totale - 1) return '1px solid #333'
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

  var hasEventImage = eventoAperto && eventoAperto.immagine_url && eventoAperto.immagine_url.length > 0
  var hasLogo = selezionato && selezionato.logo_url && selezionato.logo_url.length > 0
  var hasFrase = eventoAperto && eventoAperto.frase && eventoAperto.frase.length > 0
  var hasAudio = eventoAperto && eventoAperto.audio_url && eventoAperto.audio_url.length > 0
  var localiVisibili = getLocaliVisibili()

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative', overflow: 'hidden', background: '#1a1a2e', touchAction: 'none' }}>
      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        zIndex: 1000, background: 'rgba(0,0,0,0.85)',
        padding: '10px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <h1 style={{ color: '#fff', margin: 0, fontSize: '22px', letterSpacing: '4px', fontWeight: 300 }}>
          FLORNIGHT
        </h1>
        <button
          onClick={toggleFiltro}
          style={{
            padding: '6px 14px', borderRadius: '20px', border: 'none',
            cursor: 'pointer', fontSize: '12px', fontWeight: 600,
            background: filtro === 'night' ? '#FFD700' : '#333',
            color: filtro === 'night' ? '#000' : '#fff',
            transition: 'all 0.3s ease'
          }}
        >
          {filtro === 'night' ? 'ON NIGHT' : 'SETTIMANA'}
        </button>
      </div>

      {/* Mappa */}
      <MapContainer
        center={[43.7696, 11.2558]}
        zoom={15}
        style={{ height: '100%', width: '100%', background: '#1a1a2e' }}
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
              radius={filtro === 'night' ? 10 : 8}
              pathOptions={{
                color: getDotColor(locale),
                fillColor: getDotFill(locale),
                fillOpacity: 0.9,
                weight: getDotWeight(locale)
              }}
              eventHandlers={{
                click: function() { selezionaLocale(locale) }
              }}
            />
          )
        })}
      </MapContainer>

      {/* Indicatore filtro attivo */}
      {filtro === 'night' && (
        <div style={{
          position: 'absolute', bottom: pannelloAperto ? 'auto' : '20px',
          top: pannelloAperto ? 'auto' : 'auto',
          left: '50%', transform: 'translateX(-50%)',
          zIndex: 999, background: 'rgba(255,215,0,0.15)',
          border: '1px solid #FFD700', borderRadius: '20px',
          padding: '6px 16px', fontSize: '12px', color: '#FFD700',
          display: pannelloAperto ? 'none' : 'block'
        }}>
          Locali aperti ora - {getGiornoOggi()}
        </div>
      )}

      {/* Prima tendina - Locale */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        zIndex: 1000,
        background: '#1a1a2e',
        borderRadius: '20px 20px 0 0',
        maxHeight: '55vh',
        transform: pannelloAperto ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflowY: 'auto',
        color: '#fff',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
        WebkitOverflowScrolling: 'touch'
      }}>
        {selezionato && (
          <div style={{ padding: '16px 20px 20px 20px' }}>
            <div
              onClick={chiudiPannello}
              style={{
                width: '36px', height: '4px', background: '#555',
                borderRadius: '2px', margin: '0 auto 14px auto', cursor: 'pointer'
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              {selezionato.logo_url && selezionato.logo_url.length > 0 && (
                <img src={selezionato.logo_url} alt={selezionato.nome} style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
              )}
              <div>
                <h2 style={{ margin: '0 0 2px 0', fontSize: '20px', fontWeight: 700 }}>
                  {selezionato.nome}
                </h2>
                <p style={{ margin: 0, color: '#aaa', fontSize: '13px' }}>
                  {selezionato.indirizzo}
                </p>
              </div>
            </div>

            <p style={{ margin: '0 0 16px 0', color: '#b3b3b3', fontSize: '13px', lineHeight: '1.4' }}>
              {selezionato.descrizione}
            </p>

            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 600, color: '#ff4444', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Eventi della settimana
            </h3>

            {selezionato.eventi.map(function(evento, i) {
              return (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: getEventBorder(i, selezionato.eventi.length)
                }}>
                  <div
                    onClick={function() { apriEvento(evento) }}
                    style={{ cursor: 'pointer', flex: 1 }}
                  >
                    <div style={{ fontSize: '15px', fontWeight: 500 }}>{evento.nome}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                      {evento.giorno} - {evento.orario}
                    </div>
                  </div>
                  <div
                    onClick={function() { apriEvento(evento) }}
                    style={{
                      background: '#ff0000', color: '#fff', padding: '4px 12px',
                      borderRadius: '12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    {evento.prezzo}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Seconda tendina - Evento (Spotify style) */}
      <div style={{
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0,
        zIndex: 1100,
        background: 'linear-gradient(180deg, #282828 0%, #121212 40%)',
        transform: eventoAperto ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        overflowY: 'auto',
        color: '#fff',
        WebkitOverflowScrolling: 'touch'
      }}>
        {eventoAperto && (
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
            {/* Top bar con freccia */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', flexShrink: 0
            }}>
              <div
                onClick={chiudiEvento}
                style={{
                  width: '36px', height: '36px', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: '22px', color: '#fff'
                }}
              >
                &#8964;
              </div>
              <div style={{ fontSize: '12px', color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {hasLogo ? '' : (selezionato ? selezionato.nome : '')}
              </div>
              <div style={{ width: '36px' }}></div>
            </div>

            {/* Logo organizzazione centrato */}
            {hasLogo && (
              <div style={{ textAlign: 'center', padding: '0 20px 12px 20px' }}>
                <img
                  src={selezionato.logo_url}
                  alt={selezionato.nome}
                  style={{ height: '40px', objectFit: 'contain', opacity: 0.9 }}
                />
              </div>
            )}

            {/* Locandina */}
            <div style={{ padding: '0 32px', flexShrink: 0 }}>
              {hasEventImage ? (
                <img
                  src={eventoAperto.immagine_url}
                  alt={eventoAperto.nome}
                  style={{
                    width: '100%', borderRadius: '8px',
                    aspectRatio: '1/1', objectFit: 'cover', display: 'block',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                  }}
                />
              ) : (
                <div style={{
                  width: '100%', borderRadius: '8px',
                  aspectRatio: '1/1', background: '#333',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '80px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                }}>
                  🎵
                </div>
              )}
            </div>

            {/* Info evento */}
            <div style={{ padding: '24px 32px', flex: 1 }}>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: 700 }}>
                {eventoAperto.nome}
              </h2>

              {hasFrase && (
                <p style={{ margin: '0 0 16px 0', color: '#b3b3b3', fontSize: '15px' }}>
                  {eventoAperto.frase}
                </p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: '#b3b3b3', fontSize: '14px' }}>
                <span>{eventoAperto.giorno}</span>
                <span style={{ color: '#555' }}>|</span>
                <span>{eventoAperto.orario}</span>
              </div>

              <div style={{
                display: 'inline-block', background: '#ff0000', padding: '10px 32px',
                borderRadius: '24px', fontSize: '16px', fontWeight: 700
              }}>
                {eventoAperto.prezzo}
              </div>

              {/* Audio player Spotify style */}
              {hasAudio && (
                <div style={{ marginTop: '28px' }}>
                  <audio
                    ref={audioRefState}
                    src={eventoAperto.audio_url}
                    preload="auto"
                    onEnded={function() { setPlaying(false) }}
                  />
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '16px'
                  }}>
                    <div
                      onClick={toggleAudio}
                      style={{
                        width: '48px', height: '48px', borderRadius: '50%',
                        background: '#1DB954', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                        boxShadow: '0 4px 12px rgba(29,185,84,0.3)'
                      }}
                    >
                      <span style={{ fontSize: '20px', color: '#000', marginLeft: playing ? '0' : '2px' }}>
                        {playing ? 'II' : '\u25B6'}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500 }}>Ascolta il sound</div>
                      <div style={{ fontSize: '12px', color: '#888' }}>
                        {playing ? 'In riproduzione...' : 'Tocca per riprodurre'}
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