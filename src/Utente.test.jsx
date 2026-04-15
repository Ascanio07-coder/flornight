import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMockSupabase } from './test/mockSupabase.js'

// We mock the `./supabase` module before importing Utente. A mutable
// reference lets us swap handlers per test.
const state = { mock: createMockSupabase() }

vi.mock('./supabase', () => ({
  get supabase() {
    return state.mock.supabase
  },
}))

// Must be imported AFTER vi.mock so the mocked module is picked up.
import Utente from './Utente.jsx'

function resetWithHandlers(handlers) {
  state.mock = createMockSupabase(handlers)
}

beforeEach(() => {
  resetWithHandlers()
  cleanup()
})

describe('<Utente /> signup form validation', () => {
  it('blocks submission when any field is empty and never calls Supabase', async () => {
    render(<Utente />)

    // Switch to the register tab
    fireEvent.click(screen.getByText('Registrati'))

    // Click the submit button without filling anything
    fireEvent.click(screen.getByRole('button', { name: /Crea account/i }))

    expect(screen.getByText('Compila tutti i campi')).toBeInTheDocument()
    expect(state.mock.calls.signUp).toHaveLength(0)
  })

  it('blocks submission when the password is shorter than 6 chars', async () => {
    const user = userEvent.setup()
    render(<Utente />)

    fireEvent.click(screen.getByText('Registrati'))

    await user.type(screen.getByPlaceholderText('Il tuo nome'), 'Mario')
    await user.type(screen.getByPlaceholderText('Email'), 'mario@example.com')
    await user.type(screen.getByPlaceholderText('Password'), '12345')

    fireEvent.click(screen.getByRole('button', { name: /Crea account/i }))

    expect(
      screen.getByText('La password deve avere almeno 6 caratteri'),
    ).toBeInTheDocument()
    expect(state.mock.calls.signUp).toHaveLength(0)
  })

  it('calls supabase.auth.signUp with the typed credentials on a valid form', async () => {
    resetWithHandlers({
      signUp: () => ({
        data: { user: { id: 'u-new' } },
        error: null,
      }),
      insert: () => ({ data: null, error: null }),
      select: () => ({ data: null, error: null }),
    })

    const user = userEvent.setup()
    render(<Utente />)

    fireEvent.click(screen.getByText('Registrati'))

    await user.type(screen.getByPlaceholderText('Il tuo nome'), 'Mario')
    await user.type(screen.getByPlaceholderText('Email'), 'mario@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'secret123')

    fireEvent.click(screen.getByRole('button', { name: /Crea account/i }))

    await waitFor(() => {
      expect(state.mock.calls.signUp).toEqual([
        { email: 'mario@example.com', password: 'secret123' },
      ])
    })
  })
})

describe('<Utente /> login form', () => {
  it('shows an error when Supabase returns invalid credentials', async () => {
    resetWithHandlers({
      signInWithPassword: () => ({
        data: { user: null },
        error: { message: 'invalid' },
      }),
    })

    const user = userEvent.setup()
    render(<Utente />)

    await user.type(screen.getByPlaceholderText('Email'), 'x@y.z')
    await user.type(screen.getByPlaceholderText('Password'), 'wrongpass')
    // There are two "Accedi" elements (tab + submit button). Pick the button.
    const submit = screen
      .getAllByRole('button')
      .find((el) => el.textContent === 'Accedi')
    fireEvent.click(submit)

    await waitFor(() => {
      expect(screen.getByText('Email o password errati')).toBeInTheDocument()
    })
    expect(state.mock.calls.signIn).toEqual([
      { email: 'x@y.z', password: 'wrongpass' },
    ])
  })
})
