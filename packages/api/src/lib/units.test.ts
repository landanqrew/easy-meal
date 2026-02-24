import { describe, test, expect } from 'bun:test'
import {
  normalizeUnit,
  convertToBaseUnit,
  convertFromBaseUnit,
  roundQuantity,
} from './units'

describe('normalizeUnit', () => {
  test('lowercases and trims input', () => {
    expect(normalizeUnit('  Cup  ')).toBe('cup')
    expect(normalizeUnit('TBSP')).toBe('tbsp')
  })

  test('strips trailing s for known units', () => {
    expect(normalizeUnit('cups')).toBe('cup')
    expect(normalizeUnit('lbs')).toBe('lb')
    expect(normalizeUnit('tsps')).toBe('tsp')
  })

  test('preserves "cloves" as-is (exception)', () => {
    expect(normalizeUnit('cloves')).toBe('cloves')
  })

  test('does not strip s from unknown units', () => {
    expect(normalizeUnit('potatoes')).toBe('potatoes')
    expect(normalizeUnit('slices')).toBe('slices')
  })

  test('returns already-normalized units unchanged', () => {
    expect(normalizeUnit('cup')).toBe('cup')
    expect(normalizeUnit('oz')).toBe('oz')
    expect(normalizeUnit('piece')).toBe('piece')
  })
})

describe('convertToBaseUnit', () => {
  test('converts cups to tablespoons', () => {
    const result = convertToBaseUnit(1, 'cup')
    expect(result.baseUnit).toBe('tbsp')
    expect(result.quantity).toBe(16)
  })

  test('converts teaspoons to tablespoons', () => {
    const result = convertToBaseUnit(3, 'tsp')
    expect(result.baseUnit).toBe('tbsp')
    expect(result.quantity).toBeCloseTo(1, 5)
  })

  test('converts pounds to ounces', () => {
    const result = convertToBaseUnit(2, 'lb')
    expect(result.baseUnit).toBe('oz')
    expect(result.quantity).toBe(32)
  })

  test('converts kilograms to ounces', () => {
    const result = convertToBaseUnit(1, 'kg')
    expect(result.baseUnit).toBe('oz')
    expect(result.quantity).toBeCloseTo(35.274, 2)
  })

  test('handles plural units', () => {
    const result = convertToBaseUnit(2, 'cups')
    expect(result.baseUnit).toBe('tbsp')
    expect(result.quantity).toBe(32)
  })

  test('passes through unknown units unchanged', () => {
    const result = convertToBaseUnit(3, 'bunch')
    expect(result.baseUnit).toBe('bunch')
    expect(result.quantity).toBe(3)
  })

  test('converts pieces to piece base unit', () => {
    const result = convertToBaseUnit(4, 'pieces')
    expect(result.baseUnit).toBe('piece')
    expect(result.quantity).toBe(4)
  })
})

describe('convertFromBaseUnit', () => {
  test('converts tbsp to cups when >= 16', () => {
    const result = convertFromBaseUnit(32, 'tbsp')
    expect(result.unit).toBe('cup')
    expect(result.quantity).toBe(2)
  })

  test('keeps tbsp when < 16', () => {
    const result = convertFromBaseUnit(8, 'tbsp')
    expect(result.unit).toBe('tbsp')
    expect(result.quantity).toBe(8)
  })

  test('converts oz to lb when >= 16', () => {
    const result = convertFromBaseUnit(32, 'oz')
    expect(result.unit).toBe('lb')
    expect(result.quantity).toBe(2)
  })

  test('keeps oz when < 16', () => {
    const result = convertFromBaseUnit(12, 'oz')
    expect(result.unit).toBe('oz')
    expect(result.quantity).toBe(12)
  })

  test('converts exactly at threshold', () => {
    const result = convertFromBaseUnit(16, 'tbsp')
    expect(result.unit).toBe('cup')
    expect(result.quantity).toBe(1)
  })

  test('passes through other base units unchanged', () => {
    const result = convertFromBaseUnit(5, 'piece')
    expect(result.unit).toBe('piece')
    expect(result.quantity).toBe(5)
  })
})

describe('roundQuantity', () => {
  test('rounds large quantities to whole numbers', () => {
    expect(roundQuantity(10.3)).toBe(10)
    expect(roundQuantity(15.7)).toBe(16)
    expect(roundQuantity(100.49)).toBe(100)
  })

  test('rounds medium quantities to quarter precision', () => {
    expect(roundQuantity(1.1)).toBe(1)
    expect(roundQuantity(1.3)).toBe(1.25)
    expect(roundQuantity(2.6)).toBe(2.5)
    expect(roundQuantity(5.9)).toBe(6)
  })

  test('rounds small quantities to eighth precision', () => {
    expect(roundQuantity(0.3)).toBe(0.25)
    expect(roundQuantity(0.5)).toBe(0.5)
    expect(roundQuantity(0.7)).toBe(0.75)
    expect(roundQuantity(0.15)).toBe(0.125)
  })

  test('preserves exact values', () => {
    expect(roundQuantity(0.25)).toBe(0.25)
    expect(roundQuantity(0.5)).toBe(0.5)
    expect(roundQuantity(1)).toBe(1)
    expect(roundQuantity(2.5)).toBe(2.5)
  })
})
