import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '../db'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
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
