import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from './supabase'

const firenzeBounds = [
  [43.7270, 11.1540],
  [43.8130, 11.3300],
]

function App() {
  const [locali, setLocali] = useState([])
  const [selezionato, setSelezionato] = useState(null)

  useEffect(() => {
    async function caricaDati() {
      const { data: localiData } = await supabase.from('locali').select('*')
      const { data: eventiData } = await supabase.from('eventi').select('*')

      const localiConEventi = localiData.map(locale => ({
        ...locale,
        eventi: eventiData.filter(e => e.locale_id === locale.id)
      }))

      setLocali(localiConEventi)
    }
    caricaDati()
  }, [])

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        zIndex: 1000, background: 'rgba(0,0,0,0.85)',
        padding: '8px', textAlign: 'center'
      }}>
        <h1 style={{ color: '#fff', margin: 0, fontSize: '24px', letterSpacing: '4px', fontWeight: 300 }}>
  FLORNIGHT
</h1>
      </div>

      <MapContainer
        center={[43.7696, 11.2558]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        maxBounds={firenzeBounds}
        maxBoundsViscosity={1.0}
        minZoom={13}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CARTO'
        />
        {locali.map(locale => (
          <CircleMarker
            key={locale.id}
            center={[locale.lat, locale.lng]}
            radius={8}
            pathOptions={{
              color: selezionato?.id === locale.id ? '#ffffff' : '#ff0000',
              fillColor: '#ff0000',
              fillOpacity: 0.9,
              weight: selezionato?.id === locale.id ? 3 : 2
            }}
            eventHandlers={{
              click: () => setSelezionato(locale)
            }}
          />
        ))}
      </MapContainer>

      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        zIndex: 1000,
        background: '#1a1a2e',
        borderRadius: '20px 20px 0 0',
        transform: selezionato ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s ease',
        maxHeight: '60vh',
        overflowY: 'auto',
        color: '#fff',
      }}>
        {selezionato && (
          <div style={{ padding: '20px' }}>
            <div
              onClick={() => setSelezionato(null)}
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
            {selezionato.eventi.map((evento, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 0',
                borderBottom: i < selezionato.eventi.length - 1 ? '1px solid #333' : 'none'
              }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 500 }}>{evento.nome}</div>
                  <div style={{ fontSize: '13px', color: '#aaa', marginTop: '2px' }}>
                    {evento.giorno} · {evento.orario}
                  </div>
                </div>
                <div style={{
                  background: '#ff0000', color: '#fff', padding: '4px 12px',
                  borderRadius: '12px', fontSize: '13px', fontWeight: 600
                }}>
                  {evento.prezzo}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default App