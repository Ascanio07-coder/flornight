import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from './supabase'

function Evento() {
  var params = useParams()
  var id = params.id
  var navigate = useNavigate()

  var evState = useState(null)
  var evento = evState[0]
  var setEvento = evState[1]

  var locState = useState(null)
  var locale = locState[0]
  var setLocale = locState[1]

  var playState = useState(false)
  var playing = playState[0]
  var setPlaying = playState[1]

  var audioRef = useRef(null)

  useEffect(function() {
    supabase.from('eventi').select('*').eq('id', id).single().then(function(res) {
      if (res.data) {
        setEvento(res.data)
        supabase.from('locali').select('*').eq('id', res.data.locale_id).single().then(function(res2) {
          setLocale(res2.data)
        })
      }
    })
  }, [id])

  function toggleAudio() {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
    } else {
      audioRef.current.play().then(function() {
        setPlaying(true)
      }).catch(function() {
        setPlaying(false)
      })
    }
  }

  if (!evento) {
    return (
      <div style={{ background: '#111', color: '#fff', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Caricamento...
      </div>
    )
  }

  var hasImage = evento.immagine_url && evento.immagine_url.length > 0
  var hasAudio = evento.audio_url && evento.audio_url.length > 0

  return (
    <div style={{
      background: '#111', color: '#fff', minHeight: '100vh',
      fontFamily: 'sans-serif', position: 'relative'
    }}>
      <div
        onClick={function() { navigate('/') }}
        style={{
          position: 'absolute', top: '16px', left: '16px', zIndex: 10,
          background: 'rgba(0,0,0,0.6)', borderRadius: '50%',
          width: '40px', height: '40px', display: 'flex',
          alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          fontSize: '20px', color: '#fff'
        }}
      >
        ←
      </div>

      {hasImage ? (
        <img
          src={evento.immagine_url}
          alt={evento.nome}
          style={{ width: '100%', height: '60vh', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{
          width: '100%', height: '40vh', background: '#1a1a2e',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '60px'
        }}>
          🎵
        </div>
      )}

      <div style={{ padding: '24px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 700 }}>
          {evento.nome}
        </h1>
        {locale && (
          <p style={{ margin: '0 0 4px 0', color: '#ff4444', fontSize: '16px', fontWeight: 500 }}>
            {locale.nome}
          </p>
        )}
        {locale && (
          <p style={{ margin: '0 0 16px 0', color: '#aaa', fontSize: '14px' }}>
            {locale.indirizzo}
          </p>
        )}

        <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', fontSize: '15px', color: '#ccc' }}>
          <div>{evento.giorno}</div>
          <div>{evento.orario}</div>
        </div>

        <div style={{
          display: 'inline-block', background: '#ff0000', padding: '8px 24px',
          borderRadius: '20px', fontSize: '18px', fontWeight: 600,
          marginBottom: '24px'
        }}>
          {evento.prezzo}
        </div>

        {hasAudio && (
          <div style={{ marginTop: '16px' }}>
            <audio ref={audioRef} src={evento.audio_url} preload="auto" onEnded={function() { setPlaying(false) }} />
            <div
              onClick={toggleAudio}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                background: '#1a1a2e', borderRadius: '16px', padding: '16px',
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: '50px', height: '50px', borderRadius: '50%',
                background: '#ff0000', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '24px', flexShrink: 0
              }}>
                {playing ? 'II' : '\u25B6'}
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 500 }}>Ascolta il sound</div>
                <div style={{ fontSize: '13px', color: '#aaa' }}>Tocca per riprodurre</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Evento