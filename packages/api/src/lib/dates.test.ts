import { describe, test, expect } from 'bun:test'
import { getWeekStartMonday } from './dates'

describe('getWeekStartMonday', () => {
  test('returns Monday for a Monday input', () => {
    // 2026-02-23 is a Monday
    const monday = new Date('2026-02-23T12:00:00Z')
    const result = getWeekStartMonday(monday)
    expect(result.toISOString()).toBe('2026-02-23T00:00:00.000Z')
  })

  test('returns previous Monday for a Wednesday', () => {
    // 2026-02-25 is a Wednesday
    const wednesday = new Date('2026-02-25T15:30:00Z')
    const result = getWeekStartMonday(wednesday)
    expect(result.toISOString()).toBe('2026-02-23T00:00:00.000Z')
  })

  test('returns previous Monday for a Sunday', () => {
    // 2026-03-01 is a Sunday
    const sunday = new Date('2026-03-01T08:00:00Z')
    const result = getWeekStartMonday(sunday)
    expect(result.toISOString()).toBe('2026-02-23T00:00:00.000Z')
  })

  test('returns previous Monday for a Saturday', () => {
    // 2026-02-28 is a Saturday
    const saturday = new Date('2026-02-28T20:00:00Z')
    const result = getWeekStartMonday(saturday)
    expect(result.toISOString()).toBe('2026-02-23T00:00:00.000Z')
  })

  test('handles year boundary (Sunday Jan 1)', () => {
    // 2023-01-01 is a Sunday, Monday is Dec 26 2022
    const newYear = new Date('2023-01-01T00:00:00Z')
    const result = getWeekStartMonday(newYear)
    expect(result.toISOString()).toBe('2022-12-26T00:00:00.000Z')
  })

  test('result is always midnight UTC', () => {
    const date = new Date('2026-02-26T23:59:59Z')
    const result = getWeekStartMonday(date)
    expect(result.getUTCHours()).toBe(0)
    expect(result.getUTCMinutes()).toBe(0)
    expect(result.getUTCSeconds()).toBe(0)
  })
})
