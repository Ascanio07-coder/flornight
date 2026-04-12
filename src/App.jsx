import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from './supabase'

var firenzeBounds = [
  [43.7270, 11.1540],
  [43.8130, 11.3300]
]

function App() {
  var localiState = useState([])
  var locali = localiState[0]
  var setLocali = localiState[1]

  var selState = useState(null)
  var selezionato = selState[0]
  var setSelezionato = selState[1]

  var aperto = useState(false)
  var pannelloAperto = aperto[0]
  var setPannelloAperto = aperto[1]

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
            eventi: evs.filter(function(e) { return e.locale_id === locale.id })
          }
        })
        setLocali(risultato)
      })
    })
  }, [])

  function selezionaLocale(locale) {
    setSelezionato(locale)
    setPannelloAperto(true)
  }

  function chiudiPannello() {
    setPannelloAperto(false)
    setSelezionato(null)
  }

  function vaiAEvento(eventoId) {
    window.location.href = '/evento/' + eventoId
  }

  function getBorderColor(locale) {
    if (selezionato && selezionato.id === locale.id) return '#ffffff'
    return '#ff0000'
  }

  function getBorderWeight(locale) {
    if (selezionato && selezionato.id === locale.id) return 3
    return 2
  }

  function getEventBorder(i, totale) {
    if (i < totale - 1) return '1px solid #333'
    return 'none'
  }

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative', overflow: 'hidden', background: '#1a1a2e' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        zIndex: 1000, background: 'rgba(0,0,0,0.85)',
        padding: '12px', textAlign: 'center'
      }}>
        <h1 style={{ color: '#fff', margin: 0, fontSize: '24px', letterSpacing: '4px', fontWeight: 300 }}>
          FLORNIGHT
        </h1>
      </div>

      <MapContainer
        center={[43.7696, 11.2558]}
        zoom={15}
        style={{ height: '100%', width: '100%', background: '#1a1a2e' }}
        maxBounds={firenzeBounds}
        maxBoundsViscosity={1.0}
        minZoom={13}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="OpenStreetMap CARTO"
        />
        {locali.map(function(locale) {
          return (
            <CircleMarker
              key={locale.id}
              center={[locale.lat, locale.lng]}
              radius={8}
              pathOptions={{
                color: getBorderColor(locale),
                fillColor: '#ff0000',
                fillOpacity: 0.9,
                weight: getBorderWeight(locale)
              }}
              eventHandlers={{
                click: function() { selezionaLocale(locale) }
              }}
            />
          )
        })}
      </MapContainer>

      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        zIndex: 1000,
        background: '#1a1a2e',
        borderRadius: '20px 20px 0 0',
        maxHeight: '60vh',
        transform: pannelloAperto ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s ease',
        overflowY: 'auto',
        color: '#fff'
      }}>
        {selezionato && (
          <div style={{ padding: '20px' }}>
            <div
              onClick={chiudiPannello}
              style={{
                width: '40px', height: '4px', background: '#555',
                borderRadius: '2px', margin: '0 auto 16px auto', cursor: 'pointer'
              }}
            />

            <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: 600 }}>
              {selezionato.nome}
            </h2>
            <p style={{ margin: '0 0 8px 0', color: '#aaa', fontSize: '14px' }}>
              {selezionato.indirizzo}
            </p>
            <p style={{ margin: '0 0 20px 0', color: '#ccc', fontSize: '14px', lineHeight: '1.4' }}>
              {selezionato.descrizione}
            </p>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 500, color: '#ff4444', letterSpacing: '1px' }}>
              EVENTI DELLA SETTIMANA
            </h3>
            {selezionato.eventi.map(function(evento, i) {
              return (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: getEventBorder(i, selezionato.eventi.length)
                }}>
                  <div
                    onClick={function() { vaiAEvento(evento.id) }}
                    style={{ cursor: 'pointer', flex: 1 }}
                  >
                    <div style={{ fontSize: '15px', fontWeight: 500 }}>{evento.nome}</div>
                    <div style={{ fontSize: '13px', color: '#aaa', marginTop: '2px' }}>
                      {evento.giorno} - {evento.orario}
                    </div>
                  </div>
                  <div style={{
                    background: '#ff0000', color: '#fff', padding: '4px 12px',
                    borderRadius: '12px', fontSize: '13px', fontWeight: 600
                  }}>
                    {evento.prezzo}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default App