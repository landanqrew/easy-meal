// Unit conversion utilities for grocery list ingredient aggregation

export const UNIT_CONVERSIONS: Record<string, { base: string; factor: number }> = {
  // Volume
  tsp: { base: 'tbsp', factor: 1 / 3 },
  tbsp: { base: 'tbsp', factor: 1 },
  cup: { base: 'tbsp', factor: 16 },
  ml: { base: 'tbsp', factor: 1 / 15 },
  l: { base: 'tbsp', factor: 67.628 },
  // Weight
  oz: { base: 'oz', factor: 1 },
  lb: { base: 'oz', factor: 16 },
  g: { base: 'oz', factor: 1 / 28.35 },
  kg: { base: 'oz', factor: 35.274 },
  // Count
  piece: { base: 'piece', factor: 1 },
  pieces: { base: 'piece', factor: 1 },
  clove: { base: 'clove', factor: 1 },
  cloves: { base: 'clove', factor: 1 },
}

export function normalizeUnit(unit: string): string {
  const lower = unit.toLowerCase().trim()
  if (lower.endsWith('s') && lower !== 'cloves') {
    const singular = lower.slice(0, -1)
    if (UNIT_CONVERSIONS[singular]) return singular
  }
  return lower
}

export function convertToBaseUnit(
  quantity: number,
  unit: string
): { quantity: number; baseUnit: string } {
  const normalized = normalizeUnit(unit)
  const conversion = UNIT_CONVERSIONS[normalized]
  if (conversion) {
    return {
      quantity: quantity * conversion.factor,
      baseUnit: conversion.base,
    }
  }
  return { quantity, baseUnit: normalized }
}

export function convertFromBaseUnit(
  quantity: number,
  baseUnit: string
): { quantity: number; unit: string } {
  if (baseUnit === 'tbsp' && quantity >= 16) {
    return { quantity: quantity / 16, unit: 'cup' }
  }
  if (baseUnit === 'oz' && quantity >= 16) {
    return { quantity: quantity / 16, unit: 'lb' }
  }
  return { quantity, unit: baseUnit }
}

export function roundQuantity(qty: number): number {
  if (qty >= 10) return Math.round(qty)
  if (qty >= 1) return Math.round(qty * 4) / 4
  return Math.round(qty * 8) / 8
}
