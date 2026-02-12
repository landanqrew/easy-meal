import { captureException } from '../lib/sentry';
export async function errorHandler(c, next) {
    try {
        await next();
    }
    catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        // Always log full error to console for debugging
        console.error('API Error:', {
            path: c.req.path,
            method: c.req.method,
            message: err.message,
            stack: err.stack,
        });
        // Capture in Sentry if configured
        captureException(err, {
            path: c.req.path,
            method: c.req.method,
            userId: c.userId || 'anonymous',
        });
        // Return appropriate error response
        const status = err.status || 500;
        const message = process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : err.message;
        return c.json({
            error: message,
            ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
        }, status);
    }
}
// Rate limiting helper (simple in-memory implementation)
const rateLimitStore = new Map();
export function rateLimit(options) {
    return async (c, next) => {
        const ip = c.req.header('x-forwarded-for') || 'unknown';
        const now = Date.now();
        let record = rateLimitStore.get(ip);
        if (!record || now > record.resetTime) {
            record = { count: 0, resetTime: now + options.windowMs };
            rateLimitStore.set(ip, record);
        }
        record.count++;
        if (record.count > options.max) {
            return c.json({ error: 'Too many requests' }, 429);
        }
        // Clean up old entries periodically
        if (Math.random() < 0.01) {
            for (const [key, value] of rateLimitStore.entries()) {
                if (now > value.resetTime) {
                    rateLimitStore.delete(key);
                }
            }
        }
        await next();
    };
}
