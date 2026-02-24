import { Hono } from 'hono'
import { eq, and } from 'drizzle-orm'
import { db } from '../db'
import { recipeLists, recipeListItems, recipes } from '../db/schema'
import { getSession, getUserWithHousehold } from '../lib/auth-helpers'
import { validate, createRecipeListSchema, addRecipeToListSchema } from '../lib/validators'

const recipeListsRouter = new Hono()

// GET /recipe-lists - List all recipe lists for current user
recipeListsRouter.get('/', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const currentUser = await getUserWithHousehold(session.user.id)
  if (!currentUser?.householdId) {
    return c.json({ error: 'You must be in a household' }, 400)
  }

  const lists = await db.query.recipeLists.findMany({
    where: eq(recipeLists.userId, session.user.id),
    orderBy: (recipeLists, { asc }) => [asc(recipeLists.position)],
    with: {
      items: {
        with: {
          recipe: true,
        },
      },
    },
  })

  return c.json({
    data: lists.map((l) => ({
      id: l.id,
      name: l.name,
      description: l.description,
      position: l.position,
      recipeCount: l.items.length,
      recipes: l.items.map((item) => ({
        id: item.recipe.id,
        title: item.recipe.title,
        position: item.position,
      })),
    })),
  })
})

// POST /recipe-lists - Create a new recipe list
recipeListsRouter.post('/', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const currentUser = await getUserWithHousehold(session.user.id)
  if (!currentUser?.householdId) {
    return c.json({ error: 'You must be in a household' }, 400)
  }

  const parsed = validate(createRecipeListSchema, await c.req.json())
  if (!parsed.success) {
    return c.json({ error: parsed.error }, 400)
  }
  const { name, description } = parsed.data

  // Get max position
  const existingLists = await db.query.recipeLists.findMany({
    where: eq(recipeLists.userId, session.user.id),
  })
  const maxPosition = existingLists.reduce((max, l) => Math.max(max, l.position), -1)

  const [list] = await db
    .insert(recipeLists)
    .values({
      userId: session.user.id,
      householdId: currentUser.householdId,
      name: name.trim(),
      description: description || null,
      position: maxPosition + 1,
      createdByUserId: session.user.id,
      updatedByUserId: session.user.id,
    })
    .returning()

  return c.json(
    {
      data: {
        id: list.id,
        name: list.name,
        description: list.description,
        position: list.position,
        recipeCount: 0,
        recipes: [],
      },
    },
    201
  )
})

// GET /recipe-lists/:id - Get a single recipe list with recipes
recipeListsRouter.get('/:id', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const listId = c.req.param('id')

  const list = await db.query.recipeLists.findFirst({
    where: and(eq(recipeLists.id, listId), eq(recipeLists.userId, session.user.id)),
    with: {
      items: {
        orderBy: (items, { asc }) => [asc(items.position)],
        with: {
          recipe: {
            with: {
              recipeTags: {
                with: {
                  tag: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!list) {
    return c.json({ error: 'List not found' }, 404)
  }

  return c.json({
    data: {
      id: list.id,
      name: list.name,
      description: list.description,
      position: list.position,
      recipes: list.items.map((item) => ({
        id: item.recipe.id,
        title: item.recipe.title,
        description: item.recipe.description,
        servings: item.recipe.servings,
        prepTime: item.recipe.prepTime,
        cookTime: item.recipe.cookTime,
        cuisine: item.recipe.cuisine,
        position: item.position,
        tags: item.recipe.recipeTags.map((rt) => ({
          id: rt.tag.id,
          name: rt.tag.name,
          color: rt.tag.color,
        })),
      })),
    },
  })
})

// PATCH /recipe-lists/:id - Update a recipe list
recipeListsRouter.patch('/:id', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const listId = c.req.param('id')

  const existing = await db.query.recipeLists.findFirst({
    where: and(eq(recipeLists.id, listId), eq(recipeLists.userId, session.user.id)),
  })

  if (!existing) {
    return c.json({ error: 'List not found' }, 404)
  }

  const { name, description, position } = await c.req.json()

  const updates: Record<string, any> = {
    updatedAt: new Date(),
    updatedByUserId: session.user.id,
  }

  if (name !== undefined) updates.name = name.trim()
  if (description !== undefined) updates.description = description
  if (position !== undefined) updates.position = position

  const [updated] = await db
    .update(recipeLists)
    .set(updates)
    .where(eq(recipeLists.id, listId))
    .returning()

  return c.json({
    data: {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      position: updated.position,
    },
  })
})

// DELETE /recipe-lists/:id - Delete a recipe list
recipeListsRouter.delete('/:id', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const listId = c.req.param('id')

  const existing = await db.query.recipeLists.findFirst({
    where: and(eq(recipeLists.id, listId), eq(recipeLists.userId, session.user.id)),
  })

  if (!existing) {
    return c.json({ error: 'List not found' }, 404)
  }

  await db.delete(recipeLists).where(eq(recipeLists.id, listId))

  return c.json({ data: { message: 'List deleted' } })
})

// POST /recipe-lists/:id/recipes - Add a recipe to a list
recipeListsRouter.post('/:id/recipes', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const currentUser = await getUserWithHousehold(session.user.id)
  if (!currentUser?.householdId) {
    return c.json({ error: 'You must be in a household' }, 400)
  }

  const listId = c.req.param('id')
  const parsed = validate(addRecipeToListSchema, await c.req.json())
  if (!parsed.success) {
    return c.json({ error: parsed.error }, 400)
  }
  const { recipeId } = parsed.data

  // Verify list belongs to user
  const list = await db.query.recipeLists.findFirst({
    where: and(eq(recipeLists.id, listId), eq(recipeLists.userId, session.user.id)),
  })

  if (!list) {
    return c.json({ error: 'List not found' }, 404)
  }

  // Verify recipe belongs to household
  const recipe = await db.query.recipes.findFirst({
    where: and(eq(recipes.id, recipeId), eq(recipes.householdId, currentUser.householdId)),
  })

  if (!recipe) {
    return c.json({ error: 'Recipe not found' }, 404)
  }

  // Check if already in list
  const existing = await db.query.recipeListItems.findFirst({
    where: and(
      eq(recipeListItems.recipeListId, listId),
      eq(recipeListItems.recipeId, recipeId)
    ),
  })

  if (existing) {
    return c.json({ error: 'Recipe already in list' }, 400)
  }

  // Get max position
  const items = await db.query.recipeListItems.findMany({
    where: eq(recipeListItems.recipeListId, listId),
  })
  const maxPosition = items.reduce((max, item) => Math.max(max, item.position), -1)

  await db.insert(recipeListItems).values({
    recipeListId: listId,
    recipeId,
    position: maxPosition + 1,
    createdByUserId: session.user.id,
    updatedByUserId: session.user.id,
  })

  return c.json({ data: { message: 'Recipe added to list' } }, 201)
})

// DELETE /recipe-lists/:id/recipes/:recipeId - Remove a recipe from a list
recipeListsRouter.delete('/:id/recipes/:recipeId', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const listId = c.req.param('id')
  const recipeId = c.req.param('recipeId')

  // Verify list belongs to user
  const list = await db.query.recipeLists.findFirst({
    where: and(eq(recipeLists.id, listId), eq(recipeLists.userId, session.user.id)),
  })

  if (!list) {
    return c.json({ error: 'List not found' }, 404)
  }

  await db.delete(recipeListItems).where(
    and(
      eq(recipeListItems.recipeListId, listId),
      eq(recipeListItems.recipeId, recipeId)
    )
  )

  return c.json({ data: { message: 'Recipe removed from list' } })
})

export default recipeListsRouter
