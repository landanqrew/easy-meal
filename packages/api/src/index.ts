import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { sql } from 'drizzle-orm'
import type { HealthResponse } from '@easy-meal/shared'
import { db } from './db'
import { auth } from './lib/auth'
import users from './routes/users'
import households from './routes/households'
import recipes from './routes/recipes'
import tags from './routes/tags'
import recipeLists from './routes/recipe-lists'
import groceryLists from './routes/grocery-lists'

const app = new Hono()

// CORS config for authenticated routes
const corsConfig = cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['POST', 'GET', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
})

app.use('/api/*', corsConfig)
app.use('/*', cors())

// Mount Better Auth handler
app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  return auth.handler(c.req.raw)
})

// Mount API routes
app.route('/api/users', users)
app.route('/api/households', households)
app.route('/api/recipes', recipes)
app.route('/api/tags', tags)
app.route('/api/recipe-lists', recipeLists)
app.route('/api/grocery-lists', groceryLists)

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

const port = process.env.PORT || 3001
console.log(`API server running on http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}
