import { z } from 'zod'

// Shared field schemas
const uuid = z.string().uuid()
const mealType = z.enum(['breakfast', 'lunch', 'dinner', 'snack'])
const groceryListStatus = z.enum(['active', 'completed', 'archived'])
const recipeType = z.enum(['full_meal', 'entree', 'side', 'dessert', 'appetizer', 'snack', 'drink', 'other'])
const ingredientCategory = z.enum(['produce', 'dairy', 'meat', 'seafood', 'pantry', 'frozen', 'bakery', 'beverages', 'other'])

// ── Meal Plans ──────────────────────────────────────────────
export const createMealPlanSchema = z.object({
  recipeId: uuid,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  mealType,
})

// ── Grocery Lists ───────────────────────────────────────────
export const createGroceryListSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  recipes: z
    .array(
      z.object({
        recipeId: uuid,
        servings: z.number().int().min(1),
      })
    )
    .min(1, 'At least one recipe is required'),
})

export const patchGroceryListSchema = z
  .object({
    name: z.string().min(1).trim().optional(),
    status: groceryListStatus.optional(),
  })
  .refine((d) => d.name !== undefined || d.status !== undefined, {
    message: 'At least one field is required',
  })

export const toggleGroceryItemSchema = z.object({
  isChecked: z.boolean(),
})

export const addGroceryItemSchema = z.object({
  ingredientName: z.string().min(1, 'Ingredient name is required').trim(),
  quantity: z.string().min(1, 'Quantity is required'),
  unit: z.string().min(1, 'Unit is required').trim(),
})

// ── Recipes ─────────────────────────────────────────────────
const ingredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.number(),
  unit: z.string(),
  category: ingredientCategory.optional().default('other'),
  preparation: z.string().optional(),
})

export const createRecipeSchema = z.object({
  title: z.string().min(1, 'Recipe title is required').trim(),
  description: z.string().optional(),
  servings: z.number().int().min(1).optional().default(4),
  prepTime: z.number().int().min(0).nullable().optional(),
  cookTime: z.number().int().min(0).nullable().optional(),
  cuisine: z.string().optional(),
  instructions: z.array(z.any()).optional().default([]),
  ingredients: z.array(ingredientSchema).optional(),
  source: z.enum(['ai_generated', 'manual', 'imported', 'community']).optional().default('ai_generated'),
  type: recipeType.optional().default('full_meal'),
})

export const addTagToRecipeSchema = z.object({
  tagId: uuid,
})

// ── Households ──────────────────────────────────────────────
export const createHouseholdSchema = z.object({
  name: z.string().min(1, 'Household name is required').trim(),
})

export const joinHouseholdSchema = z.object({
  inviteCode: z.string().min(1, 'Invite code is required').trim(),
})

export const renameHouseholdSchema = z.object({
  name: z.string().min(1, 'Household name is required').trim(),
})

// ── Tags ────────────────────────────────────────────────────
export const createTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').trim(),
  color: z.string().optional(),
})

export const patchTagSchema = z
  .object({
    name: z.string().min(1).trim().optional(),
    color: z.string().optional(),
  })
  .refine((d) => d.name !== undefined || d.color !== undefined, {
    message: 'At least one field is required',
  })

// ── Recipe Lists ────────────────────────────────────────────
export const createRecipeListSchema = z.object({
  name: z.string().min(1, 'List name is required').trim(),
  description: z.string().optional(),
})

export const addRecipeToListSchema = z.object({
  recipeId: uuid,
})

// ── Users ───────────────────────────────────────────────────
export const patchUserSchema = z
  .object({
    name: z.string().min(1).trim().optional(),
    dietaryRestrictions: z.array(z.string()).optional(),
    preferences: z.record(z.string(), z.any()).optional(),
  })
  .refine((d) => d.name !== undefined || d.dietaryRestrictions !== undefined || d.preferences !== undefined, {
    message: 'At least one field is required',
  })

// ── Chat ────────────────────────────────────────────────────
export const chatRecipeSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1),
      })
    )
    .min(1, 'At least one message is required'),
})

// ── Check-ins ───────────────────────────────────────────────
export const createCheckinSchema = z.object({
  recipeId: uuid,
  notes: z.string().optional(),
  enjoymentRating: z.number().int().min(1).max(5),
  instructionRating: z.number().int().min(1).max(5),
})

// ── Validation helper ───────────────────────────────────────
export function validate<T>(schema: z.ZodType<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)
  if (!result.success) {
    const issue = result.error.issues[0]
    const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : ''
    return { success: false, error: `${path}${issue.message}` }
  }
  return { success: true, data: result.data }
}
