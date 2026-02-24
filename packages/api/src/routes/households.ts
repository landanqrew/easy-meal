import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { households } from '../db/schema'
import { user } from '../db/auth-schema'
import { getSession, getUserWithHousehold } from '../lib/auth-helpers'
import { generateInviteCode } from '../lib/invite-code'
import { validate, createHouseholdSchema, joinHouseholdSchema, renameHouseholdSchema } from '../lib/validators'

const householdsRouter = new Hono()

// GET /households/me - Get current user's household
householdsRouter.get('/me', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const currentUser = await getUserWithHousehold(session.user.id)

  if (!currentUser?.householdId) {
    return c.json({ data: null })
  }

  const household = await db.query.households.findFirst({
    where: eq(households.id, currentUser.householdId),
  })

  if (!household) {
    return c.json({ data: null })
  }

  // Get household members
  const members = await db.query.user.findMany({
    where: eq(user.householdId, household.id),
  })

  return c.json({
    data: {
      id: household.id,
      name: household.name,
      inviteCode: household.inviteCode,
      createdAt: household.createdAt,
      members: members.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        image: m.image,
      })),
    },
  })
})

// POST /households - Create a new household
householdsRouter.post('/', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Check if user already has a household
  const currentUser = await getUserWithHousehold(session.user.id)

  if (currentUser?.householdId) {
    return c.json({ error: 'You already belong to a household' }, 400)
  }

  const body = await c.req.json()
  const parsed = validate(createHouseholdSchema, body)
  if (!parsed.success) {
    return c.json({ error: parsed.error }, 400)
  }
  const { name } = parsed.data

  // Generate unique invite code
  let inviteCode = generateInviteCode()
  let attempts = 0
  while (attempts < 10) {
    const existing = await db.query.households.findFirst({
      where: eq(households.inviteCode, inviteCode),
    })
    if (!existing) break
    inviteCode = generateInviteCode()
    attempts++
  }

  // Create household
  const [household] = await db
    .insert(households)
    .values({
      name: name.trim(),
      inviteCode,
    })
    .returning()

  // Update user's householdId
  await db
    .update(user)
    .set({ householdId: household.id, updatedAt: new Date() })
    .where(eq(user.id, session.user.id))

  return c.json(
    {
      data: {
        id: household.id,
        name: household.name,
        inviteCode: household.inviteCode,
        createdAt: household.createdAt,
      },
    },
    201
  )
})

// POST /households/join - Join a household by invite code
householdsRouter.post('/join', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Check if user already has a household
  const currentUser = await getUserWithHousehold(session.user.id)

  if (currentUser?.householdId) {
    return c.json({ error: 'You already belong to a household. Leave first to join another.' }, 400)
  }

  const body = await c.req.json()
  const parsed = validate(joinHouseholdSchema, body)
  if (!parsed.success) {
    return c.json({ error: parsed.error }, 400)
  }
  const { inviteCode } = parsed.data

  // Find household by invite code (case-insensitive)
  const household = await db.query.households.findFirst({
    where: eq(households.inviteCode, inviteCode.toUpperCase().trim()),
  })

  if (!household) {
    return c.json({ error: 'Invalid invite code' }, 404)
  }

  // Update user's householdId
  await db
    .update(user)
    .set({ householdId: household.id, updatedAt: new Date() })
    .where(eq(user.id, session.user.id))

  // Get updated member list
  const members = await db.query.user.findMany({
    where: eq(user.householdId, household.id),
  })

  return c.json({
    data: {
      id: household.id,
      name: household.name,
      inviteCode: household.inviteCode,
      createdAt: household.createdAt,
      members: members.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        image: m.image,
      })),
    },
  })
})

// POST /households/leave - Leave current household
householdsRouter.post('/leave', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const currentUser = await getUserWithHousehold(session.user.id)

  if (!currentUser?.householdId) {
    return c.json({ error: 'You are not in a household' }, 400)
  }

  // Update user's householdId to null
  await db
    .update(user)
    .set({ householdId: null, updatedAt: new Date() })
    .where(eq(user.id, session.user.id))

  return c.json({ data: { message: 'Successfully left household' } })
})

// PATCH /households/me - Update household name
householdsRouter.patch('/me', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const currentUser = await getUserWithHousehold(session.user.id)

  if (!currentUser?.householdId) {
    return c.json({ error: 'You are not in a household' }, 400)
  }

  const body = await c.req.json()
  const parsed = validate(renameHouseholdSchema, body)
  if (!parsed.success) {
    return c.json({ error: parsed.error }, 400)
  }
  const { name } = parsed.data

  const [updated] = await db
    .update(households)
    .set({ name: name.trim(), updatedAt: new Date() })
    .where(eq(households.id, currentUser.householdId))
    .returning()

  return c.json({
    data: {
      id: updated.id,
      name: updated.name,
      inviteCode: updated.inviteCode,
      createdAt: updated.createdAt,
    },
  })
})

// POST /households/regenerate-code - Generate new invite code
householdsRouter.post('/regenerate-code', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const currentUser = await getUserWithHousehold(session.user.id)

  if (!currentUser?.householdId) {
    return c.json({ error: 'You are not in a household' }, 400)
  }

  // Generate unique invite code
  let inviteCode = generateInviteCode()
  let attempts = 0
  while (attempts < 10) {
    const existing = await db.query.households.findFirst({
      where: eq(households.inviteCode, inviteCode),
    })
    if (!existing) break
    inviteCode = generateInviteCode()
    attempts++
  }

  const [updated] = await db
    .update(households)
    .set({ inviteCode, updatedAt: new Date() })
    .where(eq(households.id, currentUser.householdId))
    .returning()

  return c.json({
    data: {
      inviteCode: updated.inviteCode,
    },
  })
})

export default householdsRouter
