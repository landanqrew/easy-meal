import { describe, test, expect } from 'bun:test'
import { sanitizeString, sanitizeEmail, isValidUUID } from './security'

describe('sanitizeString', () => {
  test('trims whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello')
  })

  test('removes < and > characters', () => {
    expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script')
  })

  test('truncates to 10000 characters', () => {
    const long = 'a'.repeat(15000)
    expect(sanitizeString(long)).toHaveLength(10000)
  })

  test('returns empty string for non-string input', () => {
    expect(sanitizeString(123 as any)).toBe('')
    expect(sanitizeString(null as any)).toBe('')
    expect(sanitizeString(undefined as any)).toBe('')
  })

  test('handles empty string', () => {
    expect(sanitizeString('')).toBe('')
  })

  test('handles string with only angle brackets', () => {
    expect(sanitizeString('<>')).toBe('')
  })
})

describe('sanitizeEmail', () => {
  test('lowercases email', () => {
    expect(sanitizeEmail('User@Example.COM')).toBe('user@example.com')
  })

  test('trims whitespace', () => {
    expect(sanitizeEmail('  user@test.com  ')).toBe('user@test.com')
  })

  test('truncates to 255 characters', () => {
    const long = 'a'.repeat(300) + '@test.com'
    expect(sanitizeEmail(long).length).toBeLessThanOrEqual(255)
  })

  test('returns empty string for non-string input', () => {
    expect(sanitizeEmail(123 as any)).toBe('')
    expect(sanitizeEmail(null as any)).toBe('')
  })
})

describe('isValidUUID', () => {
  test('accepts valid v4 UUID', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
  })

  test('accepts uppercase UUID', () => {
    expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true)
  })

  test('rejects empty string', () => {
    expect(isValidUUID('')).toBe(false)
  })

  test('rejects random string', () => {
    expect(isValidUUID('not-a-uuid')).toBe(false)
  })

  test('rejects partial UUID', () => {
    expect(isValidUUID('550e8400-e29b-41d4')).toBe(false)
  })

  test('rejects UUID without hyphens', () => {
    expect(isValidUUID('550e8400e29b41d4a716446655440000')).toBe(false)
  })
})
