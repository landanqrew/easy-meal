import { eq } from 'drizzle-orm'
import { db } from '../db'
import { user } from '../db/auth-schema'
import { auth } from './auth'

export async function getSession(c: any) {
  return auth.api.getSession({ headers: c.req.raw.headers })
}

export async function getUserWithHousehold(userId: string) {
  return db.query.user.findFirst({
    where: eq(user.id, userId),
  })
}
