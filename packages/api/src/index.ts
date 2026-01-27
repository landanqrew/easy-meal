import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { sql } from 'drizzle-orm'
import type { HealthResponse, RecipePreferences } from '@easy-meal/shared'
import { db } from './db'
import { generateRecipe } from './services/ai'
import { auth } from './lib/auth'

const app = new Hono()

// CORS must be before auth routes
app.use(
  '/api/auth/*',
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    credentials: true,
  })
)

app.use('/*', cors())

// Mount Better Auth handler
app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  return auth.handler(c.req.raw)
})

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
