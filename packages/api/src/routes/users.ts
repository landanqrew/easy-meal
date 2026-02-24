import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { user } from '../db/auth-schema'
import { getSession, getUserWithHousehold } from '../lib/auth-helpers'
import { validate, patchUserSchema } from '../lib/validators'

const users = new Hono()

// GET /users/me - Get current user profile
users.get('/me', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const currentUser = await getUserWithHousehold(session.user.id)

  if (!currentUser) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json({
    data: {
      id: currentUser.id,
      email: currentUser.email,
      name: currentUser.name,
      image: currentUser.image,
      householdId: currentUser.householdId,
      dietaryRestrictions: currentUser.dietaryRestrictions,
      preferences: currentUser.preferences,
      createdAt: currentUser.createdAt,
    },
  })
})

// PATCH /users/me - Update current user profile
users.patch('/me', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const body = await c.req.json()
  const parsed = validate(patchUserSchema, body)
  if (!parsed.success) {
    return c.json({ error: parsed.error }, 400)
  }
  const { name, dietaryRestrictions, preferences } = parsed.data

  const updates: Record<string, any> = {}

  if (name !== undefined) {
    updates.name = name
  }
  if (dietaryRestrictions !== undefined) {
    updates.dietaryRestrictions = JSON.stringify(dietaryRestrictions)
  }
  if (preferences !== undefined) {
    updates.preferences = JSON.stringify(preferences)
  }

  updates.updatedAt = new Date()

  const [updated] = await db
    .update(user)
    .set(updates)
    .where(eq(user.id, session.user.id))
    .returning()

  return c.json({
    data: {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      image: updated.image,
      householdId: updated.householdId,
      dietaryRestrictions: updated.dietaryRestrictions,
      preferences: updated.preferences,
      createdAt: updated.createdAt,
    },
  })
})

export default users
