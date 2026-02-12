import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { tags } from '../db/schema';
import { user } from '../db/auth-schema';
import { auth } from '../lib/auth';
const tagsRouter = new Hono();
async function getSession(c) {
    return auth.api.getSession({ headers: c.req.raw.headers });
}
async function getUserWithHousehold(userId) {
    return db.query.user.findFirst({
        where: eq(user.id, userId),
    });
}
// GET /tags - List all tags in the household
tagsRouter.get('/', async (c) => {
    const session = await getSession(c);
    if (!session) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const currentUser = await getUserWithHousehold(session.user.id);
    if (!currentUser?.householdId) {
        return c.json({ error: 'You must be in a household to view tags' }, 400);
    }
    const householdTags = await db.query.tags.findMany({
        where: eq(tags.householdId, currentUser.householdId),
        orderBy: (tags, { asc }) => [asc(tags.name)],
    });
    return c.json({
        data: householdTags.map((t) => ({
            id: t.id,
            name: t.name,
            color: t.color,
        })),
    });
});
// POST /tags - Create a new tag
tagsRouter.post('/', async (c) => {
    const session = await getSession(c);
    if (!session) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const currentUser = await getUserWithHousehold(session.user.id);
    if (!currentUser?.householdId) {
        return c.json({ error: 'You must be in a household to create tags' }, 400);
    }
    const { name, color } = await c.req.json();
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return c.json({ error: 'Tag name is required' }, 400);
    }
    // Check for duplicate
    const existing = await db.query.tags.findFirst({
        where: and(eq(tags.householdId, currentUser.householdId), eq(tags.name, name.trim().toLowerCase())),
    });
    if (existing) {
        return c.json({ error: 'Tag already exists' }, 409);
    }
    const [tag] = await db
        .insert(tags)
        .values({
        householdId: currentUser.householdId,
        name: name.trim().toLowerCase(),
        color: color || null,
        createdByUserId: session.user.id,
        updatedByUserId: session.user.id,
    })
        .returning();
    return c.json({
        data: {
            id: tag.id,
            name: tag.name,
            color: tag.color,
        },
    }, 201);
});
// PATCH /tags/:id - Update a tag
tagsRouter.patch('/:id', async (c) => {
    const session = await getSession(c);
    if (!session) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const currentUser = await getUserWithHousehold(session.user.id);
    if (!currentUser?.householdId) {
        return c.json({ error: 'You must be in a household' }, 400);
    }
    const tagId = c.req.param('id');
    const existing = await db.query.tags.findFirst({
        where: and(eq(tags.id, tagId), eq(tags.householdId, currentUser.householdId)),
    });
    if (!existing) {
        return c.json({ error: 'Tag not found' }, 404);
    }
    const { name, color } = await c.req.json();
    const updates = {
        updatedAt: new Date(),
        updatedByUserId: session.user.id,
    };
    if (name !== undefined) {
        updates.name = name.trim().toLowerCase();
    }
    if (color !== undefined) {
        updates.color = color;
    }
    const [updated] = await db
        .update(tags)
        .set(updates)
        .where(eq(tags.id, tagId))
        .returning();
    return c.json({
        data: {
            id: updated.id,
            name: updated.name,
            color: updated.color,
        },
    });
});
// DELETE /tags/:id - Delete a tag
tagsRouter.delete('/:id', async (c) => {
    const session = await getSession(c);
    if (!session) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const currentUser = await getUserWithHousehold(session.user.id);
    if (!currentUser?.householdId) {
        return c.json({ error: 'You must be in a household' }, 400);
    }
    const tagId = c.req.param('id');
    const existing = await db.query.tags.findFirst({
        where: and(eq(tags.id, tagId), eq(tags.householdId, currentUser.householdId)),
    });
    if (!existing) {
        return c.json({ error: 'Tag not found' }, 404);
    }
    await db.delete(tags).where(eq(tags.id, tagId));
    return c.json({ data: { message: 'Tag deleted' } });
});
export default tagsRouter;
