import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { user } from '../db/auth-schema';
import { auth } from '../lib/auth';
const users = new Hono();
// Middleware to require authentication
async function getSession(c) {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) {
        return null;
    }
    return session;
}
// GET /users/me - Get current user profile
users.get('/me', async (c) => {
    const session = await getSession(c);
    if (!session) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const currentUser = await db.query.user.findFirst({
        where: eq(user.id, session.user.id),
    });
    if (!currentUser) {
        return c.json({ error: 'User not found' }, 404);
    }
    return c.json({
        data: {
            id: currentUser.id,
            email: currentUser.email,
            name: currentUser.name,
            image: currentUser.image,
            householdId: currentUser.householdId,
            dietaryRestrictions: currentUser.dietaryRestrictions,
            preferences: currentUser.preferences,
            createdAt: currentUser.createdAt,
        },
    });
});
// PATCH /users/me - Update current user profile
users.patch('/me', async (c) => {
    const session = await getSession(c);
    if (!session) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const body = await c.req.json();
    const { name, dietaryRestrictions, preferences } = body;
    const updates = {};
    if (name !== undefined) {
        updates.name = name;
    }
    if (dietaryRestrictions !== undefined) {
        // Store as JSON string
        updates.dietaryRestrictions =
            typeof dietaryRestrictions === 'string'
                ? dietaryRestrictions
                : JSON.stringify(dietaryRestrictions);
    }
    if (preferences !== undefined) {
        // Store as JSON string
        updates.preferences =
            typeof preferences === 'string' ? preferences : JSON.stringify(preferences);
    }
    if (Object.keys(updates).length === 0) {
        return c.json({ error: 'No valid fields to update' }, 400);
    }
    updates.updatedAt = new Date();
    const [updated] = await db
        .update(user)
        .set(updates)
        .where(eq(user.id, session.user.id))
        .returning();
    return c.json({
        data: {
            id: updated.id,
            email: updated.email,
            name: updated.name,
            image: updated.image,
            householdId: updated.householdId,
            dietaryRestrictions: updated.dietaryRestrictions,
            preferences: updated.preferences,
            createdAt: updated.createdAt,
        },
    });
});
export default users;
