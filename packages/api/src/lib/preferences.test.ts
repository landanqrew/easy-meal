import { describe, test, expect } from 'bun:test'
import { buildPreferencesPrompt } from './preferences'
import type { RecipePreferences } from '@easy-meal/shared'

describe('buildPreferencesPrompt', () => {
  test('returns fallback for empty preferences', () => {
    const result = buildPreferencesPrompt({})
    expect(result).toBe('No specific preferences - create a delicious, balanced meal')
  })

  test('includes protein when specified', () => {
    const result = buildPreferencesPrompt({ protein: 'chicken' })
    expect(result).toContain('Protein: chicken')
  })

  test('includes vegetables joined by comma', () => {
    const result = buildPreferencesPrompt({ vegetables: ['broccoli', 'peppers'] })
    expect(result).toContain('Vegetables: broccoli, peppers')
  })

  test('includes fruits joined by comma', () => {
    const result = buildPreferencesPrompt({ fruits: ['apple', 'mango'] })
    expect(result).toContain('Fruits: apple, mango')
  })

  test('maps time constraints to human-readable strings', () => {
    expect(buildPreferencesPrompt({ timeConstraint: 'quick' })).toContain('under 30 minutes')
    expect(buildPreferencesPrompt({ timeConstraint: 'medium' })).toContain('30-60 minutes')
    expect(buildPreferencesPrompt({ timeConstraint: 'leisurely' })).toContain('over 60 minutes')
  })

  test('includes dietary restrictions with emphasis', () => {
    const result = buildPreferencesPrompt({
      dietaryRestrictions: ['vegetarian', 'gluten-free'],
    })
    expect(result).toContain('DIETARY RESTRICTIONS (MUST RESPECT): vegetarian, gluten-free')
  })

  test('includes all fields when fully specified', () => {
    const prefs: RecipePreferences = {
      protein: 'tofu',
      vegetables: ['spinach'],
      cuisine: 'thai',
      mealType: 'dinner',
      recipeType: 'entree',
      cookingMethod: 'stovetop',
      timeConstraint: 'quick',
      servings: 4,
      additionalNotes: 'extra spicy',
    }
    const result = buildPreferencesPrompt(prefs)
    expect(result).toContain('Protein: tofu')
    expect(result).toContain('Vegetables: spinach')
    expect(result).toContain('Cuisine style: thai')
    expect(result).toContain('Meal type: dinner')
    expect(result).toContain('Recipe type: entree')
    expect(result).toContain('Cooking method: stovetop')
    expect(result).toContain('under 30 minutes')
    expect(result).toContain('Servings: 4')
    expect(result).toContain('Additional notes: extra spicy')
  })

  test('skips empty arrays', () => {
    const result = buildPreferencesPrompt({ vegetables: [], fruits: [] })
    expect(result).toBe('No specific preferences - create a delicious, balanced meal')
  })
})
