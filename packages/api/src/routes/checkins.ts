import { Hono } from 'hono'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '../db'
import { recipes, recipeCheckins } from '../db/schema'
import { user } from '../db/auth-schema'
import { auth } from '../lib/auth'

const checkinsRouter = new Hono()

async function getSession(c: any) {
  return auth.api.getSession({ headers: c.req.raw.headers })
}

// POST /checkins - create check-in
checkinsRouter.post('/', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const body = await c.req.json()
  const { recipeId, notes, enjoymentRating, instructionRating } = body

  if (!recipeId) {
    return c.json({ error: 'recipeId is required' }, 400)
  }
  if (!enjoymentRating || enjoymentRating < 1 || enjoymentRating > 5) {
    return c.json({ error: 'enjoymentRating must be between 1 and 5' }, 400)
  }
  if (!instructionRating || instructionRating < 1 || instructionRating > 5) {
    return c.json({ error: 'instructionRating must be between 1 and 5' }, 400)
  }

  // Verify recipe exists
  const recipe = await db.query.recipes.findFirst({
    where: eq(recipes.id, recipeId),
  })
  if (!recipe) {
    return c.json({ error: 'Recipe not found' }, 404)
  }

  const [checkin] = await db
    .insert(recipeCheckins)
    .values({
      recipeId,
      userId: session.user.id,
      notes: notes || null,
      enjoymentRating,
      instructionRating,
      createdByUserId: session.user.id,
      updatedByUserId: session.user.id,
    })
    .returning()

  return c.json({ data: checkin }, 201)
})

// GET /checkins/recipe/:recipeId - check-ins for a recipe
checkinsRouter.get('/recipe/:recipeId', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const recipeId = c.req.param('recipeId')

  const checkins = await db
    .select({
      id: recipeCheckins.id,
      recipeId: recipeCheckins.recipeId,
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

  return c.json({ data: checkins })
})

// GET /checkins/me - user's check-in history
checkinsRouter.get('/me', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const checkins = await db
    .select({
      id: recipeCheckins.id,
      recipeId: recipeCheckins.recipeId,
      recipeTitle: recipes.title,
      notes: recipeCheckins.notes,
      enjoymentRating: recipeCheckins.enjoymentRating,
      instructionRating: recipeCheckins.instructionRating,
      createdAt: recipeCheckins.createdAt,
    })
    .from(recipeCheckins)
    .leftJoin(recipes, eq(recipeCheckins.recipeId, recipes.id))
    .where(eq(recipeCheckins.userId, session.user.id))
    .orderBy(desc(recipeCheckins.createdAt))

  return c.json({ data: checkins })
})

// DELETE /checkins/:id - delete own check-in
checkinsRouter.delete('/:id', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const checkinId = c.req.param('id')

  const existing = await db.query.recipeCheckins.findFirst({
    where: and(
      eq(recipeCheckins.id, checkinId),
      eq(recipeCheckins.userId, session.user.id)
    ),
  })

  if (!existing) {
    return c.json({ error: 'Check-in not found' }, 404)
  }

  await db.delete(recipeCheckins).where(eq(recipeCheckins.id, checkinId))

  return c.json({ data: { message: 'Check-in deleted' } })
})

export default checkinsRouter
