import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { sql } from 'drizzle-orm'
import type { HealthResponse, RecipePreferences } from '@easy-meal/shared'
import { db } from './db'
import { generateRecipe } from './services/ai'

const app = new Hono()

app.use('/*', cors())

app.get('/health', async (c) => {
  // Test database connection
  let dbStatus = 'disconnected'
  try {
    await db.execute(sql`SELECT 1`)
    dbStatus = 'connected'
  } catch {
    dbStatus = 'error'
  }

  const response: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
  }
  return c.json({ ...response, database: dbStatus })
})

// Recipe generation endpoint (for testing)
app.post('/recipes/generate', async (c) => {
  try {
    const preferences = await c.req.json<RecipePreferences>()
    const recipe = await generateRecipe(preferences)
    return c.json({ data: recipe })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

const port = process.env.PORT || 3001
console.log(`API server running on http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}
