import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const ADMIN_PASSWORD = 'flornight2026'

function Admin() {
  const [autenticato, setAutenticato] = useState(false)
  const [password, setPassword] = useState('')
  const [locali, setLocali] = useState([])
  const [eventi, setEventi] = useState([])
  const [localeSelezionato, setLocaleSelezionato] = useState(null)

  const [nomeLocale, setNomeLocale] = useState('')
  const [indirizzoLocale, setIndirizzoLocale] = useState('')
  const [descrizioneLocale, setDescrizioneLocale] = useState('')
  const [latLocale, setLatLocale] = useState('')
  const [lngLocale, setLngLocale] = useState('')

  const [nomeEvento, setNomeEvento] = useState('')
  const [giornoEvento, setGiornoEvento] = useState('Lunedì')
  const [orarioEvento, setOrarioEvento] = useState('')
  const [prezzoEvento, setPrezzoEvento] = useState('')

  useEffect(() => {
    if (autenticato) caricaDati()
  }, [autenticato])

  async function caricaDati() {
    const { data: l } = await supabase.from('locali').select('*').order('id')
    const { data: e } = await supabase.from('eventi').select('*').order('id')
    setLocali(l || [])
    setEventi(e || [])
  }

  function handleLogin(e) {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setAutenticato(true)
    } else {
      alert('Password errata')
    }
  }

  async function aggiungiLocale(e) {
    e.preventDefault()
    const { error } = await supabase.from('locali').insert({
      nome: nomeLocale,
      indirizzo: indirizzoLocale,
      descrizione: descrizioneLocale,
      lat: parseFloat(latLocale),
      lng: parseFloat(lngLocale),
    })
    if (error) { alert('Errore: ' + error.message); return }
    setNomeLocale(''); setIndirizzoLocale(''); setDescrizioneLocale('')
    setLatLocale(''); setLngLocale('')
    caricaDati()
  }

  async function eliminaLocale(id) {
    if (!window.confirm('Eliminare questo locale e tutti i suoi eventi?')) return
    await supabase.from('locali').delete().eq('id', id)
    if (localeSelezionato === id) setLocaleSelezionato(null)
    caricaDati()
  }

  async function aggiungiEvento(e) {
    e.preventDefault()
    const { error } = await supabase.from('eventi').insert({
      locale_id: localeSelezionato,
      nome: nomeEvento,
      giorno: giornoEvento,
      orario: orarioEvento,
      prezzo: prezzoEvento,
    })
    if (error) { alert('Errore: ' + error.message); return }
    setNomeEvento(''); setOrarioEvento(''); setPrezzoEvento('')
    caricaDati()
  }

  async function eliminaEvento(id) {
    if (!window.confirm('Eliminare questo evento?')) return
    await supabase.from('eventi').delete().eq('id', id)
    caricaDati()
  }

  const stile = {
    container: { maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', color: '#fff', background: '#111', minHeight: '100vh' },
    input: { width: '100%', padding: '10px', marginBottom: '8px', borderRadius: '8px', border: '1px solid #444', background: '#222', color: '#fff', fontSize: '14px', boxSizing: 'border-box' },
    button: { padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600 },
    card: { background: '#1a1a2e', borderRadius: '12px', padding: '14px', marginBottom: '10px' },
  }

  if (!autenticato) {
    return (
      <div style={stile.container}>
        <h1 style={{ textAlign: 'center', letterSpacing: '3px', marginBottom: '30px' }}>FLORNIGHT ADMIN</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleLogin(e) }}
            style={stile.input}
          />
          <button onClick={handleLogin} style={{ ...stile.button, background: '#ff0000', color: '#fff' }}>
            Accedi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={stile.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ letterSpacing: '3px', fontSize: '20px', margin: 0 }}>FLORNIGHT ADMIN</h1>
        <a href="/" style={{ color: '#aaa', fontSize: '14px' }}>← Mappa</a>
      </div>

      <h2 style={{ color: '#ff4444', fontSize: '16px', letterSpacing: '1px', marginBottom: '12px' }}>LOCALI</h2>

      {locali.map(l => (
        <div key={l.id} style={{ ...stile.card, border: localeSelezionato === l.id ? '1px solid #ff0000' : '1px solid transparent' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div
              onClick={() => setLocaleSelezionato(localeSelezionato === l.id ? null : l.id)}
              style={{ cursor: 'pointer', flex: 1 }}
            >
              <strong>{l.nome}</strong>
              <div style={{ fontSize: '13px', color: '#aaa' }}>{l.indirizzo}</div>
            </div>
            <button onClick={() => eliminaLocale(l.id)} style={{ ...stile.button, background: '#333', color: '#ff4444', padding: '6px 12px', fontSize: '12px' }}>
              Elimina
            </button>
          </div>

          {localeSelezionato === l.id && (
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #333' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#ff4444' }}>Eventi</h4>
              {eventi.filter(e => e.locale_id === l.id).map(ev => (
                <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                  <span style={{ fontSize: '14px' }}>{ev.giorno} — {ev.nome} ({ev.orario}) {ev.prezzo}</span>
                  <button onClick={() => eliminaEvento(ev.id)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                </div>
              ))}

              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input placeholder="Nome evento" value={nomeEvento} onChange={e => setNomeEvento(e.target.value)} style={stile.input} />
                <select value={giornoEvento} onChange={e => setGiornoEvento(e.target.value)} style={stile.input}>
                  {['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'].map(g =>
                    <option key={g} value={g}>{g}</option>
                  )}
                </select>
                <input placeholder="Orario (es. 23:00 - 04:00)" value={orarioEvento} onChange={e => setOrarioEvento(e.target.value)} style={stile.input} />
                <input placeholder="Prezzo (es. 15€)" value={prezzoEvento} onChange={e => setPrezzoEvento(e.target.value)} style={stile.input} />
                <button onClick={aggiungiEvento} style={{ ...stile.button, background: '#ff0000', color: '#fff' }}>
                  + Aggiungi evento
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      <div style={{ ...stile.card, marginTop: '20px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>Aggiungi nuovo locale</h3>
        <input placeholder="Nome" value={nomeLocale} onChange={e => setNomeLocale(e.target.value)} style={stile.input} />
        <input placeholder="Indirizzo" value={indirizzoLocale} onChange={e => setIndirizzoLocale(e.target.value)} style={stile.input} />
        <input placeholder="Descrizione" value={descrizioneLocale} onChange={e => setDescrizioneLocale(e.target.value)} style={stile.input} />
        <input placeholder="Latitudine (es. 43.7700)" value={latLocale} onChange={e => setLatLocale(e.target.value)} style={stile.input} />
        <input placeholder="Longitudine (es. 11.2550)" value={lngLocale} onChange={e => setLngLocale(e.target.value)} style={stile.input} />
        <button onClick={aggiungiLocale} style={{ ...stile.button, background: '#ff0000', color: '#fff' }}>
          + Aggiungi locale
        </button>
      </div>
    </div>
  )
}

export default Admin