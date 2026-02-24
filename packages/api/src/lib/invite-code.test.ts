import { describe, test, expect } from 'bun:test'
import { generateInviteCode, ALLOWED_CHARS, CODE_LENGTH } from './invite-code'

describe('generateInviteCode', () => {
  test('returns a string of the correct length', () => {
    const code = generateInviteCode()
    expect(code).toHaveLength(CODE_LENGTH)
  })

  test('only contains allowed characters', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateInviteCode()
      for (const char of code) {
        expect(ALLOWED_CHARS).toContain(char)
      }
    }
  })

  test('excludes confusing characters (O, 0, I, 1)', () => {
    expect(ALLOWED_CHARS).not.toContain('O')
    expect(ALLOWED_CHARS).not.toContain('0')
    expect(ALLOWED_CHARS).not.toContain('I')
    expect(ALLOWED_CHARS).not.toContain('1')
  })

  test('generates different codes on successive calls', () => {
    const codes = new Set<string>()
    for (let i = 0; i < 50; i++) {
      codes.add(generateInviteCode())
    }
    // With 30^8 possible codes, 50 calls should produce at least 45 unique
    expect(codes.size).toBeGreaterThanOrEqual(45)
  })
})
