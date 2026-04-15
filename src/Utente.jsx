import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import { validateSignupForm } from './lib/validators.js'

function Utente() {
  var emailState = useState('')
  var email = emailState[0]
  var setEmail = emailState[1]

  var passState = useState('')
  var pass = passState[0]
  var setPass = passState[1]

  var nomeState = useState('')
  var nome = nomeState[0]
  var setNome = nomeState[1]

  var userState = useState(null)
  var user = userState[0]
  var setUser = userState[1]

  var profiloState = useState(null)
  var profilo = profiloState[0]
  var setProfilo = profiloState[1]

  var errState = useState('')
  var errore = errState[0]
  var setErrore = errState[1]

  var msgState = useState('')
  var messaggio = msgState[0]
  var setMessaggio = msgState[1]

  var modeState = useState('login')
  var mode = modeState[0]
  var setMode = modeState[1]

  useEffect(function() {
    supabase.auth.getSession().then(function(res) {
      if (res.data.session) {
        setUser(res.data.session.user)
        caricaProfilo(res.data.session.user.id)
      }
    })
  }, [setUser, caricaProfilo])

  var caricaProfilo = useCallback(function(userId) {
    supabase.from('utenti').select('*').eq('user_id', userId).single().then(function(res) {
      if (res.data) setProfilo(res.data)
    })
  }, [setProfilo])

  function login() {
    setErrore('')
    setMessaggio('')
    supabase.auth.signInWithPassword({ email: email, password: pass }).then(function(res) {
      if (res.error) {
        setErrore('Email o password errati')
      } else {
        setUser(res.data.user)
        caricaProfilo(res.data.user.id)
      }
    })
  }

  function registrati() {
    setErrore('')
    setMessaggio('')
    var validationError = validateSignupForm({ email: email, pass: pass, nome: nome })
    if (validationError) {
      setErrore(validationError)
      return
    }
    supabase.auth.signUp({ email: email, password: pass }).then(function(res) {
      if (res.error) {
        setErrore('Errore: ' + res.error.message)
        return
      }
      var userId = res.data.user.id
      supabase.from('utenti').insert({
        user_id: userId,
        nome: nome,
        email: email
      }).then(function(res2) {
        if (res2.error) {
          setErrore('Errore salvataggio profilo: ' + res2.error.message)
          return
        }
        setUser(res.data.user)
        caricaProfilo(userId)
      })
    })
  }

  function logout() {
    supabase.auth.signOut().then(function() {
      setUser(null)
      setProfilo(null)
      setEmail('')
      setPass('')
      setNome('')
    })
  }

  var inputStyle = { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '10px', border: '1px solid #333', background: '#1a1a1a', color: '#fff', fontSize: '15px', boxSizing: 'border-box' }

  // Se loggato, mostra profilo
  if (user && profilo) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: '-apple-system, sans-serif', color: '#fff', background: '#111', minHeight: '100vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ letterSpacing: '3px', fontSize: '20px', margin: 0 }}>PROFILO</h1>
          <a href="/" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', textDecoration: 'none' }}>Mappa</a>
        </div>

        <div style={{ background: '#1a1a2e', borderRadius: '16px', padding: '24px', marginBottom: '20px', textAlign: 'center' }}>
          <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#282828', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px auto', color: 'rgba(255,255,255,0.5)' }}>
            {profilo.nome ? profilo.nome.charAt(0).toUpperCase() : '?'}
          </div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 600 }}>{profilo.nome}</h2>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>{profilo.email}</p>
        </div>

        <div style={{ background: '#1a1a2e', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'rgba(255,255,255,0.3)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Il tuo account</h3>
          <p style={{ margin: '0 0 8px 0', color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: '1.6' }}>
            Presto potrai acquistare biglietti, salvare i tuoi locali preferiti e ricevere notifiche sugli eventi.
          </p>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>
            Iscritto dal {new Date(profilo.created_at).toLocaleDateString('it-IT')}
          </p>
        </div>

        <button onClick={logout} style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, background: '#282828', color: '#ff4444', width: '100%' }}>
          Esci
        </button>
      </div>
    )
  }

  // Se loggato ma senza profilo (staff che accede per errore qui)
  if (user && !profilo) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: '-apple-system, sans-serif', color: '#fff', background: '#111', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '16px' }}>Account non associato a un profilo utente.</p>
        <button onClick={logout} style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, background: '#282828', color: '#fff' }}>Esci</button>
      </div>
    )
  }

  // Form login / registrazione
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: '-apple-system, sans-serif', color: '#fff', background: '#111', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <img src="/icon.png" alt="FLORNIGHT" style={{ width: '60px', height: '60px', borderRadius: '14px', marginBottom: '16px' }} />
        <h1 style={{ margin: 0, fontSize: '24px', letterSpacing: '4px', fontWeight: 300 }}>FLORNIGHT</h1>
      </div>

      <div style={{ display: 'flex', marginBottom: '24px', background: '#1a1a1a', borderRadius: '10px', padding: '3px' }}>
        <div
          onClick={function() { setMode('login'); setErrore(''); setMessaggio('') }}
          style={{
            flex: 1, textAlign: 'center', padding: '10px', borderRadius: '8px', cursor: 'pointer',
            fontSize: '14px', fontWeight: 600, transition: 'all 0.2s ease',
            background: mode === 'login' ? '#282828' : 'transparent',
            color: mode === 'login' ? '#fff' : 'rgba(255,255,255,0.4)'
          }}
        >
          Accedi
        </div>
        <div
          onClick={function() { setMode('register'); setErrore(''); setMessaggio('') }}
          style={{
            flex: 1, textAlign: 'center', padding: '10px', borderRadius: '8px', cursor: 'pointer',
            fontSize: '14px', fontWeight: 600, transition: 'all 0.2s ease',
            background: mode === 'register' ? '#282828' : 'transparent',
            color: mode === 'register' ? '#fff' : 'rgba(255,255,255,0.4)'
          }}
        >
          Registrati
        </div>
      </div>

      {mode === 'register' && (
        <input
          type="text"
          placeholder="Il tuo nome"
          value={nome}
          onChange={function(e) { setNome(e.target.value) }}
          style={inputStyle}
        />
      )}

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
        onKeyDown={function(e) { if (e.key === 'Enter') { if (mode === 'login') login(); else registrati() } }}
        style={inputStyle}
      />

      {errore && (
        <p style={{ color: '#ff4444', fontSize: '13px', margin: '0 0 10px 0', textAlign: 'center' }}>{errore}</p>
      )}
      {messaggio && (
        <p style={{ color: '#4a4', fontSize: '13px', margin: '0 0 10px 0', textAlign: 'center' }}>{messaggio}</p>
      )}

      <button
        onClick={function() { if (mode === 'login') login(); else registrati() }}
        style={{
          padding: '14px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
          fontSize: '15px', fontWeight: 600, width: '100%', marginTop: '4px',
          background: '#C43E51', color: '#fff'
        }}
      >
        {mode === 'login' ? 'Accedi' : 'Crea account'}
      </button>

      <a href="/" style={{ display: 'block', textAlign: 'center', marginTop: '24px', color: 'rgba(255,255,255,0.3)', fontSize: '13px', textDecoration: 'none' }}>
        Torna alla mappa
      </a>
    </div>
  )
}

export default Utente