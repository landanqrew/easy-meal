import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '../db'

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      prompt: 'select_account',
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day - update session expiry if older than this
  },
  user: {
    additionalFields: {
      householdId: {
        type: 'string',
        required: false,
        input: false,
      },
      dietaryRestrictions: {
        type: 'string', // JSON string array
        required: false,
        defaultValue: '[]',
        input: false,
      },
      preferences: {
        type: 'string', // JSON object
        required: false,
        defaultValue: '{}',
        input: false,
      },
    },
  },
})
