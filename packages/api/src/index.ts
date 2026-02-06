import { Hono } from 'hono'
// cors import removed - handling CORS manually
import { sql } from 'drizzle-orm'
import type { HealthResponse } from '@easy-meal/shared'
import { db } from './db'
import { auth } from './lib/auth'
import { initSentry } from './lib/sentry'
import { errorHandler, rateLimit } from './middleware/error-handler'
import { requestSizeLimit } from './middleware/security'
import users from './routes/users'
import households from './routes/households'
import recipes from './routes/recipes'
import tags from './routes/tags'
import recipeLists from './routes/recipe-lists'
import groceryLists from './routes/grocery-lists'

// Initialize error tracking
initSentry()

const app = new Hono()

// CORS headers helper
const addCorsHeaders = (response: Response, origin: string): Response => {
  const headers = new Headers(response.headers)
  headers.set('Access-Control-Allow-Origin', origin)
  headers.set('Access-Control-Allow-Credentials', 'true')
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

// Handle ALL OPTIONS requests first (CORS preflight)
app.options('*', (c) => {
  const origin = c.req.header('origin') || '*'
  console.log('OPTIONS preflight for:', c.req.path, 'from origin:', origin)
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  })
})

// Add CORS headers to all responses
app.use('*', async (c, next) => {
  await next()
  const origin = c.req.header('origin') || '*'
  c.res.headers.set('Access-Control-Allow-Origin', origin)
  c.res.headers.set('Access-Control-Allow-Credentials', 'true')
})

// Global error handler
app.use('*', errorHandler)

// Request size limit (1MB)
app.use('/api/*', requestSizeLimit(1024 * 1024))

// Rate limiting for API routes (100 requests per minute)
app.use('/api/*', rateLimit({ windowMs: 60 * 1000, max: 100 }))

// Mount Better Auth handler
app.on(['POST', 'GET'], '/api/auth/*', async (c) => {
  const origin = c.req.header('origin') || '*'
  console.log('Auth request:', c.req.method, c.req.path, 'from origin:', origin)

  const response = await auth.handler(c.req.raw)
  return addCorsHeaders(response, origin)
})

// Mount API routes
app.route('/api/users', users)
app.route('/api/households', households)
app.route('/api/recipes', recipes)
app.route('/api/tags', tags)
app.route('/api/recipe-lists', recipeLists)
app.route('/api/grocery-lists', groceryLists)

// Request logging in production
if (process.env.NODE_ENV === 'production') {
  app.use('*', async (c, next) => {
    const start = Date.now()
    await next()
    const duration = Date.now() - start
    console.log(
      JSON.stringify({
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        duration,
        timestamp: new Date().toISOString(),
      })
    )
  })
}

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
