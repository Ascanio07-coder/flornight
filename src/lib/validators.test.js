import { describe, it, expect } from 'vitest'
import {
  MIN_PASSWORD_LENGTH,
  isValidPassword,
  validateSignupForm,
  validateLatLng,
} from './validators.js'

describe('isValidPassword', () => {
  it('requires at least 6 characters', () => {
    expect(MIN_PASSWORD_LENGTH).toBe(6)
    expect(isValidPassword('12345')).toBe(false)
    expect(isValidPassword('123456')).toBe(true)
    expect(isValidPassword('abcdefg')).toBe(true)
  })

  it('rejects non-strings', () => {
    expect(isValidPassword(undefined)).toBe(false)
    expect(isValidPassword(null)).toBe(false)
    expect(isValidPassword(123456)).toBe(false)
  })
})

describe('validateSignupForm', () => {
  it('complains when any field is missing', () => {
    expect(
      validateSignupForm({ email: '', pass: 'abcdef', nome: 'Test' }),
    ).toBe('Compila tutti i campi')
    expect(
      validateSignupForm({ email: 'a@b.c', pass: '', nome: 'Test' }),
    ).toBe('Compila tutti i campi')
    expect(
      validateSignupForm({ email: 'a@b.c', pass: 'abcdef', nome: '' }),
    ).toBe('Compila tutti i campi')
  })

  it('complains when the password is too short', () => {
    expect(
      validateSignupForm({ email: 'a@b.c', pass: '123', nome: 'Test' }),
    ).toBe('La password deve avere almeno 6 caratteri')
  })

  it('returns null when the form is valid', () => {
    expect(
      validateSignupForm({ email: 'a@b.c', pass: 'abcdef', nome: 'Test' }),
    ).toBeNull()
  })
})

describe('validateLatLng', () => {
  it('accepts valid string inputs and numbers', () => {
    expect(validateLatLng('43.77', '11.25')).toBeNull()
    expect(validateLatLng(43.77, 11.25)).toBeNull()
    expect(validateLatLng('-90', '180')).toBeNull() // exact bounds
  })

  it('rejects non-numeric input', () => {
    expect(validateLatLng('abc', '11.25')).toBe('Coordinate non valide')
    expect(validateLatLng('43.77', '')).toBe('Coordinate non valide')
    expect(validateLatLng(undefined, undefined)).toBe('Coordinate non valide')
  })

  it('rejects latitudes outside [-90, 90]', () => {
    expect(validateLatLng('91', '11.25')).toBe('Latitudine fuori range')
    expect(validateLatLng('-91', '11.25')).toBe('Latitudine fuori range')
  })

  it('rejects longitudes outside [-180, 180]', () => {
    expect(validateLatLng('43.77', '181')).toBe('Longitudine fuori range')
    expect(validateLatLng('43.77', '-181')).toBe('Longitudine fuori range')
  })
})
