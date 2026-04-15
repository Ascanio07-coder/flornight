import { useState, useEffect, useRef, useCallback } from 'react'
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

  var orgState = useState([])
  var organizzatori = orgState[0]
  var setOrganizzatori = orgState[1]

  var errState = useState('')
  var errore = errState[0]
  var setErrore = errState[1]

  var loadState = useState(false)
  var caricando = loadState[0]
  var setCaricando = loadState[1]

  var n1 = useState(''); var nomeEvento = n1[0]; var setNomeEvento = n1[1]
  var n3 = useState(''); var orarioEvento = n3[0]; var setOrarioEvento = n3[1]
  var n4 = useState(''); var prezzoEvento = n4[0]; var setPrezzoEvento = n4[1]
  var n5 = useState(''); var dataEvento = n5[0]; var setDataEvento = n5[1]

  var n6 = useState(''); var orgEmail = n6[0]; var setOrgEmail = n6[1]
  var n7 = useState(''); var orgPassword = n7[0]; var setOrgPassword = n7[1]
  var n8 = useState(''); var orgNome = n8[0]; var setOrgNome = n8[1]

  var n9 = useState(''); var fraseEvento = n9[0]; var setFraseEvento = n9[1]

  var editState = useState(null)
  var eventoEdit = editState[0]
  var setEventoEdit = editState[1]

  var imgRef = useRef(null)
  var audioFileRef = useRef(null)

  useEffect(function() {
    supabase.auth.getSession().then(function(res) {
      if (res.data.session) {
        setUser(res.data.session.user)
        caricaStaff(res.data.session.user.id)
      }
    })
  }, [setUser, caricaStaff])

  var caricaStaff = useCallback(function(userId) {
    supabase.from('staff').select('*').eq('user_id', userId).single().then(function(res) {
      if (res.data) {
        setStaffInfo(res.data)
        caricaLocale(res.data.locale_id)
        if (res.data.ruolo === 'proprietario') {
          caricaEventi(res.data.locale_id)
          caricaOrganizzatori(res.data.locale_id)
        } else {
          caricaEventiOrganizzatore(res.data.id)
        }
      } else {
        setErrore('Il tuo account non e associato a nessun locale.')
      }
    })
  }, [setStaffInfo, setErrore, caricaLocale, caricaEventi, caricaOrganizzatori, caricaEventiOrganizzatore])

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

  function caricaEventiOrganizzatore(staffId) {
    supabase.from('eventi').select('*').eq('organizzatore_id', staffId).order('id').then(function(res) {
      setEventi(res.data || [])
    })
  }

  function caricaOrganizzatori(localeId) {
    supabase.from('staff').select('*').eq('locale_id', localeId).eq('ruolo', 'organizzatore').order('id').then(function(res) {
      setOrganizzatori(res.data || [])
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
      setOrganizzatori([])
    })
  }

  function giornoDaData(dateStr) {
    if (!dateStr) return null
    var parti = dateStr.split('-')
    var d = new Date(parseInt(parti[0]), parseInt(parti[1]) - 1, parseInt(parti[2]))
    var giorni = ['Domenica', 'Lunedi', 'Martedi', 'Mercoledi', 'Giovedi', 'Venerdi', 'Sabato']
    return giorni[d.getDay()]
  }

  function aggiungiEvento() {
    if (!dataEvento) {
      setErrore('Seleziona la data dell\'evento')
      return
    }
    setErrore('')
    supabase.from('eventi').insert({
      locale_id: staffInfo.locale_id,
      nome: nomeEvento,
      giorno: giornoDaData(dataEvento),
      orario: orarioEvento,
      prezzo: prezzoEvento,
      data_evento: dataEvento,
      immagine_url: null,
      audio_url: null,
      frase: null,
      organizzatore_id: null
    }).then(function(res) {
      if (res.error) { setErrore('Errore: ' + res.error.message); return }
      setNomeEvento(''); setOrarioEvento(''); setPrezzoEvento(''); setDataEvento('')
      caricaEventi(staffInfo.locale_id)
    })
  }

  function eliminaEvento(id) {
    if (!window.confirm('Eliminare questo evento?')) return
    supabase.from('eventi').delete().eq('id', id).then(function() {
      if (staffInfo.ruolo === 'proprietario') {
        caricaEventi(staffInfo.locale_id)
      } else {
        caricaEventiOrganizzatore(staffInfo.id)
      }
    })
  }

  function assegnaOrganizzatore(eventoId, orgId) {
    var valore = orgId === '' ? null : parseInt(orgId)
    supabase.from('eventi').update({ organizzatore_id: valore }).eq('id', eventoId).then(function() {
      caricaEventi(staffInfo.locale_id)
    })
  }

  function creaOrganizzatore() {
    if (!orgEmail || !orgPassword || !orgNome) {
      alert('Compila tutti i campi')
      return
    }
    supabase.auth.signUp({
      email: orgEmail,
      password: orgPassword
    }).then(function(res) {
      if (res.error) {
        alert('Errore: ' + res.error.message)
        return
      }
      var userId = res.data.user.id
      supabase.from('staff').insert({
        user_id: userId,
        locale_id: staffInfo.locale_id,
        nome: orgNome,
        ruolo: 'organizzatore'
      }).then(function(res2) {
        if (res2.error) {
          alert('Errore: ' + res2.error.message)
          return
        }
        alert('Organizzatore creato! Email: ' + orgEmail + ' Password: ' + orgPassword)
        setOrgEmail(''); setOrgPassword(''); setOrgNome('')
        supabase.auth.signOut().then(function() {
          supabase.auth.signInWithPassword({ email: email, password: pass }).then(function() {
            caricaOrganizzatori(staffInfo.locale_id)
          })
        })
      })
    })
  }

  function eliminaOrganizzatore(orgId) {
    if (!window.confirm('Eliminare questo organizzatore?')) return
    supabase.from('eventi').update({ organizzatore_id: null }).eq('organizzatore_id', orgId).then(function() {
      supabase.from('staff').delete().eq('id', orgId).then(function() {
        caricaOrganizzatori(staffInfo.locale_id)
        caricaEventi(staffInfo.locale_id)
      })
    })
  }

  function caricaLogo() {
    var fileInput = document.getElementById('logoInput')
    var file = fileInput && fileInput.files[0]
    if (!file) { alert('Seleziona un file'); return }
    var timestamp = Date.now()
    var nomeFile = staffInfo.locale_id + '_logo_' + timestamp + '_' + file.name
    supabase.storage.from('locandine').upload(nomeFile, file).then(function(res) {
      if (res.error) { alert('Errore upload: ' + res.error.message); return }
      var urlRes = supabase.storage.from('locandine').getPublicUrl(nomeFile)
      var logoUrl = urlRes.data.publicUrl
      supabase.from('locali').update({ logo_url: logoUrl }).eq('id', staffInfo.locale_id).then(function(res2) {
        if (res2.error) { alert('Errore: ' + res2.error.message); return }
        caricaLocale(staffInfo.locale_id)
        alert('Logo aggiornato!')
      })
    })
  }

  function iniziaModifica(evento) {
    setEventoEdit(evento.id)
    setFraseEvento(evento.frase || '')
  }

  function uploadFile(file, bucket, eventoId) {
    var timestamp = Date.now()
    var nomeFile = eventoId + '_' + timestamp + '_' + file.name
    return supabase.storage.from(bucket).upload(nomeFile, file).then(function(res) {
      if (res.error) {
        alert('Errore upload: ' + res.error.message)
        return null
      }
      var urlRes = supabase.storage.from(bucket).getPublicUrl(nomeFile)
      return urlRes.data.publicUrl
    })
  }

  function salvaModifica(eventoId) {
    setCaricando(true)
    var imgFile = imgRef.current && imgRef.current.files[0]
    var audFile = audioFileRef.current && audioFileRef.current.files[0]

    var imgPromise = imgFile ? uploadFile(imgFile, 'locandine', eventoId) : Promise.resolve(null)
    var audPromise = audFile ? uploadFile(audFile, 'audio', eventoId) : Promise.resolve(null)

    imgPromise.then(function(imgUrl) {
      audPromise.then(function(audUrl) {
        var aggiornamento = { frase: fraseEvento || null }
        if (imgUrl) aggiornamento.immagine_url = imgUrl
        if (audUrl) aggiornamento.audio_url = audUrl

        supabase.from('eventi').update(aggiornamento).eq('id', eventoId).then(function(res) {
          setCaricando(false)
          if (res.error) { alert('Errore: ' + res.error.message); return }
          setEventoEdit(null)
          setFraseEvento('')
          if (imgRef.current) imgRef.current.value = ''
          if (audioFileRef.current) audioFileRef.current.value = ''
          if (staffInfo.ruolo === 'proprietario') {
            caricaEventi(staffInfo.locale_id)
          } else {
            caricaEventiOrganizzatore(staffInfo.id)
          }
        })
      })
    })
  }

  function getNomeOrg(orgId) {
    if (!orgId) return 'Nessuno'
    var found = organizzatori.filter(function(o) { return o.id === orgId })
    if (found.length > 0) return found[0].nome
    return 'Sconosciuto'
  }

  function formatData(d) {
    if (!d) return ''
    var parti = d.split('-')
    return parti[2] + '/' + parti[1] + '/' + parti[0]
  }

  var inputStyle = { width: '100%', padding: '10px', marginBottom: '8px', borderRadius: '8px', border: '1px solid #444', background: '#222', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }

  if (!user) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', color: '#fff', background: '#111', minHeight: '100vh' }}>
        <h1 style={{ textAlign: 'center', letterSpacing: '3px', marginBottom: '30px' }}>FLORNIGHT STAFF</h1>
        <input type="email" placeholder="Email" value={email} onChange={function(e) { setEmail(e.target.value) }} style={inputStyle} />
        <input type="password" placeholder="Password" value={pass} onChange={function(e) { setPass(e.target.value) }} onKeyDown={function(e) { if (e.key === 'Enter') login() }} style={inputStyle} />
        {errore && <p style={{ color: '#ff4444', fontSize: '14px', margin: '0 0 8px 0' }}>{errore}</p>}
        <button onClick={login} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, background: '#ff0000', color: '#fff', width: '100%', marginTop: '8px' }}>Accedi</button>
      </div>
    )
  }

  if (!staffInfo || !locale) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', color: '#fff', background: '#111', minHeight: '100vh' }}>
        <h1 style={{ textAlign: 'center', letterSpacing: '3px', marginBottom: '30px' }}>FLORNIGHT STAFF</h1>
        <p style={{ textAlign: 'center', color: '#aaa' }}>{errore || 'Caricamento...'}</p>
        <button onClick={logout} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, background: '#333', color: '#fff', width: '100%', marginTop: '16px' }}>Esci</button>
      </div>
    )
  }

  if (staffInfo.ruolo === 'organizzatore') {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', color: '#fff', background: '#111', minHeight: '100vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ letterSpacing: '3px', fontSize: '20px', margin: 0 }}>ORGANIZZATORE</h1>
          <button onClick={logout} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', background: '#333', color: '#fff' }}>Esci</button>
        </div>

        <div style={{ background: '#1a1a2e', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>{locale.nome}</h2>
          <p style={{ margin: 0, color: '#aaa', fontSize: '13px' }}>{staffInfo.nome}</p>
        </div>

        <h3 style={{ color: '#ff4444', fontSize: '16px', letterSpacing: '1px', marginBottom: '12px' }}>I TUOI EVENTI</h3>

        {eventi.length === 0 && <p style={{ color: '#aaa', fontSize: '14px' }}>Nessun evento assegnato.</p>}

        {eventi.map(function(ev) {
          return (
            <div key={ev.id} style={{ background: '#1a1a2e', borderRadius: '12px', padding: '14px', marginBottom: '10px' }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>{ev.nome}</strong>
                <div style={{ fontSize: '13px', color: '#aaa' }}>{ev.giorno} - {ev.orario} - {ev.prezzo}</div>
                {ev.data_evento && <div style={{ fontSize: '12px', color: '#888' }}>{formatData(ev.data_evento)}</div>}
              </div>

              {eventoEdit === ev.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #333' }}>
                  <label style={{ fontSize: '13px', color: '#aaa' }}>Locandina (immagine)</label>
                  <input type="file" accept="image/*" ref={imgRef} style={inputStyle} />
                  <label style={{ fontSize: '13px', color: '#aaa' }}>Frase breve</label>
                  <input placeholder="La notte che non dimenticherai..." value={fraseEvento} onChange={function(e) { setFraseEvento(e.target.value) }} style={inputStyle} />
                  <label style={{ fontSize: '13px', color: '#aaa' }}>Canzone (audio)</label>
                  <input type="file" accept="audio/*" ref={audioFileRef} style={inputStyle} />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button onClick={function() { salvaModifica(ev.id) }} disabled={caricando} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, background: caricando ? '#666' : '#ff0000', color: '#fff', flex: 1 }}>
                      {caricando ? 'Caricamento...' : 'Salva'}
                    </button>
                    <button onClick={function() { setEventoEdit(null) }} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, background: '#333', color: '#fff', flex: 1 }}>Annulla</button>
                  </div>
                </div>
              ) : (
                <div>
                  {ev.immagine_url && <div style={{ fontSize: '12px', color: '#4a4' }}>Locandina inserita</div>}
                  {ev.frase && <div style={{ fontSize: '12px', color: '#4a4' }}>Frase: {ev.frase}</div>}
                  {ev.audio_url && <div style={{ fontSize: '12px', color: '#4a4' }}>Audio inserito</div>}
                  <button onClick={function() { iniziaModifica(ev) }} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: '#333', color: '#fff', marginTop: '8px' }}>Modifica contenuti</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', color: '#fff', background: '#111', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ letterSpacing: '3px', fontSize: '20px', margin: 0 }}>PROPRIETARIO</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a href="/" style={{ color: '#aaa', fontSize: '14px' }}>Mappa</a>
          <button onClick={logout} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', background: '#333', color: '#fff' }}>Esci</button>
        </div>
      </div>

      <div style={{ background: '#1a1a2e', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          {locale.logo_url ? (
            <img src={locale.logo_url} alt={locale.nome} style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '50px', height: '50px', borderRadius: '8px', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>?</div>
          )}
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>{locale.nome}</h2>
            <p style={{ margin: 0, color: '#aaa', fontSize: '13px' }}>{locale.indirizzo}</p>
          </div>
        </div>
        <label style={{ fontSize: '13px', color: '#aaa' }}>Cambia logo del locale</label>
        <input type="file" accept="image/*" id="logoInput" style={{ width: '100%', padding: '10px', marginBottom: '4px', marginTop: '4px', borderRadius: '8px', border: '1px solid #444', background: '#222', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }} />
        <button onClick={function() { caricaLogo() }} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: '#ff0000', color: '#fff' }}>Carica logo</button>
      </div>

      <h3 style={{ color: '#ff4444', fontSize: '16px', letterSpacing: '1px', marginBottom: '12px' }}>CALENDARIO EVENTI</h3>

      {eventi.map(function(ev) {
        return (
          <div key={ev.id} style={{ background: '#1a1a2e', borderRadius: '12px', padding: '14px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{ev.nome}</strong>
                <div style={{ fontSize: '13px', color: '#aaa' }}>{ev.giorno} - {ev.orario} - {ev.prezzo}</div>
                {ev.data_evento && <div style={{ fontSize: '12px', color: '#888' }}>{formatData(ev.data_evento)}</div>}
                <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>Organizzatore: {getNomeOrg(ev.organizzatore_id)}</div>
              </div>
              <button onClick={function() { eliminaEvento(ev.id) }} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '16px' }}>X</button>
            </div>
            <div style={{ marginTop: '8px' }}>
              <select value={ev.organizzatore_id || ''} onChange={function(e) { assegnaOrganizzatore(ev.id, e.target.value) }} style={inputStyle}>
                <option value="">-- Nessun organizzatore --</option>
                {organizzatori.map(function(o) {
                  return <option key={o.id} value={o.id}>{o.nome}</option>
                })}
              </select>
            </div>

            {eventoEdit === ev.id ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #333' }}>
                <label style={{ fontSize: '13px', color: '#aaa' }}>Locandina (immagine)</label>
                {ev.immagine_url && <a href={ev.immagine_url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#4a4' }}>Vedi locandina attuale</a>}
                <input type="file" accept="image/*" ref={imgRef} style={inputStyle} />
                <label style={{ fontSize: '13px', color: '#aaa' }}>Frase breve</label>
                <input placeholder="La notte che non dimenticherai..." value={fraseEvento} onChange={function(e) { setFraseEvento(e.target.value) }} style={inputStyle} />
                <label style={{ fontSize: '13px', color: '#aaa' }}>Canzone (audio)</label>
                {ev.audio_url && <a href={ev.audio_url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#4a4' }}>Ascolta audio attuale</a>}
                <input type="file" accept="audio/*" ref={audioFileRef} style={inputStyle} />
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button onClick={function() { salvaModifica(ev.id) }} disabled={caricando} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, background: caricando ? '#666' : '#ff0000', color: '#fff', flex: 1 }}>
                    {caricando ? 'Caricamento...' : 'Salva'}
                  </button>
                  <button onClick={function() { setEventoEdit(null) }} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, background: '#333', color: '#fff', flex: 1 }}>Annulla</button>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #333' }}>
                {ev.immagine_url ? (
                  <a href={ev.immagine_url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#4a4', display: 'block' }}>Locandina: vedi file</a>
                ) : (
                  <div style={{ fontSize: '12px', color: '#666' }}>Locandina: non inserita</div>
                )}
                {ev.frase ? (
                  <div style={{ fontSize: '12px', color: '#4a4' }}>Frase: {ev.frase}</div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#666' }}>Frase: non inserita</div>
                )}
                {ev.audio_url ? (
                  <a href={ev.audio_url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#4a4', display: 'block' }}>Audio: ascolta file</a>
                ) : (
                  <div style={{ fontSize: '12px', color: '#666' }}>Audio: non inserito</div>
                )}
                <button onClick={function() { iniziaModifica(ev) }} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: '#333', color: '#fff', marginTop: '8px' }}>Modifica contenuti</button>
              </div>
            )}
          </div>
        )
      })}

      <div style={{ background: '#1a1a2e', borderRadius: '12px', padding: '14px', marginTop: '10px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>Aggiungi evento</h3>
        <input placeholder="Nome evento" value={nomeEvento} onChange={function(e) { setNomeEvento(e.target.value) }} style={inputStyle} />
        <input placeholder="Orario (es. 23:00 - 04:00)" value={orarioEvento} onChange={function(e) { setOrarioEvento(e.target.value) }} style={inputStyle} />
        <input placeholder="Prezzo (es. 15 euro)" value={prezzoEvento} onChange={function(e) { setPrezzoEvento(e.target.value) }} style={inputStyle} />
        <label style={{ fontSize: '13px', color: '#aaa', marginBottom: '4px', display: 'block' }}>Data evento</label>
        <input type="date" value={dataEvento} onChange={function(e) { setDataEvento(e.target.value) }} style={inputStyle} />
        {dataEvento && <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>Giorno: {giornoDaData(dataEvento)}</div>}
        {errore && <p style={{ color: '#ff4444', fontSize: '13px', margin: '4px 0 8px 0' }}>{errore}</p>}
        <button onClick={aggiungiEvento} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, background: '#ff0000', color: '#fff', width: '100%' }}>+ Aggiungi evento</button>
      </div>

      <h3 style={{ color: '#ff4444', fontSize: '16px', letterSpacing: '1px', marginTop: '30px', marginBottom: '12px' }}>ORGANIZZATORI</h3>

      {organizzatori.map(function(o) {
        return (
          <div key={o.id} style={{ background: '#1a1a2e', borderRadius: '12px', padding: '14px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>{o.nome}</strong>
            <button onClick={function() { eliminaOrganizzatore(o.id) }} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: '#333', color: '#ff4444' }}>Elimina</button>
          </div>
        )
      })}

      <div style={{ background: '#1a1a2e', borderRadius: '12px', padding: '14px', marginTop: '10px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>Crea organizzatore</h3>
        <input placeholder="Nome (es. DJ Marco)" value={orgNome} onChange={function(e) { setOrgNome(e.target.value) }} style={inputStyle} />
        <input placeholder="Email" value={orgEmail} onChange={function(e) { setOrgEmail(e.target.value) }} style={inputStyle} />
        <input placeholder="Password" value={orgPassword} onChange={function(e) { setOrgPassword(e.target.value) }} style={inputStyle} />
        <button onClick={creaOrganizzatore} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, background: '#ff0000', color: '#fff', width: '100%' }}>+ Crea organizzatore</button>
      </div>
    </div>
  )
}

export default Staff