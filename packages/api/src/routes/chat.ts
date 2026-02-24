import { Hono } from 'hono'
import { getSession, getUserWithHousehold } from '../lib/auth-helpers'
import { chatRecipeGeneration } from '../services/ai'
import { validate, chatRecipeSchema } from '../lib/validators'

const chatRouter = new Hono()

// POST /chat/recipe - Multi-turn chat for recipe generation
chatRouter.post('/recipe', async (c) => {
  const session = await getSession(c)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const currentUser = await getUserWithHousehold(session.user.id)

  if (!currentUser?.householdId) {
    return c.json({ error: 'You must be in a household to create recipes' }, 400)
  }

  try {
    const parsed = validate(chatRecipeSchema, await c.req.json())
    if (!parsed.success) {
      return c.json({ error: parsed.error }, 400)
    }
    const { messages } = parsed.data

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
