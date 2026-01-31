import type { Context, Next } from 'hono'
import { captureException } from '../lib/sentry'

export async function errorHandler(c: Context, next: Next) {
  try {
    await next()
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))

    // Log and capture the error
    captureException(err, {
      path: c.req.path,
      method: c.req.method,
      userId: (c as any).userId || 'anonymous',
    })

    // Return appropriate error response
    const status = (err as any).status || 500
    const message =
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message

    return c.json(
      {
        error: message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
      },
      status
    )
  }
}

// Rate limiting helper (simple in-memory implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(options: { windowMs: number; max: number }) {
  return async (c: Context, next: Next) => {
    const ip = c.req.header('x-forwarded-for') || 'unknown'
    const now = Date.now()

    let record = rateLimitStore.get(ip)

    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + options.windowMs }
      rateLimitStore.set(ip, record)
    }

    record.count++

    if (record.count > options.max) {
      return c.json({ error: 'Too many requests' }, 429)
    }

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      for (const [key, value] of rateLimitStore.entries()) {
        if (now > value.resetTime) {
          rateLimitStore.delete(key)
        }
      }
    }

    await next()
  }
}
