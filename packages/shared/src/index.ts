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

export type RecipeSource = 'ai_generated' | 'manual' | 'imported' | 'community'

export type GroceryListStatus = 'active' | 'completed' | 'archived'

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export type RecipeType = 'full_meal' | 'entree' | 'side' | 'dessert' | 'appetizer' | 'snack' | 'drink' | 'other'

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
  fruits?: string[]
  cuisine?: string
  mealType?: MealType
  recipeType?: RecipeType
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
  type?: RecipeType
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
  sortOrder: number
  recipe: {
    id: string
    title: string
    prepTime: number | null
    cookTime: number | null
    type: RecipeType
  }
}

// Frontend view types

export type Tag = {
  id: string
  name: string
  color: string | null
}

export type Ingredient = {
  id: string
  name: string
  quantity: string
  unit: string
  preparation: string | null
  category: string
}

export type RecipeCard = {
  id: string
  title: string
  description: string | null
  servings: number
  prepTime: number | null
  cookTime: number | null
  cuisine: string | null
  source: string
  type: RecipeType
  createdAt: string
  createdBy: { id: string; name: string } | null
  tags: Tag[]
}

export type Checkin = {
  id: string
  notes: string | null
  enjoymentRating: number
  instructionRating: number
  createdAt: string
  userId: string
  userName: string | null
}

export type GroceryListSummary = {
  id: string
  name: string
  status: GroceryListStatus
  createdAt: string
  createdBy: { id: string; name: string } | null
}

export type HouseholdMember = {
  id: string
  name: string
  email: string
  image: string | null
}

export type HouseholdDetail = {
  id: string
  name: string
  inviteCode: string
  createdAt: string
  members: HouseholdMember[]
}

export type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

// Auth types are provided by Better Auth client
