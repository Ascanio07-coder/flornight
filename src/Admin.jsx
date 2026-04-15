import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

function Admin() {
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

  var errState = useState('')
  var errore = errState[0]
  var setErrore = errState[1]

  var localiState = useState([])
  var locali = localiState[0]
  var setLocali = localiState[1]

  var eventiState = useState([])
  var eventi = eventiState[0]
  var setEventi = eventiState[1]

  var staffListState = useState([])
  var staffList = staffListState[0]
  var setStaffList = staffListState[1]

  var utentiListState = useState([])
  var utentiList = utentiListState[0]
  var setUtentiList = utentiListState[1]

  var analyticsState = useState([])
  var analytics = analyticsState[0]
  var setAnalytics = analyticsState[1]

  var selState = useState(null)
  var localeSelezionato = selState[0]
  var setLocaleSelezionato = selState[1]

  var tabState = useState('locali')
  var tab = tabState[0]
  var setTab = tabState[1]

  var s1 = useState(''); var nomeLocale = s1[0]; var setNomeLocale = s1[1]
  var s2 = useState(''); var indirizzoLocale = s2[0]; var setIndirizzoLocale = s2[1]
  var s3 = useState(''); var descrizioneLocale = s3[0]; var setDescrizioneLocale = s3[1]
  var s4 = useState(''); var latLocale = s4[0]; var setLatLocale = s4[1]
  var s5 = useState(''); var lngLocale = s5[0]; var setLngLocale = s5[1]
  var s6 = useState(''); var logoLocale = s6[0]; var setLogoLocale = s6[1]

  var s7 = useState(''); var nomeEvento = s7[0]; var setNomeEvento = s7[1]
  var s8 = useState('Lunedi'); var giornoEvento = s8[0]; var setGiornoEvento = s8[1]
  var s9 = useState(''); var orarioEvento = s9[0]; var setOrarioEvento = s9[1]
  var s10 = useState(''); var prezzoEvento = s10[0]; var setPrezzoEvento = s10[1]
  var s11 = useState(''); var immagineEvento = s11[0]; var setImmagineEvento = s11[1]
  var s12 = useState(''); var audioEvento = s12[0]; var setAudioEvento = s12[1]
  var s13 = useState(''); var fraseEvento = s13[0]; var setFraseEvento = s13[1]

  var s14 = useState(''); var staffEmail = s14[0]; var setStaffEmail = s14[1]
  var s15 = useState(''); var staffPassword = s15[0]; var setStaffPassword = s15[1]
  var s16 = useState(''); var staffNome = s16[0]; var setStaffNome = s16[1]
  var s17 = useState(''); var staffLocaleId = s17[0]; var setStaffLocaleId = s17[1]

  useEffect(function() {
    supabase.auth.getSession().then(function(res) {
      if (res.data.session) {
        setUser(res.data.session.user)
        verificaAdmin(res.data.session.user.id)
      }
    })
  }, [setUser, verificaAdmin])

  var verificaAdmin = useCallback(function(userId) {
    supabase.from('staff').select('*').eq('user_id', userId).eq('ruolo', 'admin').single().then(function(res) {
      if (res.data) {
        setStaffInfo(res.data)
        caricaDati()
      } else {
        setErrore('Non hai i permessi di admin.')
      }
    })
  }, [setStaffInfo, setErrore, caricaDati])

  function login() {
    setErrore('')
    supabase.auth.signInWithPassword({ email: email, password: pass }).then(function(res) {
      if (res.error) {
        setErrore('Email o password errati')
      } else {
        setUser(res.data.user)
        verificaAdmin(res.data.user.id)
      }
    })
  }

  function logout() {
    supabase.auth.signOut().then(function() {
      setUser(null)
      setStaffInfo(null)
      setLocali([])
      setEventi([])
      setStaffList([])
      setUtentiList([])
      setAnalytics([])
    })
  }

  var caricaDati = useCallback(function() {
    supabase.from('locali').select('*').order('id').then(function(res) {
      setLocali(res.data || [])
    })
    supabase.from('eventi').select('*').order('id').then(function(res) {
      setEventi(res.data || [])
    })
    supabase.from('staff').select('*').order('id').then(function(res) {
      setStaffList(res.data || [])
    })
    supabase.from('utenti').select('*').order('created_at', { ascending: false }).then(function(res) {
      setUtentiList(res.data || [])
    })
  }, [setLocali, setEventi, setStaffList, setUtentiList])

  function caricaAnalytics() {
    supabase.from('analytics').select('*').order('timestamp', { ascending: false }).limit(500).then(function(res) {
      setAnalytics(res.data || [])
    })
  }

  function aggiungiLocale() {
    supabase.from('locali').insert({
      nome: nomeLocale,
      indirizzo: indirizzoLocale,
      descrizione: descrizioneLocale,
      lat: parseFloat(latLocale),
      lng: parseFloat(lngLocale),
      logo_url: logoLocale || null
    }).then(function(res) {
      if (res.error) { alert('Errore: ' + res.error.message); return }
      setNomeLocale(''); setIndirizzoLocale(''); setDescrizioneLocale('')
      setLatLocale(''); setLngLocale(''); setLogoLocale('')
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
      audio_url: audioEvento || null,
      frase: fraseEvento || null
    }).then(function(res) {
      if (res.error) { alert('Errore: ' + res.error.message); return }
      setNomeEvento(''); setOrarioEvento(''); setPrezzoEvento('')
      setImmagineEvento(''); setAudioEvento(''); setFraseEvento('')
      caricaDati()
    })
  }

  function eliminaEvento(id) {
    if (!window.confirm('Eliminare questo evento?')) return
    supabase.from('eventi').delete().eq('id', id).then(function() {
      caricaDati()
    })
  }

  function creaStaff() {
    if (!staffEmail || !staffPassword || !staffNome || !staffLocaleId) {
      alert('Compila tutti i campi')
      return
    }
    supabase.auth.signUp({
      email: staffEmail,
      password: staffPassword
    }).then(function(res) {
      if (res.error) {
        alert('Errore creazione utente: ' + res.error.message)
        return
      }
      var userId = res.data.user.id
      supabase.from('staff').insert({
        user_id: userId,
        locale_id: parseInt(staffLocaleId),
        nome: staffNome,
        ruolo: 'proprietario'
      }).then(function(res2) {
        if (res2.error) {
          alert('Errore collegamento staff: ' + res2.error.message)
          return
        }
        alert('Proprietario creato! Email: ' + staffEmail + ' Password: ' + staffPassword)
        setStaffEmail(''); setStaffPassword(''); setStaffNome(''); setStaffLocaleId('')
        supabase.auth.signOut().then(function() {
          supabase.auth.signInWithPassword({ email: email, password: pass }).then(function(loginRes) {
            setUser(loginRes.data.user)
            verificaAdmin(loginRes.data.user.id)
          })
        })
      })
    })
  }

  function eliminaStaff(staffId) {
    if (!window.confirm('Eliminare questo staff?')) return
    supabase.from('staff').delete().eq('id', staffId).then(function() {
      caricaDati()
    })
  }

  function getNomeLocale(localeId) {
    var found = locali.filter(function(l) { return l.id === localeId })
    if (found.length > 0) return found[0].nome
    return 'Sconosciuto'
  }

  function getRuoloLabel(ruolo) {
    if (ruolo === 'admin') return 'Admin'
    if (ruolo === 'proprietario') return 'Proprietario'
    if (ruolo === 'organizzatore') return 'Organizzatore'
    return ruolo
  }

  var inputStyle = { width: '100%', padding: '10px', marginBottom: '8px', borderRadius: '8px', border: '1px solid #444', background: '#222', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }

  if (!user || !staffInfo) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', color: '#fff', background: '#111', minHeight: '100vh' }}>
        <h1 style={{ textAlign: 'center', letterSpacing: '3px', marginBottom: '30px' }}>FLORNIGHT ADMIN</h1>
        {errore && <p style={{ color: '#ff4444', fontSize: '14px', margin: '0 0 8px 0', textAlign: 'center' }}>{errore}</p>}
        <input type="email" placeholder="Email" value={email} onChange={function(e) { setEmail(e.target.value) }} style={inputStyle} />
        <input type="password" placeholder="Password" value={pass} onChange={function(e) { setPass(e.target.value) }} onKeyDown={function(e) { if (e.key === 'Enter') login() }} style={inputStyle} />
        <button onClick={login} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, background: '#ff0000', color: '#fff', width: '100%', marginTop: '8px' }}>Accedi</button>
        {user && !staffInfo && (
          <button onClick={logout} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, background: '#333', color: '#fff', width: '100%', marginTop: '8px' }}>Esci</button>
        )}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', color: '#fff', background: '#111', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1 style={{ letterSpacing: '3px', fontSize: '20px', margin: 0 }}>ADMIN</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a href="/" style={{ color: '#aaa', fontSize: '14px' }}>Mappa</a>
          <button onClick={logout} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', background: '#333', color: '#fff' }}>Esci</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button onClick={function() { setTab('locali') }} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, background: tab === 'locali' ? '#ff0000' : '#333', color: '#fff' }}>Locali</button>
        <button onClick={function() { setTab('staff') }} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, background: tab === 'staff' ? '#ff0000' : '#333', color: '#fff' }}>Staff</button>
        <button onClick={function() { setTab('analytics'); caricaAnalytics() }} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, background: tab === 'analytics' ? '#ff0000' : '#333', color: '#fff' }}>Dati</button>
      </div>

      {tab === 'locali' && (
        <div>
          {locali.map(function(l) {
            return (
              <div key={l.id} style={{ background: '#1a1a2e', borderRadius: '12px', padding: '14px', marginBottom: '10px', border: localeSelezionato === l.id ? '1px solid #ff0000' : '1px solid transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div onClick={function() { setLocaleSelezionato(localeSelezionato === l.id ? null : l.id) }} style={{ cursor: 'pointer', flex: 1 }}>
                    <strong>{l.nome}</strong>
                    <div style={{ fontSize: '13px', color: '#aaa' }}>{l.indirizzo}</div>
                  </div>
                  <button onClick={function() { eliminaLocale(l.id) }} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: '#333', color: '#ff4444' }}>Elimina</button>
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
                      <input placeholder="Orario" value={orarioEvento} onChange={function(e) { setOrarioEvento(e.target.value) }} style={inputStyle} />
                      <input placeholder="Prezzo" value={prezzoEvento} onChange={function(e) { setPrezzoEvento(e.target.value) }} style={inputStyle} />
                      <input placeholder="Frase (opz.)" value={fraseEvento} onChange={function(e) { setFraseEvento(e.target.value) }} style={inputStyle} />
                      <input placeholder="URL locandina (opz.)" value={immagineEvento} onChange={function(e) { setImmagineEvento(e.target.value) }} style={inputStyle} />
                      <input placeholder="URL canzone (opz.)" value={audioEvento} onChange={function(e) { setAudioEvento(e.target.value) }} style={inputStyle} />
                      <button onClick={aggiungiEvento} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, background: '#ff0000', color: '#fff' }}>+ Aggiungi evento</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          <div style={{ background: '#1a1a2e', borderRadius: '12px', padding: '14px', marginTop: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>Aggiungi locale</h3>
            <input placeholder="Nome" value={nomeLocale} onChange={function(e) { setNomeLocale(e.target.value) }} style={inputStyle} />
            <input placeholder="Indirizzo" value={indirizzoLocale} onChange={function(e) { setIndirizzoLocale(e.target.value) }} style={inputStyle} />
            <input placeholder="Descrizione" value={descrizioneLocale} onChange={function(e) { setDescrizioneLocale(e.target.value) }} style={inputStyle} />
            <input placeholder="Latitudine" value={latLocale} onChange={function(e) { setLatLocale(e.target.value) }} style={inputStyle} />
            <input placeholder="Longitudine" value={lngLocale} onChange={function(e) { setLngLocale(e.target.value) }} style={inputStyle} />
            <input placeholder="URL logo (opz.)" value={logoLocale} onChange={function(e) { setLogoLocale(e.target.value) }} style={inputStyle} />
            <button onClick={aggiungiLocale} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, background: '#ff0000', color: '#fff' }}>+ Aggiungi locale</button>
          </div>
        </div>
      )}

      {tab === 'staff' && (
        <div>
          <h3 style={{ color: '#ff4444', fontSize: '14px', letterSpacing: '1px', marginBottom: '10px', marginTop: 0 }}>STAFF</h3>
          {staffList.filter(function(s) { return s.ruolo !== 'admin' }).map(function(s) {
            return (
              <div key={s.id} style={{ background: '#1a1a2e', borderRadius: '12px', padding: '14px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{s.nome}</strong>
                  <div style={{ fontSize: '13px', color: '#aaa' }}>{getNomeLocale(s.locale_id)} - {getRuoloLabel(s.ruolo)}</div>
                </div>
                <button onClick={function() { eliminaStaff(s.id) }} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: '#333', color: '#ff4444' }}>Elimina</button>
              </div>
            )
          })}
          <div style={{ background: '#1a1a2e', borderRadius: '12px', padding: '14px', marginTop: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>Crea proprietario</h3>
            <input placeholder="Nome" value={staffNome} onChange={function(e) { setStaffNome(e.target.value) }} style={inputStyle} />
            <input placeholder="Email" value={staffEmail} onChange={function(e) { setStaffEmail(e.target.value) }} style={inputStyle} />
            <input placeholder="Password" value={staffPassword} onChange={function(e) { setStaffPassword(e.target.value) }} style={inputStyle} />
            <select value={staffLocaleId} onChange={function(e) { setStaffLocaleId(e.target.value) }} style={inputStyle}>
              <option value="">-- Seleziona locale --</option>
              {locali.map(function(l) {
                return <option key={l.id} value={l.id}>{l.nome}</option>
              })}
            </select>
            <button onClick={creaStaff} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, background: '#ff0000', color: '#fff', width: '100%' }}>+ Crea proprietario</button>
          </div>

          <h3 style={{ color: '#ff4444', fontSize: '14px', letterSpacing: '1px', marginTop: '30px', marginBottom: '10px' }}>UTENTI REGISTRATI ({utentiList.length})</h3>
          {utentiList.length === 0 && <p style={{ color: '#aaa', fontSize: '13px' }}>Nessun utente registrato.</p>}
          {utentiList.map(function(u) {
            var dataIscr = u.created_at ? new Date(u.created_at).toLocaleDateString('it-IT') : ''
            return (
              <div key={u.user_id} style={{ background: '#1a1a2e', borderRadius: '12px', padding: '14px', marginBottom: '10px' }}>
                <strong>{u.nome || '(senza nome)'}</strong>
                <div style={{ fontSize: '13px', color: '#aaa' }}>{u.email}</div>
                {dataIscr && <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Iscritto il {dataIscr}</div>}
              </div>
            )
          })}
        </div>
      )}

      {tab === 'analytics' && (
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <div style={{ background: '#1a1a2e', borderRadius: '12px', padding: '14px', flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 700 }}>{analytics.filter(function(a) { return a.tipo === 'view_locale' }).length}</div>
              <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>Locali visti</div>
            </div>
            <div style={{ background: '#1a1a2e', borderRadius: '12px', padding: '14px', flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 700 }}>{analytics.filter(function(a) { return a.tipo === 'view_evento' }).length}</div>
              <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>Eventi visti</div>
            </div>
          </div>

          <h3 style={{ fontSize: '14px', color: '#aaa', marginBottom: '10px' }}>Classifica locali</h3>
          {locali.map(function(l) {
            var visite = analytics.filter(function(a) { return a.locale_id === l.id }).length
            return (
              <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #222' }}>
                <span style={{ fontSize: '14px' }}>{l.nome}</span>
                <span style={{ fontSize: '14px', color: '#ff4444', fontWeight: 600 }}>{visite}</span>
              </div>
            )
          })}

          <h3 style={{ fontSize: '14px', color: '#aaa', marginTop: '20px', marginBottom: '10px' }}>Ultime azioni</h3>
          {analytics.slice(0, 20).map(function(a, i) {
            var nomeL = getNomeLocale(a.locale_id)
            var data = new Date(a.timestamp)
            var ora = data.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1a1a2e', fontSize: '13px' }}>
                <span style={{ color: '#aaa' }}>{a.tipo === 'view_locale' ? 'Locale' : 'Evento'} - {nomeL}</span>
                <span style={{ color: '#555' }}>{ora}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Admin