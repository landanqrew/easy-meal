// Shared types for Easy Meal

export type UserPreferences = {
  defaultServings: number
  cuisinePreferences: string[]
}

export type DietaryRestriction =
  | 'vegetarian'
  | 'vegan'
  | 'gluten-free'
  | 'dairy-free'
  | 'nut-free'
  | 'keto'
  | 'low-sodium'
  | 'halal'
  | 'kosher'

export type IngredientCategory =
  | 'produce'
  | 'dairy'
  | 'meat'
  | 'seafood'
  | 'pantry'
  | 'frozen'
  | 'bakery'
  | 'beverages'
  | 'other'

export type RecipeSource = 'ai_generated' | 'manual' | 'imported'

export type GroceryListStatus = 'active' | 'completed' | 'archived'

// API Response types
export type ApiResponse<T> = {
  data: T
  error?: never
} | {
  data?: never
  error: string
}

export type HealthResponse = {
  status: 'ok'
  timestamp: string
}
