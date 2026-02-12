// Sentry error tracking initialization
// To enable: bun add @sentry/node and set SENTRY_DSN environment variable
let Sentry = null;
let initialized = false;
export function initSentry() {
    if (initialized)
        return;
    initialized = true;
    const dsn = process.env.SENTRY_DSN;
    if (!dsn) {
        if (process.env.NODE_ENV === 'production') {
            console.log('Warning: SENTRY_DSN not configured, error tracking disabled');
        }
        return;
    }
    // Try to require Sentry - will fail gracefully if not installed
    try {
        Sentry = require('@sentry/node');
        Sentry.init({
            dsn,
            environment: process.env.NODE_ENV || 'development',
            tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        });
        console.log('Sentry initialized for error tracking');
    }
    catch {
        if (process.env.NODE_ENV === 'production') {
            console.log('Warning: @sentry/node not installed, error tracking disabled');
        }
    }
}
export function captureException(error, context) {
    console.error('Error:', error.message, context);
    if (Sentry) {
        if (context) {
            Sentry.setContext('additional', context);
        }
        Sentry.captureException(error);
    }
}
export function captureMessage(message, level = 'info') {
    console.log(`[${level}] ${message}`);
    if (Sentry) {
        Sentry.captureMessage(message, level);
    }
}
