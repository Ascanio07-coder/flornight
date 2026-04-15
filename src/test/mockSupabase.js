// Tiny in-memory Supabase stand-in for component tests.
//
// This intentionally does NOT try to emulate the real query builder — the
// app only uses a small slice of the client surface:
//   supabase.auth.getSession()
//   supabase.auth.signInWithPassword({ email, password })
//   supabase.auth.signUp({ email, password })
//   supabase.auth.signOut()
//   supabase.from(table).select('*')[.eq(...).single()]
//   supabase.from(table).insert(row)
//   supabase.from(table).delete().eq('id', id)
//
// Each method returns a thenable so the component's `.then(...)` calls work
// without awaiting. Behavior per call can be overridden via the `handlers`
// argument, and every call is recorded on `mock.calls` for assertions.

import { vi } from 'vitest'

function resolved(value) {
  return Promise.resolve(value)
}

export function createMockSupabase(handlers = {}) {
  const calls = {
    signIn: [],
    signUp: [],
    signOut: 0,
    getSession: 0,
    from: [],
    insert: [],
    select: [],
    delete: [],
  }

  const auth = {
    getSession: vi.fn(() => {
      calls.getSession++
      return resolved(
        handlers.getSession ? handlers.getSession() : { data: { session: null } },
      )
    }),
    signInWithPassword: vi.fn((args) => {
      calls.signIn.push(args)
      return resolved(
        handlers.signInWithPassword
          ? handlers.signInWithPassword(args)
          : { data: { user: { id: 'u1' } }, error: null },
      )
    }),
    signUp: vi.fn((args) => {
      calls.signUp.push(args)
      return resolved(
        handlers.signUp
          ? handlers.signUp(args)
          : { data: { user: { id: 'u1' } }, error: null },
      )
    }),
    signOut: vi.fn(() => {
      calls.signOut++
      return resolved({ error: null })
    }),
  }

  function from(table) {
    calls.from.push(table)

    const insertHandler = handlers.insert || (() => ({ data: null, error: null }))
    const selectHandler = handlers.select || (() => ({ data: [], error: null }))
    const deleteHandler = handlers.delete || (() => ({ data: null, error: null }))

    const builder = {
      insert: vi.fn((row) => {
        calls.insert.push({ table, row })
        return resolved(insertHandler({ table, row }))
      }),
      delete: vi.fn(() => {
        const chain = {
          eq: vi.fn((col, val) => {
            calls.delete.push({ table, col, val })
            return resolved(deleteHandler({ table, col, val }))
          }),
        }
        return chain
      }),
      select: vi.fn(() => {
        calls.select.push({ table })
        const chain = {
          eq: vi.fn(() => ({
            single: vi.fn(() =>
              resolved(selectHandler({ table, single: true })),
            ),
            then: (cb) => resolved(selectHandler({ table })).then(cb),
          })),
          then: (cb) => resolved(selectHandler({ table })).then(cb),
        }
        return chain
      }),
    }

    return builder
  }

  return {
    supabase: { auth, from },
    calls,
  }
}
