import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { user } from '../db/auth-schema'
import { auth } from '../lib/auth'
import { chatRecipeGeneration } from '../services/ai'
import type { ChatMessage } from '../services/ai'

const chatRouter = new Hono()

async function getSession(c: any) {
  return auth.api.getSession({ headers: c.req.raw.headers })
}

// POST /chat/recipe - Multi-turn chat for recipe generation
chatRouter.post('/recipe', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  })

  if (!currentUser?.householdId) {
    return c.json({ error: 'You must be in a household to create recipes' }, 400)
  }

  try {
    const { messages } = await c.req.json<{ messages: ChatMessage[] }>()

    if (!messages?.length) {
      return c.json({ error: 'Messages are required' }, 400)
    }

    // Parse user's dietary restrictions
    let dietaryRestrictions: string[] | undefined
    if (currentUser.dietaryRestrictions) {
      try {
        const parsed = JSON.parse(currentUser.dietaryRestrictions)
        if (Array.isArray(parsed) && parsed.length > 0) {
          dietaryRestrictions = parsed
        }
      } catch {}
    }

    const result = await chatRecipeGeneration(messages, dietaryRestrictions)
    return c.json({ data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Chat failed'
    return c.json({ error: message }, 500)
  }
})

export default chatRouter
