import { Hono } from 'hono'
import { eq, and, inArray } from 'drizzle-orm'
import { db } from '../db'
import {
  groceryLists,
  groceryListItems,
  recipes,
  recipeIngredients,
  ingredients,
} from '../db/schema'
import { user } from '../db/auth-schema'
import { auth } from '../lib/auth'

const groceryListsRouter = new Hono()

// Helper to get session
async function getSession(c: any) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  return session
}

// Helper to get user with household
async function getUserWithHousehold(userId: string) {
  const result = await db.select().from(user).where(eq(user.id, userId)).limit(1)
  return result[0]
}

// Unit conversion map for aggregation
const UNIT_CONVERSIONS: Record<string, { base: string; factor: number }> = {
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

// Normalize unit to lowercase and handle plurals
function normalizeUnit(unit: string): string {
  const lower = unit.toLowerCase().trim()
  // Remove trailing 's' for common units
  if (lower.endsWith('s') && lower !== 'cloves') {
    const singular = lower.slice(0, -1)
    if (UNIT_CONVERSIONS[singular]) return singular
  }
  return lower
}

// Convert quantity to base unit for aggregation
function convertToBaseUnit(
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
  // Unknown unit - keep as is
  return { quantity, baseUnit: normalized }
}

// Convert from base unit back to a readable unit
function convertFromBaseUnit(quantity: number, baseUnit: string): { quantity: number; unit: string } {
  // For tablespoons, convert to cups if large enough
  if (baseUnit === 'tbsp' && quantity >= 16) {
    return { quantity: quantity / 16, unit: 'cup' }
  }
  // For ounces, convert to pounds if large enough
  if (baseUnit === 'oz' && quantity >= 16) {
    return { quantity: quantity / 16, unit: 'lb' }
  }
  return { quantity, unit: baseUnit }
}

// Round to reasonable precision
function roundQuantity(qty: number): number {
  if (qty >= 10) return Math.round(qty)
  if (qty >= 1) return Math.round(qty * 4) / 4 // Quarter precision
  return Math.round(qty * 8) / 8 // Eighth precision for small amounts
}

// POST /grocery-lists - Create a new grocery list from recipes
groceryListsRouter.post('/', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const currentUser = await getUserWithHousehold(session.user.id)
  if (!currentUser?.householdId) {
    return c.json({ error: 'You must be in a household to create grocery lists' }, 400)
  }

  const body = await c.req.json()
  const { name, recipes: recipeSelections } = body as {
    name: string
    recipes: { recipeId: string; servings: number }[]
  }

  if (!name || !recipeSelections || recipeSelections.length === 0) {
    return c.json({ error: 'Name and at least one recipe are required' }, 400)
  }

  // Fetch all selected recipes with their ingredients
  const recipeIds = recipeSelections.map((r) => r.recipeId)
  const selectedRecipes = await db
    .select({
      id: recipes.id,
      title: recipes.title,
      servings: recipes.servings,
    })
    .from(recipes)
    .where(
      and(eq(recipes.householdId, currentUser.householdId), inArray(recipes.id, recipeIds))
    )

  if (selectedRecipes.length !== recipeIds.length) {
    return c.json({ error: 'One or more recipes not found' }, 404)
  }

  // Create a map of recipe servings
  const servingsMap = new Map<string, { original: number; scaled: number }>()
  for (const selection of recipeSelections) {
    const recipe = selectedRecipes.find((r) => r.id === selection.recipeId)
    if (recipe) {
      servingsMap.set(selection.recipeId, {
        original: recipe.servings,
        scaled: selection.servings,
      })
    }
  }

  // Fetch all ingredients for selected recipes
  const recipeIngredientsData = await db
    .select({
      recipeId: recipeIngredients.recipeId,
      ingredientId: recipeIngredients.ingredientId,
      quantity: recipeIngredients.quantity,
      unit: recipeIngredients.unit,
      ingredientName: ingredients.name,
      ingredientCategory: ingredients.category,
    })
    .from(recipeIngredients)
    .innerJoin(ingredients, eq(recipeIngredients.ingredientId, ingredients.id))
    .where(inArray(recipeIngredients.recipeId, recipeIds))

  // Aggregate ingredients
  // Key: ingredientId + baseUnit
  const aggregated = new Map<
    string,
    {
      ingredientId: string
      baseQuantity: number
      baseUnit: string
      sources: { recipeId: string; originalServings: number; scaledServings: number }[]
    }
  >()

  for (const ing of recipeIngredientsData) {
    const servingsInfo = servingsMap.get(ing.recipeId)
    if (!servingsInfo) continue

    // Scale the quantity
    const scaleFactor = servingsInfo.scaled / servingsInfo.original
    const scaledQuantity = parseFloat(ing.quantity) * scaleFactor

    // Convert to base unit
    const { quantity: baseQty, baseUnit } = convertToBaseUnit(scaledQuantity, ing.unit)

    const key = `${ing.ingredientId}:${baseUnit}`
    const existing = aggregated.get(key)

    if (existing) {
      existing.baseQuantity += baseQty
      existing.sources.push({
        recipeId: ing.recipeId,
        originalServings: servingsInfo.original,
        scaledServings: servingsInfo.scaled,
      })
    } else {
      aggregated.set(key, {
        ingredientId: ing.ingredientId,
        baseQuantity: baseQty,
        baseUnit,
        sources: [
          {
            recipeId: ing.recipeId,
            originalServings: servingsInfo.original,
            scaledServings: servingsInfo.scaled,
          },
        ],
      })
    }
  }

  // Create the grocery list
  const [groceryList] = await db
    .insert(groceryLists)
    .values({
      householdId: currentUser.householdId,
      name,
      status: 'active',
      createdByUserId: session.user.id,
      updatedByUserId: session.user.id,
    })
    .returning()

  // Create grocery list items
  const itemsToInsert = []
  for (const agg of aggregated.values()) {
    const { quantity: finalQty, unit: finalUnit } = convertFromBaseUnit(
      agg.baseQuantity,
      agg.baseUnit
    )
    const roundedQty = roundQuantity(finalQty)

    // Use the first source recipe for tracking (simplified)
    const firstSource = agg.sources[0]

    itemsToInsert.push({
      groceryListId: groceryList.id,
      ingredientId: agg.ingredientId,
      quantity: roundedQty.toString(),
      unit: finalUnit,
      isChecked: false,
      recipeId: firstSource.recipeId,
      originalServings: firstSource.originalServings,
      scaledServings: firstSource.scaledServings,
      createdByUserId: session.user.id,
      updatedByUserId: session.user.id,
    })
  }

  if (itemsToInsert.length > 0) {
    await db.insert(groceryListItems).values(itemsToInsert)
  }

  // Fetch the complete grocery list with items
  const items = await db
    .select({
      id: groceryListItems.id,
      quantity: groceryListItems.quantity,
      unit: groceryListItems.unit,
      isChecked: groceryListItems.isChecked,
      ingredientId: groceryListItems.ingredientId,
      ingredientName: ingredients.name,
      ingredientCategory: ingredients.category,
      recipeId: groceryListItems.recipeId,
      recipeTitle: recipes.title,
    })
    .from(groceryListItems)
    .innerJoin(ingredients, eq(groceryListItems.ingredientId, ingredients.id))
    .leftJoin(recipes, eq(groceryListItems.recipeId, recipes.id))
    .where(eq(groceryListItems.groceryListId, groceryList.id))

  return c.json(
    {
      data: {
        ...groceryList,
        items: items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          unit: item.unit,
          isChecked: item.isChecked,
          ingredient: {
            id: item.ingredientId,
            name: item.ingredientName,
            category: item.ingredientCategory,
          },
          recipe: item.recipeId
            ? { id: item.recipeId, title: item.recipeTitle }
            : null,
        })),
      },
    },
    201
  )
})

// GET /grocery-lists - List all grocery lists for the household
groceryListsRouter.get('/', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const currentUser = await getUserWithHousehold(session.user.id)
  if (!currentUser?.householdId) {
    return c.json({ error: 'You must be in a household to view grocery lists' }, 400)
  }

  const status = c.req.query('status') // Optional filter

  let query = db
    .select({
      id: groceryLists.id,
      name: groceryLists.name,
      status: groceryLists.status,
      createdAt: groceryLists.createdAt,
      createdByUserId: groceryLists.createdByUserId,
      createdByName: user.name,
    })
    .from(groceryLists)
    .leftJoin(user, eq(groceryLists.createdByUserId, user.id))
    .where(eq(groceryLists.householdId, currentUser.householdId))
    .orderBy(groceryLists.createdAt)

  const lists = await query

  // Filter by status if provided
  const filteredLists = status
    ? lists.filter((l) => l.status === status)
    : lists

  return c.json({
    data: filteredLists.map((list) => ({
      id: list.id,
      name: list.name,
      status: list.status,
      createdAt: list.createdAt,
      createdBy: list.createdByUserId
        ? { id: list.createdByUserId, name: list.createdByName }
        : null,
    })),
  })
})

// GET /grocery-lists/:id - Get a single grocery list with items
groceryListsRouter.get('/:id', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const currentUser = await getUserWithHousehold(session.user.id)
  if (!currentUser?.householdId) {
    return c.json({ error: 'You must be in a household to view grocery lists' }, 400)
  }

  const id = c.req.param('id')

  const [groceryList] = await db
    .select()
    .from(groceryLists)
    .where(
      and(eq(groceryLists.id, id), eq(groceryLists.householdId, currentUser.householdId))
    )
    .limit(1)

  if (!groceryList) {
    return c.json({ error: 'Grocery list not found' }, 404)
  }

  const items = await db
    .select({
      id: groceryListItems.id,
      quantity: groceryListItems.quantity,
      unit: groceryListItems.unit,
      isChecked: groceryListItems.isChecked,
      ingredientId: groceryListItems.ingredientId,
      ingredientName: ingredients.name,
      ingredientCategory: ingredients.category,
      recipeId: groceryListItems.recipeId,
      recipeTitle: recipes.title,
    })
    .from(groceryListItems)
    .innerJoin(ingredients, eq(groceryListItems.ingredientId, ingredients.id))
    .leftJoin(recipes, eq(groceryListItems.recipeId, recipes.id))
    .where(eq(groceryListItems.groceryListId, groceryList.id))

  // Group items by category
  const itemsByCategory = items.reduce(
    (acc, item) => {
      const category = item.ingredientCategory || 'other'
      if (!acc[category]) acc[category] = []
      acc[category].push({
        id: item.id,
        quantity: item.quantity,
        unit: item.unit,
        isChecked: item.isChecked,
        ingredient: {
          id: item.ingredientId,
          name: item.ingredientName,
          category: item.ingredientCategory,
        },
        recipe: item.recipeId ? { id: item.recipeId, title: item.recipeTitle } : null,
      })
      return acc
    },
    {} as Record<string, any[]>
  )

  return c.json({
    data: {
      ...groceryList,
      items: items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unit: item.unit,
        isChecked: item.isChecked,
        ingredient: {
          id: item.ingredientId,
          name: item.ingredientName,
          category: item.ingredientCategory,
        },
        recipe: item.recipeId ? { id: item.recipeId, title: item.recipeTitle } : null,
      })),
      itemsByCategory,
    },
  })
})

// PATCH /grocery-lists/:id - Update grocery list (name, status)
groceryListsRouter.patch('/:id', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const currentUser = await getUserWithHousehold(session.user.id)
  if (!currentUser?.householdId) {
    return c.json({ error: 'You must be in a household' }, 400)
  }

  const id = c.req.param('id')
  const body = await c.req.json()
  const { name, status } = body as { name?: string; status?: 'active' | 'completed' | 'archived' }

  const [existing] = await db
    .select()
    .from(groceryLists)
    .where(
      and(eq(groceryLists.id, id), eq(groceryLists.householdId, currentUser.householdId))
    )
    .limit(1)

  if (!existing) {
    return c.json({ error: 'Grocery list not found' }, 404)
  }

  const [updated] = await db
    .update(groceryLists)
    .set({
      ...(name && { name }),
      ...(status && { status }),
      updatedAt: new Date(),
      updatedByUserId: session.user.id,
    })
    .where(eq(groceryLists.id, id))
    .returning()

  return c.json({ data: updated })
})

// DELETE /grocery-lists/:id - Delete a grocery list
groceryListsRouter.delete('/:id', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const currentUser = await getUserWithHousehold(session.user.id)
  if (!currentUser?.householdId) {
    return c.json({ error: 'You must be in a household' }, 400)
  }

  const id = c.req.param('id')

  const [existing] = await db
    .select()
    .from(groceryLists)
    .where(
      and(eq(groceryLists.id, id), eq(groceryLists.householdId, currentUser.householdId))
    )
    .limit(1)

  if (!existing) {
    return c.json({ error: 'Grocery list not found' }, 404)
  }

  await db.delete(groceryLists).where(eq(groceryLists.id, id))

  return c.json({ success: true })
})

// PATCH /grocery-lists/:id/items/:itemId - Toggle item checked status
groceryListsRouter.patch('/:id/items/:itemId', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const currentUser = await getUserWithHousehold(session.user.id)
  if (!currentUser?.householdId) {
    return c.json({ error: 'You must be in a household' }, 400)
  }

  const listId = c.req.param('id')
  const itemId = c.req.param('itemId')
  const body = await c.req.json()
  const { isChecked } = body as { isChecked: boolean }

  // Verify the grocery list belongs to the household
  const [groceryList] = await db
    .select()
    .from(groceryLists)
    .where(
      and(eq(groceryLists.id, listId), eq(groceryLists.householdId, currentUser.householdId))
    )
    .limit(1)

  if (!groceryList) {
    return c.json({ error: 'Grocery list not found' }, 404)
  }

  const [updated] = await db
    .update(groceryListItems)
    .set({
      isChecked,
      updatedAt: new Date(),
      updatedByUserId: session.user.id,
    })
    .where(
      and(eq(groceryListItems.id, itemId), eq(groceryListItems.groceryListId, listId))
    )
    .returning()

  if (!updated) {
    return c.json({ error: 'Item not found' }, 404)
  }

  return c.json({ data: updated })
})

// POST /grocery-lists/:id/items - Add a manual item to the grocery list
groceryListsRouter.post('/:id/items', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const currentUser = await getUserWithHousehold(session.user.id)
  if (!currentUser?.householdId) {
    return c.json({ error: 'You must be in a household' }, 400)
  }

  const listId = c.req.param('id')
  const body = await c.req.json()
  const { ingredientName, quantity, unit } = body as {
    ingredientName: string
    quantity: string
    unit: string
  }

  if (!ingredientName || !quantity || !unit) {
    return c.json({ error: 'Ingredient name, quantity, and unit are required' }, 400)
  }

  // Verify the grocery list belongs to the household
  const [groceryList] = await db
    .select()
    .from(groceryLists)
    .where(
      and(eq(groceryLists.id, listId), eq(groceryLists.householdId, currentUser.householdId))
    )
    .limit(1)

  if (!groceryList) {
    return c.json({ error: 'Grocery list not found' }, 404)
  }

  // Find or create the ingredient
  let [ingredient] = await db
    .select()
    .from(ingredients)
    .where(eq(ingredients.name, ingredientName.toLowerCase()))
    .limit(1)

  if (!ingredient) {
    ;[ingredient] = await db
      .insert(ingredients)
      .values({
        name: ingredientName.toLowerCase(),
        category: 'other',
        createdByUserId: session.user.id,
        updatedByUserId: session.user.id,
      })
      .returning()
  }

  const [item] = await db
    .insert(groceryListItems)
    .values({
      groceryListId: listId,
      ingredientId: ingredient.id,
      quantity,
      unit,
      isChecked: false,
      createdByUserId: session.user.id,
      updatedByUserId: session.user.id,
    })
    .returning()

  return c.json(
    {
      data: {
        ...item,
        ingredient: {
          id: ingredient.id,
          name: ingredient.name,
          category: ingredient.category,
        },
      },
    },
    201
  )
})

// DELETE /grocery-lists/:id/items/:itemId - Remove an item from the grocery list
groceryListsRouter.delete('/:id/items/:itemId', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const currentUser = await getUserWithHousehold(session.user.id)
  if (!currentUser?.householdId) {
    return c.json({ error: 'You must be in a household' }, 400)
  }

  const listId = c.req.param('id')
  const itemId = c.req.param('itemId')

  // Verify the grocery list belongs to the household
  const [groceryList] = await db
    .select()
    .from(groceryLists)
    .where(
      and(eq(groceryLists.id, listId), eq(groceryLists.householdId, currentUser.householdId))
    )
    .limit(1)

  if (!groceryList) {
    return c.json({ error: 'Grocery list not found' }, 404)
  }

  const deleted = await db
    .delete(groceryListItems)
    .where(
      and(eq(groceryListItems.id, itemId), eq(groceryListItems.groceryListId, listId))
    )
    .returning()

  if (deleted.length === 0) {
    return c.json({ error: 'Item not found' }, 404)
  }

  return c.json({ success: true })
})

// GET /grocery-lists/:id/export - Export grocery list for Google Tasks
groceryListsRouter.get('/:id/export', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const currentUser = await getUserWithHousehold(session.user.id)
  if (!currentUser?.householdId) {
    return c.json({ error: 'You must be in a household' }, 400)
  }

  const id = c.req.param('id')

  const [groceryList] = await db
    .select()
    .from(groceryLists)
    .where(
      and(eq(groceryLists.id, id), eq(groceryLists.householdId, currentUser.householdId))
    )
    .limit(1)

  if (!groceryList) {
    return c.json({ error: 'Grocery list not found' }, 404)
  }

  const items = await db
    .select({
      quantity: groceryListItems.quantity,
      unit: groceryListItems.unit,
      isChecked: groceryListItems.isChecked,
      ingredientName: ingredients.name,
      ingredientCategory: ingredients.category,
    })
    .from(groceryListItems)
    .innerJoin(ingredients, eq(groceryListItems.ingredientId, ingredients.id))
    .where(eq(groceryListItems.groceryListId, groceryList.id))

  // Group by category and format for export
  const categoryOrder = [
    'produce',
    'meat',
    'seafood',
    'dairy',
    'bakery',
    'frozen',
    'pantry',
    'beverages',
    'other',
  ]

  const itemsByCategory = items.reduce(
    (acc, item) => {
      const category = item.ingredientCategory || 'other'
      if (!acc[category]) acc[category] = []
      acc[category].push(item)
      return acc
    },
    {} as Record<string, typeof items>
  )

  // Format as tasks (one task per item with category in notes)
  const tasks = []
  for (const category of categoryOrder) {
    const categoryItems = itemsByCategory[category]
    if (!categoryItems) continue

    for (const item of categoryItems) {
      tasks.push({
        title: `${item.quantity} ${item.unit} ${item.ingredientName}`,
        notes: `Category: ${category}`,
        status: item.isChecked ? 'completed' : 'needsAction',
      })
    }
  }

  return c.json({
    data: {
      listName: groceryList.name,
      tasks,
      // Include a plain text version for easy copy-paste
      plainText: tasks.map((t) => `${t.status === 'completed' ? '✓' : '○'} ${t.title}`).join('\n'),
    },
  })
})

export default groceryListsRouter
