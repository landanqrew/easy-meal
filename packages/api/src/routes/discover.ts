import { Hono } from 'hono'
import { eq, and, desc, ilike, or, sql, count } from 'drizzle-orm'
import { db } from '../db'
import { recipes, recipeIngredients, ingredients, recipeCheckins } from '../db/schema'
import { user } from '../db/auth-schema'
import { getSession, getUserWithHousehold } from '../lib/auth-helpers'

const discoverRouter = new Hono()

// GET /discover/recipes - paginated public recipe list
discoverRouter.get('/recipes', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const page = Math.max(1, Number(c.req.query('page')) || 1)
  const limit = Math.min(50, Math.max(1, Number(c.req.query('limit')) || 20))
  const search = c.req.query('search')?.trim()
  const cuisine = c.req.query('cuisine')?.trim()
  const offset = (page - 1) * limit

  const conditions = [eq(recipes.isPublic, true)]

  if (search) {
    conditions.push(
      or(
        ilike(recipes.title, `%${search}%`),
        ilike(recipes.description, `%${search}%`)
      )!
    )
  }
  if (cuisine) {
    conditions.push(ilike(recipes.cuisine, cuisine))
  }

  const where = and(...conditions)

  // Get total count
  const [{ total }] = await db
    .select({ total: count() })
    .from(recipes)
    .where(where)

  // Get recipes with aggregated ratings
  const results = await db
    .select({
      id: recipes.id,
      title: recipes.title,
      description: recipes.description,
      servings: recipes.servings,
      prepTime: recipes.prepTime,
      cookTime: recipes.cookTime,
      cuisine: recipes.cuisine,
      source: recipes.source,
      type: recipes.type,
      createdAt: recipes.createdAt,
      createdByUserId: recipes.createdByUserId,
      avgEnjoymentRating: sql<number>`coalesce(avg(${recipeCheckins.enjoymentRating}), 0)`.as('avg_enjoyment_rating'),
      avgInstructionRating: sql<number>`coalesce(avg(${recipeCheckins.instructionRating}), 0)`.as('avg_instruction_rating'),
      checkinCount: sql<number>`count(${recipeCheckins.id})`.as('checkin_count'),
    })
    .from(recipes)
    .leftJoin(recipeCheckins, eq(recipes.id, recipeCheckins.recipeId))
    .where(where)
    .groupBy(recipes.id)
    .orderBy(desc(recipes.createdAt))
    .limit(limit)
    .offset(offset)

  // Get creator names
  const creatorIds = [...new Set(results.map((r) => r.createdByUserId).filter(Boolean))] as string[]
  const creators: Record<string, string> = {}
  if (creatorIds.length > 0) {
    const users = await db.query.user.findMany({
      where: or(...creatorIds.map((id) => eq(user.id, id))),
      columns: { id: true, name: true },
    })
    for (const u of users) {
      creators[u.id] = u.name
    }
  }

  return c.json({
    data: results.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      servings: r.servings,
      prepTime: r.prepTime,
      cookTime: r.cookTime,
      cuisine: r.cuisine,
      source: r.source,
      type: r.type,
      createdAt: r.createdAt,
      creatorName: r.createdByUserId ? creators[r.createdByUserId] || null : null,
      avgEnjoymentRating: Number(r.avgEnjoymentRating),
      avgInstructionRating: Number(r.avgInstructionRating),
      checkinCount: Number(r.checkinCount),
    })),
    pagination: {
      page,
      limit,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / limit),
    },
  })
})

// GET /discover/recipes/:id - public recipe detail
discoverRouter.get('/recipes/:id', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const recipeId = c.req.param('id')

  const recipe = await db.query.recipes.findFirst({
    where: and(eq(recipes.id, recipeId), eq(recipes.isPublic, true)),
    with: {
      recipeIngredients: {
        with: { ingredient: true },
      },
      createdBy: true,
    },
  })

  if (!recipe) {
    return c.json({ error: 'Recipe not found' }, 404)
  }

  // Aggregate ratings
  const [ratings] = await db
    .select({
      avgEnjoymentRating: sql<number>`coalesce(avg(${recipeCheckins.enjoymentRating}), 0)`,
      avgInstructionRating: sql<number>`coalesce(avg(${recipeCheckins.instructionRating}), 0)`,
      checkinCount: sql<number>`count(${recipeCheckins.id})`,
    })
    .from(recipeCheckins)
    .where(eq(recipeCheckins.recipeId, recipeId))

  // Recent check-ins
  const recentCheckins = await db
    .select({
      id: recipeCheckins.id,
      notes: recipeCheckins.notes,
      enjoymentRating: recipeCheckins.enjoymentRating,
      instructionRating: recipeCheckins.instructionRating,
      createdAt: recipeCheckins.createdAt,
      userId: recipeCheckins.userId,
      userName: user.name,
    })
    .from(recipeCheckins)
    .leftJoin(user, eq(recipeCheckins.userId, user.id))
    .where(eq(recipeCheckins.recipeId, recipeId))
    .orderBy(desc(recipeCheckins.createdAt))
    .limit(10)

  return c.json({
    data: {
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      servings: recipe.servings,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      cuisine: recipe.cuisine,
      instructions: recipe.instructions,
      source: recipe.source,
      type: recipe.type,
      createdAt: recipe.createdAt,
      createdBy: recipe.createdBy ? { id: recipe.createdBy.id, name: recipe.createdBy.name } : null,
      ingredients: recipe.recipeIngredients.map((ri) => ({
        id: ri.ingredient.id,
        name: ri.ingredient.name,
        quantity: ri.quantity,
        unit: ri.unit,
        preparation: ri.preparation,
        category: ri.ingredient.category,
      })),
      ratings: {
        avgEnjoymentRating: Number(ratings.avgEnjoymentRating),
        avgInstructionRating: Number(ratings.avgInstructionRating),
        checkinCount: Number(ratings.checkinCount),
      },
      recentCheckins: recentCheckins.map((ch) => ({
        id: ch.id,
        notes: ch.notes,
        enjoymentRating: ch.enjoymentRating,
        instructionRating: ch.instructionRating,
        createdAt: ch.createdAt,
        userName: ch.userName,
      })),
    },
  })
})

// POST /discover/recipes/:id/copy - copy to household
discoverRouter.post('/recipes/:id/copy', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const currentUser = await getUserWithHousehold(session.user.id)
  if (!currentUser?.householdId) {
    return c.json({ error: 'You must be in a household to copy recipes' }, 400)
  }

  const sourceId = c.req.param('id')

  const sourceRecipe = await db.query.recipes.findFirst({
    where: and(eq(recipes.id, sourceId), eq(recipes.isPublic, true)),
    with: {
      recipeIngredients: true,
    },
  })

  if (!sourceRecipe) {
    return c.json({ error: 'Recipe not found or not public' }, 404)
  }

  // Create the copy
  const [newRecipe] = await db
    .insert(recipes)
    .values({
      householdId: currentUser.householdId,
      title: sourceRecipe.title,
      description: sourceRecipe.description,
      servings: sourceRecipe.servings,
      prepTime: sourceRecipe.prepTime,
      cookTime: sourceRecipe.cookTime,
      cuisine: sourceRecipe.cuisine,
      instructions: sourceRecipe.instructions,
      source: 'community',
      type: sourceRecipe.type,
      isPublic: false,
      copiedFromRecipeId: sourceId,
      createdByUserId: session.user.id,
      updatedByUserId: session.user.id,
    })
    .returning()

  // Copy ingredients
  if (sourceRecipe.recipeIngredients.length > 0) {
    await db.insert(recipeIngredients).values(
      sourceRecipe.recipeIngredients.map((ri) => ({
        recipeId: newRecipe.id,
        ingredientId: ri.ingredientId,
        quantity: ri.quantity,
        unit: ri.unit,
        preparation: ri.preparation,
        createdByUserId: session.user.id,
        updatedByUserId: session.user.id,
      }))
    )
  }

  return c.json({ data: { id: newRecipe.id, title: newRecipe.title } }, 201)
})

export default discoverRouter
