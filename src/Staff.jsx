import { useState, useEffect } from 'react'
import { supabase } from './supabase'

function Staff() {
  var emailState = useState('')
  var email = emailState[0]
  var setEmail = emailState[1]

  var passState = useState('')
  var pass = passState[0]
  var setPass = passState[1]

  var userState = useState(null)
  var user = userState[0]
  var setUser = userState[1]

  var staffState = useState(null)
  var staffInfo = staffState[0]
  var setStaffInfo = staffState[1]

  var localeState = useState(null)
  var locale = localeState[0]
  var setLocale = localeState[1]

  var eventiState = useState([])
  var eventi = eventiState[0]
  var setEventi = eventiState[1]

  var errState = useState('')
  var errore = errState[0]
  var setErrore = errState[1]

  var s1 = useState(''); var nomeEvento = s1[0]; var setNomeEvento = s1[1]
  var s2 = useState('Lunedi'); var giornoEvento = s2[0]; var setGiornoEvento = s2[1]
  var s3 = useState(''); var orarioEvento = s3[0]; var setOrarioEvento = s3[1]
  var s4 = useState(''); var prezzoEvento = s4[0]; var setPrezzoEvento = s4[1]
  var s5 = useState(''); var immagineEvento = s5[0]; var setImmagineEvento = s5[1]
  var s6 = useState(''); var audioEvento = s6[0]; var setAudioEvento = s6[1]
  var s7 = useState(''); var fraseEvento = s7[0]; var setFraseEvento = s7[1]

  useEffect(function() {
    supabase.auth.getSession().then(function(res) {
      if (res.data.session) {
        setUser(res.data.session.user)
        caricaStaff(res.data.session.user.id)
      }
    })
  }, [])

  function caricaStaff(userId) {
    supabase.from('staff').select('*').eq('user_id', userId).single().then(function(res) {
      if (res.data) {
        setStaffInfo(res.data)
        caricaLocale(res.data.locale_id)
        caricaEventi(res.data.locale_id)
      } else {
        setErrore('Il tuo account non e associato a nessun locale.')
      }
    })
  }

  function caricaLocale(localeId) {
    supabase.from('locali').select('*').eq('id', localeId).single().then(function(res) {
      if (res.data) setLocale(res.data)
    })
  }

  function caricaEventi(localeId) {
    supabase.from('eventi').select('*').eq('locale_id', localeId).order('id').then(function(res) {
      setEventi(res.data || [])
    })
  }

  function login() {
    setErrore('')
    supabase.auth.signInWithPassword({ email: email, password: pass }).then(function(res) {
      if (res.error) {
        setErrore('Email o password errati')
      } else {
        setUser(res.data.user)
        caricaStaff(res.data.user.id)
      }
    })
  }

  function logout() {
    supabase.auth.signOut().then(function() {
      setUser(null)
      setStaffInfo(null)
      setLocale(null)
      setEventi([])
    })
  }

  function aggiungiEvento() {
    supabase.from('eventi').insert({
      locale_id: staffInfo.locale_id,
      nome: nomeEvento,
      giorno: giornoEvento,
      orario: orarioEvento,
      prezzo: prezzoEvento,
      immagine_url: immagineEvento || null,
      audio_url: audioEvento || null,
      frase: fraseEvento || null
    }).then(function(res) {
      if (res.error) { setErrore('Errore: ' + res.error.message); return }
      setNomeEvento(''); setOrarioEvento(''); setPrezzoEvento('')
      setImmagineEvento(''); setAudioEvento(''); setFraseEvento('')
      caricaEventi(staffInfo.locale_id)
    })
  }

  function eliminaEvento(id) {
    if (!window.confirm('Eliminare questo evento?')) return
    supabase.from('eventi').delete().eq('id', id).then(function() {
      caricaEventi(staffInfo.locale_id)
    })
  }

  var inputStyle = { width: '100%', padding: '10px', marginBottom: '8px', borderRadius: '8px', border: '1px solid #444', background: '#222', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }

  if (!user) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', color: '#fff', background: '#111', minHeight: '100vh' }}>
        <h1 style={{ textAlign: 'center', letterSpacing: '3px', marginBottom: '30px' }}>FLORNIGHT STAFF</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={function(e) { setEmail(e.target.value) }}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Password"
          value={pass}
          onChange={function(e) { setPass(e.target.value) }}
          onKeyDown={function(e) { if (e.key === 'Enter') login() }}
          style={inputStyle}
        />
        {errore && (
          <p style={{ color: '#ff4444', fontSize: '14px', margin: '0 0 8px 0' }}>{errore}</p>
        )}
        <button onClick={login} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, background: '#ff0000', color: '#fff', width: '100%', marginTop: '8px' }}>
          Accedi
        </button>
      </div>
    )
  }

  if (!staffInfo || !locale) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', color: '#fff', background: '#111', minHeight: '100vh' }}>
        <h1 style={{ textAlign: 'center', letterSpacing: '3px', marginBottom: '30px' }}>FLORNIGHT STAFF</h1>
        <p style={{ textAlign: 'center', color: '#aaa' }}>{errore || 'Caricamento...'}</p>
        <button onClick={logout} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, background: '#333', color: '#fff', width: '100%', marginTop: '16px' }}>
          Esci
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', color: '#fff', background: '#111', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ letterSpacing: '3px', fontSize: '20px', margin: 0 }}>STAFF</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a href="/" style={{ color: '#aaa', fontSize: '14px' }}>Mappa</a>
          <button onClick={logout} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', background: '#333', color: '#fff' }}>
            Esci
          </button>
        </div>
      </div>

      <div style={{ background: '#1a1a2e', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>{locale.nome}</h2>
        <p style={{ margin: 0, color: '#aaa', fontSize: '13px' }}>{locale.indirizzo}</p>
        <p style={{ margin: '4px 0 0 0', color: '#888', fontSize: '12px' }}>Staff: {staffInfo.nome}</p>
      </div>

      <h3 style={{ color: '#ff4444', fontSize: '16px', letterSpacing: '1px', marginBottom: '12px' }}>EVENTI</h3>

      {eventi.map(function(ev) {
        return (
          <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #333' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{ev.nome}</div>
              <div style={{ fontSize: '12px', color: '#aaa' }}>{ev.giorno} - {ev.orario} - {ev.prezzo}</div>
            </div>
            <button onClick={function() { eliminaEvento(ev.id) }} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '16px' }}>X</button>
          </div>
        )
      })}

      <div style={{ background: '#1a1a2e', borderRadius: '12px', padding: '14px', marginTop: '20px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>Aggiungi evento</h3>
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
        <input placeholder="Frase breve (es. La notte che...)" value={fraseEvento} onChange={function(e) { setFraseEvento(e.target.value) }} style={inputStyle} />
        <input placeholder="URL locandina (opzionale)" value={immagineEvento} onChange={function(e) { setImmagineEvento(e.target.value) }} style={inputStyle} />
        <input placeholder="URL canzone (opzionale)" value={audioEvento} onChange={function(e) { setAudioEvento(e.target.value) }} style={inputStyle} />
        <button onClick={aggiungiEvento} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, background: '#ff0000', color: '#fff', width: '100%' }}>
          + Aggiungi evento
        </button>
      </div>
    </div>
  )
}

export default Staff