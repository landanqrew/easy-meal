import { describe, test, expect } from 'bun:test'
import {
  validate,
  createMealPlanSchema,
  patchMealPlanSchema,
  createGroceryListSchema,
  patchGroceryListSchema,
  toggleGroceryItemSchema,
  addGroceryItemSchema,
  createRecipeSchema,
  addTagToRecipeSchema,
  createHouseholdSchema,
  joinHouseholdSchema,
  renameHouseholdSchema,
  createTagSchema,
  patchTagSchema,
  createRecipeListSchema,
  addRecipeToListSchema,
  patchUserSchema,
  chatRecipeSchema,
  createCheckinSchema,
} from './validators'

const validUUID = '550e8400-e29b-41d4-a716-446655440000'

describe('validate helper', () => {
  test('returns success with parsed data for valid input', () => {
    const result = validate(createTagSchema, { name: 'Italian' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Italian')
    }
  })

  test('returns error with path-prefixed message for invalid input', () => {
    const result = validate(createMealPlanSchema, { recipeId: 'not-a-uuid', date: '2024-01-01', mealType: 'lunch' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('recipeId')
    }
  })

  test('returns error without path prefix for top-level issues', () => {
    const result = validate(patchGroceryListSchema, {})
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('At least one field is required')
    }
  })
})

describe('createMealPlanSchema', () => {
  test('accepts valid input', () => {
    const result = validate(createMealPlanSchema, {
      recipeId: validUUID,
      date: '2024-03-15',
      mealType: 'dinner',
    })
    expect(result.success).toBe(true)
  })

  test('rejects missing recipeId', () => {
    const result = validate(createMealPlanSchema, { date: '2024-03-15', mealType: 'dinner' })
    expect(result.success).toBe(false)
  })

  test('rejects bad date format', () => {
    const result = validate(createMealPlanSchema, {
      recipeId: validUUID,
      date: '03/15/2024',
      mealType: 'dinner',
    })
    expect(result.success).toBe(false)
  })

  test('rejects invalid mealType', () => {
    const result = validate(createMealPlanSchema, {
      recipeId: validUUID,
      date: '2024-03-15',
      mealType: 'brunch',
    })
    expect(result.success).toBe(false)
  })
})

describe('patchMealPlanSchema', () => {
  test('accepts valid input', () => {
    const result = validate(patchMealPlanSchema, {
      date: '2024-03-15',
      mealType: 'lunch',
      sortOrder: 0,
    })
    expect(result.success).toBe(true)
  })

  test('rejects negative sortOrder', () => {
    const result = validate(patchMealPlanSchema, {
      date: '2024-03-15',
      mealType: 'lunch',
      sortOrder: -1,
    })
    expect(result.success).toBe(false)
  })

  test('rejects non-integer sortOrder', () => {
    const result = validate(patchMealPlanSchema, {
      date: '2024-03-15',
      mealType: 'lunch',
      sortOrder: 1.5,
    })
    expect(result.success).toBe(false)
  })
})

describe('createGroceryListSchema', () => {
  test('accepts valid input', () => {
    const result = validate(createGroceryListSchema, {
      name: 'Weekly groceries',
      recipes: [{ recipeId: validUUID, servings: 4 }],
    })
    expect(result.success).toBe(true)
  })

  test('rejects empty name', () => {
    const result = validate(createGroceryListSchema, {
      name: '',
      recipes: [{ recipeId: validUUID, servings: 4 }],
    })
    expect(result.success).toBe(false)
  })

  test('rejects empty recipes array', () => {
    const result = validate(createGroceryListSchema, {
      name: 'Weekly groceries',
      recipes: [],
    })
    expect(result.success).toBe(false)
  })

  test('rejects invalid recipe servings', () => {
    const result = validate(createGroceryListSchema, {
      name: 'Weekly groceries',
      recipes: [{ recipeId: validUUID, servings: 0 }],
    })
    expect(result.success).toBe(false)
  })
})

describe('patchGroceryListSchema', () => {
  test('accepts name only', () => {
    const result = validate(patchGroceryListSchema, { name: 'Updated' })
    expect(result.success).toBe(true)
  })

  test('accepts status only', () => {
    const result = validate(patchGroceryListSchema, { status: 'completed' })
    expect(result.success).toBe(true)
  })

  test('rejects empty object', () => {
    const result = validate(patchGroceryListSchema, {})
    expect(result.success).toBe(false)
  })

  test('rejects invalid status', () => {
    const result = validate(patchGroceryListSchema, { status: 'invalid' })
    expect(result.success).toBe(false)
  })
})

describe('toggleGroceryItemSchema', () => {
  test('accepts true', () => {
    const result = validate(toggleGroceryItemSchema, { isChecked: true })
    expect(result.success).toBe(true)
  })

  test('accepts false', () => {
    const result = validate(toggleGroceryItemSchema, { isChecked: false })
    expect(result.success).toBe(true)
  })

  test('rejects missing isChecked', () => {
    const result = validate(toggleGroceryItemSchema, {})
    expect(result.success).toBe(false)
  })
})

describe('addGroceryItemSchema', () => {
  test('accepts valid input', () => {
    const result = validate(addGroceryItemSchema, {
      ingredientName: 'Tomatoes',
      quantity: '2',
      unit: 'lb',
    })
    expect(result.success).toBe(true)
  })

  test('rejects empty ingredientName', () => {
    const result = validate(addGroceryItemSchema, {
      ingredientName: '',
      quantity: '2',
      unit: 'lb',
    })
    expect(result.success).toBe(false)
  })
})

describe('createRecipeSchema', () => {
  test('accepts minimal valid input', () => {
    const result = validate(createRecipeSchema, { title: 'Pasta' })
    expect(result.success).toBe(true)
  })

  test('applies correct defaults', () => {
    const result = validate(createRecipeSchema, { title: 'Pasta' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.servings).toBe(4)
      expect(result.data.source).toBe('ai_generated')
      expect(result.data.type).toBe('full_meal')
    }
  })

  test('accepts all fields', () => {
    const result = validate(createRecipeSchema, {
      title: 'Pasta Carbonara',
      description: 'Classic Italian dish',
      servings: 2,
      prepTime: 10,
      cookTime: 20,
      cuisine: 'Italian',
      instructions: [{ step: 1, text: 'Boil pasta' }],
      ingredients: [{ name: 'Pasta', quantity: 1, unit: 'lb', category: 'pantry' }],
      source: 'manual',
      type: 'entree',
    })
    expect(result.success).toBe(true)
  })

  test('rejects invalid source', () => {
    const result = validate(createRecipeSchema, { title: 'Pasta', source: 'unknown' })
    expect(result.success).toBe(false)
  })

  test('rejects empty title', () => {
    const result = validate(createRecipeSchema, { title: '' })
    expect(result.success).toBe(false)
  })
})

describe('addTagToRecipeSchema', () => {
  test('accepts valid UUID', () => {
    const result = validate(addTagToRecipeSchema, { tagId: validUUID })
    expect(result.success).toBe(true)
  })

  test('rejects invalid UUID', () => {
    const result = validate(addTagToRecipeSchema, { tagId: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })
})

describe('household schemas', () => {
  test('createHouseholdSchema accepts valid name', () => {
    const result = validate(createHouseholdSchema, { name: 'My House' })
    expect(result.success).toBe(true)
  })

  test('createHouseholdSchema rejects empty name', () => {
    const result = validate(createHouseholdSchema, { name: '' })
    expect(result.success).toBe(false)
  })

  test('joinHouseholdSchema accepts valid code', () => {
    const result = validate(joinHouseholdSchema, { inviteCode: 'ABC123' })
    expect(result.success).toBe(true)
  })

  test('joinHouseholdSchema rejects empty code', () => {
    const result = validate(joinHouseholdSchema, { inviteCode: '' })
    expect(result.success).toBe(false)
  })

  test('renameHouseholdSchema accepts valid name', () => {
    const result = validate(renameHouseholdSchema, { name: 'New Name' })
    expect(result.success).toBe(true)
  })

  test('renameHouseholdSchema rejects empty name', () => {
    const result = validate(renameHouseholdSchema, { name: '' })
    expect(result.success).toBe(false)
  })
})

describe('tag schemas', () => {
  test('createTagSchema accepts name only', () => {
    const result = validate(createTagSchema, { name: 'Vegan' })
    expect(result.success).toBe(true)
  })

  test('createTagSchema accepts name and color', () => {
    const result = validate(createTagSchema, { name: 'Vegan', color: '#00ff00' })
    expect(result.success).toBe(true)
  })

  test('createTagSchema rejects empty name', () => {
    const result = validate(createTagSchema, { name: '' })
    expect(result.success).toBe(false)
  })

  test('patchTagSchema accepts name only', () => {
    const result = validate(patchTagSchema, { name: 'Updated' })
    expect(result.success).toBe(true)
  })

  test('patchTagSchema accepts color only', () => {
    const result = validate(patchTagSchema, { color: '#ff0000' })
    expect(result.success).toBe(true)
  })

  test('patchTagSchema rejects empty object', () => {
    const result = validate(patchTagSchema, {})
    expect(result.success).toBe(false)
  })
})

describe('recipe list schemas', () => {
  test('createRecipeListSchema accepts valid input', () => {
    const result = validate(createRecipeListSchema, { name: 'Favorites' })
    expect(result.success).toBe(true)
  })

  test('createRecipeListSchema rejects empty name', () => {
    const result = validate(createRecipeListSchema, { name: '' })
    expect(result.success).toBe(false)
  })

  test('addRecipeToListSchema accepts valid UUID', () => {
    const result = validate(addRecipeToListSchema, { recipeId: validUUID })
    expect(result.success).toBe(true)
  })

  test('addRecipeToListSchema rejects invalid UUID', () => {
    const result = validate(addRecipeToListSchema, { recipeId: 'bad' })
    expect(result.success).toBe(false)
  })
})

describe('patchUserSchema', () => {
  test('accepts name', () => {
    const result = validate(patchUserSchema, { name: 'John' })
    expect(result.success).toBe(true)
  })

  test('accepts dietaryRestrictions', () => {
    const result = validate(patchUserSchema, { dietaryRestrictions: ['vegan', 'gluten-free'] })
    expect(result.success).toBe(true)
  })

  test('accepts preferences', () => {
    const result = validate(patchUserSchema, { preferences: { theme: 'dark' } })
    expect(result.success).toBe(true)
  })

  test('rejects empty object', () => {
    const result = validate(patchUserSchema, {})
    expect(result.success).toBe(false)
  })
})

describe('chatRecipeSchema', () => {
  test('accepts valid messages', () => {
    const result = validate(chatRecipeSchema, {
      messages: [{ role: 'user', content: 'Make me a pasta recipe' }],
    })
    expect(result.success).toBe(true)
  })

  test('rejects empty messages array', () => {
    const result = validate(chatRecipeSchema, { messages: [] })
    expect(result.success).toBe(false)
  })

  test('rejects invalid role', () => {
    const result = validate(chatRecipeSchema, {
      messages: [{ role: 'system', content: 'hello' }],
    })
    expect(result.success).toBe(false)
  })
})

describe('createCheckinSchema', () => {
  test('accepts valid input', () => {
    const result = validate(createCheckinSchema, {
      recipeId: validUUID,
      enjoymentRating: 4,
      instructionRating: 5,
    })
    expect(result.success).toBe(true)
  })

  test('accepts with optional notes', () => {
    const result = validate(createCheckinSchema, {
      recipeId: validUUID,
      enjoymentRating: 3,
      instructionRating: 3,
      notes: 'Great recipe!',
    })
    expect(result.success).toBe(true)
  })

  test('rejects rating below 1', () => {
    const result = validate(createCheckinSchema, {
      recipeId: validUUID,
      enjoymentRating: 0,
      instructionRating: 3,
    })
    expect(result.success).toBe(false)
  })

  test('rejects rating above 5', () => {
    const result = validate(createCheckinSchema, {
      recipeId: validUUID,
      enjoymentRating: 6,
      instructionRating: 3,
    })
    expect(result.success).toBe(false)
  })

  test('rejects non-integer rating', () => {
    const result = validate(createCheckinSchema, {
      recipeId: validUUID,
      enjoymentRating: 3.5,
      instructionRating: 3,
    })
    expect(result.success).toBe(false)
  })
})
