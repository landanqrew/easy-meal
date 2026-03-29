import { describe, test, expect, beforeEach } from 'bun:test'
import { Hono } from 'hono'
import { rateLimit } from './error-handler'
import { requestSizeLimit } from './security'

describe('rateLimit', () => {
  test('allows requests under the limit', async () => {
    const app = new Hono()
    // Use a unique header to avoid collisions with other tests
    app.use('*', rateLimit({ windowMs: 60000, max: 5 }))
    app.get('/test', (c) => c.json({ ok: true }))

    const res = await app.request('/test', {
      headers: { 'x-forwarded-for': 'rate-test-under-limit' },
    })
    expect(res.status).toBe(200)
  })

  test('returns 429 when limit is exceeded', async () => {
    const app = new Hono()
    app.use('*', rateLimit({ windowMs: 60000, max: 3 }))
    app.get('/test', (c) => c.json({ ok: true }))

    const ip = `rate-test-exceed-${Date.now()}`

    // Make requests up to the limit
    for (let i = 0; i < 3; i++) {
      const res = await app.request('/test', {
        headers: { 'x-forwarded-for': ip },
      })
      expect(res.status).toBe(200)
    }

    // Next request should be rate limited
    const res = await app.request('/test', {
      headers: { 'x-forwarded-for': ip },
    })
    expect(res.status).toBe(429)
    const json = await res.json()
    expect(json.error).toBe('Too many requests')
  })

  test('resets after window expires', async () => {
    const app = new Hono()
    app.use('*', rateLimit({ windowMs: 50, max: 1 }))
    app.get('/test', (c) => c.json({ ok: true }))

    const ip = `rate-test-reset-${Date.now()}`

    // First request succeeds
    const res1 = await app.request('/test', {
      headers: { 'x-forwarded-for': ip },
    })
    expect(res1.status).toBe(200)

    // Second is rate limited
    const res2 = await app.request('/test', {
      headers: { 'x-forwarded-for': ip },
    })
    expect(res2.status).toBe(429)

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 60))

    // Should succeed again
    const res3 = await app.request('/test', {
      headers: { 'x-forwarded-for': ip },
    })
    expect(res3.status).toBe(200)
  })
})

describe('requestSizeLimit', () => {
  test('allows requests under the limit', async () => {
    const app = new Hono()
    app.use('*', requestSizeLimit(1024))
    app.post('/test', (c) => c.json({ ok: true }))

    const res = await app.request('/test', {
      method: 'POST',
      headers: { 'content-length': '100' },
    })
    expect(res.status).toBe(200)
  })

  test('rejects requests over the limit', async () => {
    const app = new Hono()
    app.use('*', requestSizeLimit(1024))
    app.post('/test', (c) => c.json({ ok: true }))

    const res = await app.request('/test', {
      method: 'POST',
      headers: { 'content-length': '2048' },
    })
    expect(res.status).toBe(413)
    const json = await res.json()
    expect(json.error).toBe('Request too large')
  })

  test('allows requests with no content-length header', async () => {
    const app = new Hono()
    app.use('*', requestSizeLimit(1024))
    app.get('/test', (c) => c.json({ ok: true }))

    const res = await app.request('/test')
    expect(res.status).toBe(200)
  })
})
