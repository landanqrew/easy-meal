import { Hono } from 'hono'
import { eq, and, gte, lt, max, asc } from 'drizzle-orm'
import { db } from '../db'
import { mealPlans, recipes } from '../db/schema'
import { getSession, getUserWithHousehold } from '../lib/auth-helpers'
import { getWeekStartMonday } from '../lib/dates'
import { validate, createMealPlanSchema, patchMealPlanSchema, copyWeekSchema } from '../lib/validators'

const mealPlansRouter = new Hono()

// GET / - Get meal plan entries for a week
mealPlansRouter.get('/', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const currentUser = await getUserWithHousehold(session.user.id)
  if (!currentUser?.householdId) {
    return c.json({ error: 'You must be in a household to view meal plans' }, 400)
  }

  const weekStartParam = c.req.query('weekStart')
  let weekStart: Date

  if (weekStartParam) {
    weekStart = new Date(weekStartParam + 'T00:00:00Z')
  } else {
    weekStart = getWeekStartMonday(new Date())
  }

  const weekEnd = new Date(weekStart)
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7)

  const entries = await db
    .select({
      id: mealPlans.id,
      recipeId: mealPlans.recipeId,
      date: mealPlans.date,
      mealType: mealPlans.mealType,
      sortOrder: mealPlans.sortOrder,
      recipeTitle: recipes.title,
      recipePrepTime: recipes.prepTime,
      recipeCookTime: recipes.cookTime,
      recipeType: recipes.type,
    })
    .from(mealPlans)
    .innerJoin(recipes, eq(mealPlans.recipeId, recipes.id))
    .where(
      and(
        eq(mealPlans.householdId, currentUser.householdId),
        gte(mealPlans.date, weekStart),
        lt(mealPlans.date, weekEnd)
      )
    )
    .orderBy(asc(mealPlans.date), asc(mealPlans.mealType), asc(mealPlans.sortOrder))

  const data = entries.map((e) => ({
    id: e.id,
    recipeId: e.recipeId,
    date: e.date.toISOString(),
    mealType: e.mealType,
    sortOrder: e.sortOrder,
    recipe: {
      id: e.recipeId,
      title: e.recipeTitle,
      prepTime: e.recipePrepTime,
      cookTime: e.recipeCookTime,
      type: e.recipeType,
    },
  }))

  return c.json({ data })
})

// POST / - Assign a recipe to a meal slot (upsert)
mealPlansRouter.post('/', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const currentUser = await getUserWithHousehold(session.user.id)
  if (!currentUser?.householdId) {
    return c.json({ error: 'You must be in a household to plan meals' }, 400)
  }

  const body = await c.req.json()
  const parsed = validate(createMealPlanSchema, body)
  if (!parsed.success) {
    return c.json({ error: parsed.error }, 400)
  }
  const { recipeId, date, mealType } = parsed.data

  // Validate recipe belongs to household
  const recipe = await db.query.recipes.findFirst({
    where: and(eq(recipes.id, recipeId), eq(recipes.householdId, currentUser.householdId)),
  })

  if (!recipe) {
    return c.json({ error: 'Recipe not found in your household' }, 404)
  }

  const dateValue = new Date(date + 'T00:00:00Z')

  // Get max sortOrder for this slot
  const [maxResult] = await db
    .select({ maxSort: max(mealPlans.sortOrder) })
    .from(mealPlans)
    .where(
      and(
        eq(mealPlans.householdId, currentUser.householdId),
        eq(mealPlans.date, dateValue),
        eq(mealPlans.mealType, mealType)
      )
    )

  const nextSortOrder = (maxResult?.maxSort ?? -1) + 1

  const [entry] = await db
    .insert(mealPlans)
    .values({
      householdId: currentUser.householdId,
      recipeId,
      date: dateValue,
      mealType,
      sortOrder: nextSortOrder,
      createdByUserId: session.user.id,
      updatedByUserId: session.user.id,
    })
    .returning()

  return c.json(
    {
      data: {
        id: entry.id,
        recipeId: entry.recipeId,
        date: entry.date.toISOString(),
        mealType: entry.mealType,
        sortOrder: entry.sortOrder,
        recipe: {
          id: recipe.id,
          title: recipe.title,
          prepTime: recipe.prepTime,
          cookTime: recipe.cookTime,
          type: recipe.type,
        },
      },
    },
    201
  )
})

// POST /copy-week - Copy all entries from one week to another
mealPlansRouter.post('/copy-week', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const currentUser = await getUserWithHousehold(session.user.id)
  if (!currentUser?.householdId) {
    return c.json({ error: 'You must be in a household' }, 400)
  }

  const body = await c.req.json()
  const parsed = validate(copyWeekSchema, body)
  if (!parsed.success) {
    return c.json({ error: parsed.error }, 400)
  }
  const { sourceWeekStart, targetWeekStart } = parsed.data

  if (sourceWeekStart === targetWeekStart) {
    return c.json({ error: 'Source and target weeks must be different' }, 400)
  }

  const sourceStart = new Date(sourceWeekStart + 'T00:00:00Z')
  const targetStart = new Date(targetWeekStart + 'T00:00:00Z')

  // Validate both dates are Mondays
  if (sourceStart.getUTCDay() !== 1 || targetStart.getUTCDay() !== 1) {
    return c.json({ error: 'Both dates must be Mondays' }, 400)
  }

  const sourceEnd = new Date(sourceStart)
  sourceEnd.setUTCDate(sourceEnd.getUTCDate() + 7)

  const targetEnd = new Date(targetStart)
  targetEnd.setUTCDate(targetEnd.getUTCDate() + 7)

  // Fetch source week entries
  const sourceEntries = await db
    .select()
    .from(mealPlans)
    .where(
      and(
        eq(mealPlans.householdId, currentUser.householdId),
        gte(mealPlans.date, sourceStart),
        lt(mealPlans.date, sourceEnd)
      )
    )
    .orderBy(asc(mealPlans.date), asc(mealPlans.mealType), asc(mealPlans.sortOrder))

  if (sourceEntries.length === 0) {
    return c.json({ error: 'No entries found in the source week' }, 400)
  }

  // Check for existing entries in target week to prevent duplicates
  const existingTargetEntries = await db
    .select({ id: mealPlans.id })
    .from(mealPlans)
    .where(
      and(
        eq(mealPlans.householdId, currentUser.householdId),
        gte(mealPlans.date, targetStart),
        lt(mealPlans.date, targetEnd)
      )
    )
    .limit(1)

  if (existingTargetEntries.length > 0) {
    return c.json({ error: 'Target week already has meal plan entries. Please clear it first.' }, 409)
  }

  // Create new entries with offset dates
  const newEntries = sourceEntries.map((entry) => {
    const dayOffset = Math.floor(
      (entry.date.getTime() - sourceStart.getTime()) / (1000 * 60 * 60 * 24)
    )
    const targetDate = new Date(targetStart)
    targetDate.setUTCDate(targetDate.getUTCDate() + dayOffset)

    return {
      householdId: currentUser.householdId!,
      recipeId: entry.recipeId,
      date: targetDate,
      mealType: entry.mealType,
      sortOrder: entry.sortOrder,
      createdByUserId: session.user.id,
      updatedByUserId: session.user.id,
    }
  })

  await db.insert(mealPlans).values(newEntries)

  return c.json({ data: { copiedCount: newEntries.length } }, 201)
})

// PATCH /:id - Move a meal plan entry (drag-and-drop)
mealPlansRouter.patch('/:id', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const currentUser = await getUserWithHousehold(session.user.id)
  if (!currentUser?.householdId) {
    return c.json({ error: 'You must be in a household' }, 400)
  }

  const id = c.req.param('id')

  const entry = await db.query.mealPlans.findFirst({
    where: and(eq(mealPlans.id, id), eq(mealPlans.householdId, currentUser.householdId)),
  })

  if (!entry) {
    return c.json({ error: 'Meal plan entry not found' }, 404)
  }

  const body = await c.req.json()
  const parsed = validate(patchMealPlanSchema, body)
  if (!parsed.success) {
    return c.json({ error: parsed.error }, 400)
  }
  const { date, mealType, sortOrder } = parsed.data

  const dateValue = new Date(date + 'T00:00:00Z')

  const [updated] = await db
    .update(mealPlans)
    .set({
      date: dateValue,
      mealType,
      sortOrder,
      updatedByUserId: session.user.id,
      updatedAt: new Date(),
    })
    .where(eq(mealPlans.id, id))
    .returning()

  // Fetch recipe info for the response
  const recipe = await db.query.recipes.findFirst({
    where: eq(recipes.id, updated.recipeId),
  })

  return c.json({
    data: {
      id: updated.id,
      recipeId: updated.recipeId,
      date: updated.date.toISOString(),
      mealType: updated.mealType,
      sortOrder: updated.sortOrder,
      recipe: {
        id: recipe!.id,
        title: recipe!.title,
        prepTime: recipe!.prepTime,
        cookTime: recipe!.cookTime,
        type: recipe!.type,
      },
    },
  })
})

// DELETE /:id - Remove a meal plan entry
mealPlansRouter.delete('/:id', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const currentUser = await getUserWithHousehold(session.user.id)
  if (!currentUser?.householdId) {
    return c.json({ error: 'You must be in a household' }, 400)
  }

  const id = c.req.param('id')

  const entry = await db.query.mealPlans.findFirst({
    where: and(eq(mealPlans.id, id), eq(mealPlans.householdId, currentUser.householdId)),
  })

  if (!entry) {
    return c.json({ error: 'Meal plan entry not found' }, 404)
  }

  await db.delete(mealPlans).where(eq(mealPlans.id, id))

  return c.json({ data: { message: 'Meal plan entry removed' } })
})

export default mealPlansRouter
