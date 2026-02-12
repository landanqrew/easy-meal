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

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export type TimeConstraint = 'quick' | 'medium' | 'leisurely'

export type CookingMethod =
  | 'stovetop'
  | 'oven'
  | 'grill'
  | 'slow-cooker'
  | 'instant-pot'
  | 'air-fryer'
  | 'no-cook'

export type Cuisine =
  | 'american'
  | 'italian'
  | 'mexican'
  | 'asian'
  | 'mediterranean'
  | 'indian'
  | 'thai'
  | 'japanese'
  | 'french'
  | 'other'

// Recipe Generation Types
export type RecipePreferences = {
  protein?: string
  vegetables?: string[]
  cuisine?: string
  mealType?: MealType
  cookingMethod?: CookingMethod | string
  timeConstraint?: TimeConstraint
  servings?: number
  dietaryRestrictions?: DietaryRestriction[]
  additionalNotes?: string
}

export type GeneratedIngredient = {
  name: string
  quantity: number
  unit: string
  category: IngredientCategory | string
  preparation?: string
}

export type GeneratedRecipe = {
  title: string
  description: string
  servings: number
  prepTime: number
  cookTime: number
  cuisine: string
  ingredients: GeneratedIngredient[]
  instructions: { stepNumber: number; text: string }[]
}

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

// Meal Plan types
export type MealPlanEntry = {
  id: string
  recipeId: string
  date: string
  mealType: MealType
  recipe: {
    id: string
    title: string
    prepTime: number | null
    cookTime: number | null
  }
}

// Auth types are provided by Better Auth client
