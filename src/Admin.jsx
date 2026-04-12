import { useState, useEffect } from 'react'
import { supabase } from './supabase'

var ADMIN_PASSWORD = 'flornight2026'

function Admin() {
  var autenticatoState = useState(false)
  var autenticato = autenticatoState[0]
  var setAutenticato = autenticatoState[1]

  var passwordState = useState('')
  var password = passwordState[0]
  var setPassword = passwordState[1]

  var localiState = useState([])
  var locali = localiState[0]
  var setLocali = localiState[1]

  var eventiState = useState([])
  var eventi = eventiState[0]
  var setEventi = eventiState[1]

  var selState = useState(null)
  var localeSelezionato = selState[0]
  var setLocaleSelezionato = selState[1]

  var s1 = useState(''); var nomeLocale = s1[0]; var setNomeLocale = s1[1]
  var s2 = useState(''); var indirizzoLocale = s2[0]; var setIndirizzoLocale = s2[1]
  var s3 = useState(''); var descrizioneLocale = s3[0]; var setDescrizioneLocale = s3[1]
  var s4 = useState(''); var latLocale = s4[0]; var setLatLocale = s4[1]
  var s5 = useState(''); var lngLocale = s5[0]; var setLngLocale = s5[1]

  var s6 = useState(''); var nomeEvento = s6[0]; var setNomeEvento = s6[1]
  var s7 = useState('Lunedi'); var giornoEvento = s7[0]; var setGiornoEvento = s7[1]
  var s8 = useState(''); var orarioEvento = s8[0]; var setOrarioEvento = s8[1]
  var s9 = useState(''); var prezzoEvento = s9[0]; var setPrezzoEvento = s9[1]
  var s10 = useState(''); var immagineEvento = s10[0]; var setImmagineEvento = s10[1]
  var s11 = useState(''); var audioEvento = s11[0]; var setAudioEvento = s11[1]

  useEffect(function() {
    if (autenticato) caricaDati()
  }, [autenticato])

  function caricaDati() {
    supabase.from('locali').select('*').order('id').then(function(res) {
      setLocali(res.data || [])
    })
    supabase.from('eventi').select('*').order('id').then(function(res) {
      setEventi(res.data || [])
    })
  }

  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      setAutenticato(true)
    } else {
      alert('Password errata')
    }
  }

  function aggiungiLocale() {
    supabase.from('locali').insert({
      nome: nomeLocale,
      indirizzo: indirizzoLocale,
      descrizione: descrizioneLocale,
      lat: parseFloat(latLocale),
      lng: parseFloat(lngLocale)
    }).then(function(res) {
      if (res.error) { alert('Errore: ' + res.error.message); return }
      setNomeLocale(''); setIndirizzoLocale(''); setDescrizioneLocale('')
      setLatLocale(''); setLngLocale('')
      caricaDati()
    })
  }

  function eliminaLocale(id) {
    if (!window.confirm('Eliminare questo locale e tutti i suoi eventi?')) return
    supabase.from('locali').delete().eq('id', id).then(function() {
      if (localeSelezionato === id) setLocaleSelezionato(null)
      caricaDati()
    })
  }

  function aggiungiEvento() {
    supabase.from('eventi').insert({
      locale_id: localeSelezionato,
      nome: nomeEvento,
      giorno: giornoEvento,
      orario: orarioEvento,
      prezzo: prezzoEvento,
      immagine_url: immagineEvento || null,
      audio_url: audioEvento || null
    }).then(function(res) {
      if (res.error) { alert('Errore: ' + res.error.message); return }
      setNomeEvento(''); setOrarioEvento(''); setPrezzoEvento('')
      setImmagineEvento(''); setAudioEvento('')
      caricaDati()
    })
  }

  function eliminaEvento(id) {
    if (!window.confirm('Eliminare questo evento?')) return
    supabase.from('eventi').delete().eq('id', id).then(function() {
      caricaDati()
    })
  }

  var inputStyle = { width: '100%', padding: '10px', marginBottom: '8px', borderRadius: '8px', border: '1px solid #444', background: '#222', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }
  var cardStyle = { background: '#1a1a2e', borderRadius: '12px', padding: '14px', marginBottom: '10px' }
  var btnStyle = { padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }

  if (!autenticato) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', color: '#fff', background: '#111', minHeight: '100vh' }}>
        <h1 style={{ textAlign: 'center', letterSpacing: '3px', marginBottom: '30px' }}>FLORNIGHT ADMIN</h1>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={function(e) { setPassword(e.target.value) }}
          onKeyDown={function(e) { if (e.key === 'Enter') handleLogin() }}
          style={inputStyle}
        />
        <button onClick={handleLogin} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, background: '#ff0000', color: '#fff', width: '100%', marginTop: '8px' }}>
          Accedi
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', color: '#fff', background: '#111', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ letterSpacing: '3px', fontSize: '20px', margin: 0 }}>FLORNIGHT ADMIN</h1>
        <a href="/" style={{ color: '#aaa', fontSize: '14px' }}>Mappa</a>
      </div>

      <h2 style={{ color: '#ff4444', fontSize: '16px', letterSpacing: '1px', marginBottom: '12px' }}>LOCALI</h2>

      {locali.map(function(l) {
        return (
          <div key={l.id} style={{ background: '#1a1a2e', borderRadius: '12px', padding: '14px', marginBottom: '10px', border: localeSelezionato === l.id ? '1px solid #ff0000' : '1px solid transparent' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div
                onClick={function() { setLocaleSelezionato(localeSelezionato === l.id ? null : l.id) }}
                style={{ cursor: 'pointer', flex: 1 }}
              >
                <strong>{l.nome}</strong>
                <div style={{ fontSize: '13px', color: '#aaa' }}>{l.indirizzo}</div>
              </div>
              <button onClick={function() { eliminaLocale(l.id) }} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: '#333', color: '#ff4444' }}>
                Elimina
              </button>
            </div>

            {localeSelezionato === l.id && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #333' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#ff4444' }}>Eventi</h4>
                {eventi.filter(function(e) { return e.locale_id === l.id }).map(function(ev) {
                  return (
                    <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                      <span style={{ fontSize: '14px' }}>{ev.giorno} - {ev.nome} ({ev.orario}) {ev.prezzo}</span>
                      <button onClick={function() { eliminaEvento(ev.id) }} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '16px' }}>X</button>
                    </div>
                  )
                })}

                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <input placeholder="Nome evento" value={nomeEvento} onChange={function(e) { setNomeEvento(e.target.value) }} style={inputStyle} />
                  <select value={giornoEvento} onChange={function(e) { setGiornoEvento(e.target.value) }} style={inputStyle}>
                    <option value="Lunedi">Lunedi</option>
                    <option value="Martedi">Martedi</option>
                    <option value="Mercoledi">Mercoledi</option>
                    <option value="Giovedi">Giovedi</option>
                    <option value="Venerdi">Venerdi</option>
                    <option value="Sabato">Sabato</option>
                    <option value="Domenica">Domenica</option>
                  </select>
                  <input placeholder="Orario (es. 23:00 - 04:00)" value={orarioEvento} onChange={function(e) { setOrarioEvento(e.target.value) }} style={inputStyle} />
                  <input placeholder="Prezzo (es. 15 euro)" value={prezzoEvento} onChange={function(e) { setPrezzoEvento(e.target.value) }} style={inputStyle} />
                  <input placeholder="URL locandina (opzionale)" value={immagineEvento} onChange={function(e) { setImmagineEvento(e.target.value) }} style={inputStyle} />
                  <input placeholder="URL canzone (opzionale)" value={audioEvento} onChange={function(e) { setAudioEvento(e.target.value) }} style={inputStyle} />
                  <button onClick={aggiungiEvento} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, background: '#ff0000', color: '#fff' }}>
                    + Aggiungi evento
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}

      <div style={{ background: '#1a1a2e', borderRadius: '12px', padding: '14px', marginTop: '20px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>Aggiungi nuovo locale</h3>
        <input placeholder="Nome" value={nomeLocale} onChange={function(e) { setNomeLocale(e.target.value) }} style={inputStyle} />
        <input placeholder="Indirizzo" value={indirizzoLocale} onChange={function(e) { setIndirizzoLocale(e.target.value) }} style={inputStyle} />
        <input placeholder="Descrizione" value={descrizioneLocale} onChange={function(e) { setDescrizioneLocale(e.target.value) }} style={inputStyle} />
        <input placeholder="Latitudine (es. 43.7700)" value={latLocale} onChange={function(e) { setLatLocale(e.target.value) }} style={inputStyle} />
        <input placeholder="Longitudine (es. 11.2550)" value={lngLocale} onChange={function(e) { setLngLocale(e.target.value) }} style={inputStyle} />
        <button onClick={aggiungiLocale} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, background: '#ff0000', color: '#fff' }}>
          + Aggiungi locale
        </button>
      </div>
    </div>
  )
}

export default Admin