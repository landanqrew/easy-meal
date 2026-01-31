import type { Context, Next } from 'hono'

// Security headers middleware
export async function securityHeaders(c: Context, next: Next) {
  await next()

  // Prevent clickjacking
  c.header('X-Frame-Options', 'DENY')

  // Prevent MIME type sniffing
  c.header('X-Content-Type-Options', 'nosniff')

  // XSS protection (legacy, but still useful)
  c.header('X-XSS-Protection', '1; mode=block')

  // Referrer policy
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Content Security Policy for API
  c.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'")
}

// Request size limiter
export function requestSizeLimit(maxBytes: number) {
  return async (c: Context, next: Next) => {
    const contentLength = c.req.header('content-length')

    if (contentLength && parseInt(contentLength) > maxBytes) {
      return c.json({ error: 'Request too large' }, 413)
    }

    await next()
  }
}

// Input sanitization helpers
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return ''
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 10000) // Limit string length
}

export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return ''
  return email.toLowerCase().trim().slice(0, 255)
}

// Validate UUID format
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}
