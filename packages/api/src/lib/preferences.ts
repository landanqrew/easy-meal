// AI recipe preference prompt builder

import type { RecipePreferences } from '@easy-meal/shared'

export function buildPreferencesPrompt(prefs: RecipePreferences): string {
  const lines: string[] = []

  if (prefs.protein) lines.push(`- Protein: ${prefs.protein}`)
  if (prefs.vegetables?.length) lines.push(`- Vegetables: ${prefs.vegetables.join(', ')}`)
  if (prefs.fruits?.length) lines.push(`- Fruits: ${prefs.fruits.join(', ')}`)
  if (prefs.cuisine) lines.push(`- Cuisine style: ${prefs.cuisine}`)
  if (prefs.mealType) lines.push(`- Meal type: ${prefs.mealType}`)
  if (prefs.recipeType) lines.push(`- Recipe type: ${prefs.recipeType}`)
  if (prefs.cookingMethod) lines.push(`- Cooking method: ${prefs.cookingMethod}`)
  if (prefs.timeConstraint) {
    const timeMap = { quick: 'under 30 minutes', medium: '30-60 minutes', leisurely: 'over 60 minutes' }
    lines.push(`- Time constraint: ${timeMap[prefs.timeConstraint]}`)
  }
  if (prefs.servings) lines.push(`- Servings: ${prefs.servings}`)
  if (prefs.dietaryRestrictions?.length) {
    lines.push(`- DIETARY RESTRICTIONS (MUST RESPECT): ${prefs.dietaryRestrictions.join(', ')}`)
  }
  if (prefs.additionalNotes) lines.push(`- Additional notes: ${prefs.additionalNotes}`)

  return lines.length > 0 ? lines.join('\n') : 'No specific preferences - create a delicious, balanced meal'
}
