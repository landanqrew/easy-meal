import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { HealthResponse } from '@easy-meal/shared'

const app = new Hono()

app.use('/*', cors())

app.get('/health', (c) => {
  const response: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
  }
  return c.json(response)
})

const port = process.env.PORT || 3001
console.log(`API server running on http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}
