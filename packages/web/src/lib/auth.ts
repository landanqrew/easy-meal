import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: import.meta.env.DEV
    ? 'http://localhost:3001'
    : window.location.origin,
})

export const { signIn, signUp, signOut, useSession } = authClient
