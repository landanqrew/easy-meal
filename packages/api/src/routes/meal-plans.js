import { Hono } from 'hono';
import { eq, and, gte, lt, max, asc } from 'drizzle-orm';
import { db } from '../db';
import { mealPlans, recipes } from '../db/schema';
import { user } from '../db/auth-schema';
import { auth } from '../lib/auth';
const mealPlansRouter = new Hono();
async function getSession(c) {
    return auth.api.getSession({ headers: c.req.raw.headers });
}
async function getUserWithHousehold(userId) {
    return db.query.user.findFirst({
        where: eq(user.id, userId),
    });
}
// GET / - Get meal plan entries for a week
mealPlansRouter.get('/', async (c) => {
    const session = await getSession(c);
    if (!session) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const currentUser = await getUserWithHousehold(session.user.id);
    if (!currentUser?.householdId) {
        return c.json({ error: 'You must be in a household to view meal plans' }, 400);
    }
    const weekStartParam = c.req.query('weekStart');
    let weekStart;
    if (weekStartParam) {
        weekStart = new Date(weekStartParam + 'T00:00:00Z');
    }
    else {
        // Default to current week's Monday
        const now = new Date();
        const day = now.getUTCDay();
        const diff = day === 0 ? -6 : 1 - day;
        weekStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + diff));
    }
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
    const entries = await db
        .select({
        id: mealPlans.id,
        recipeId: mealPlans.recipeId,
        date: mealPlans.date,
        mealType: mealPlans.mealType,
        sortOrder: mealPlans.sortOrder,
        recipeTitle: recipes.title,
        recipePrepTime: recipes.prepTime,
        recipeCookTime: recipes.cookTime,
        recipeType: recipes.type,
    })
        .from(mealPlans)
        .innerJoin(recipes, eq(mealPlans.recipeId, recipes.id))
        .where(and(eq(mealPlans.householdId, currentUser.householdId), gte(mealPlans.date, weekStart), lt(mealPlans.date, weekEnd)))
        .orderBy(asc(mealPlans.date), asc(mealPlans.mealType), asc(mealPlans.sortOrder));
    const data = entries.map((e) => ({
        id: e.id,
        recipeId: e.recipeId,
        date: e.date.toISOString(),
        mealType: e.mealType,
        sortOrder: e.sortOrder,
        recipe: {
            id: e.recipeId,
            title: e.recipeTitle,
            prepTime: e.recipePrepTime,
            cookTime: e.recipeCookTime,
            type: e.recipeType,
        },
    }));
    return c.json({ data });
});
// POST / - Assign a recipe to a meal slot (upsert)
mealPlansRouter.post('/', async (c) => {
    const session = await getSession(c);
    if (!session) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const currentUser = await getUserWithHousehold(session.user.id);
    if (!currentUser?.householdId) {
        return c.json({ error: 'You must be in a household to plan meals' }, 400);
    }
    const body = await c.req.json();
    const { recipeId, date, mealType } = body;
    if (!recipeId || !date || !mealType) {
        return c.json({ error: 'recipeId, date, and mealType are required' }, 400);
    }
    // Validate recipe belongs to household
    const recipe = await db.query.recipes.findFirst({
        where: and(eq(recipes.id, recipeId), eq(recipes.householdId, currentUser.householdId)),
    });
    if (!recipe) {
        return c.json({ error: 'Recipe not found in your household' }, 404);
    }
    const dateValue = new Date(date + 'T00:00:00Z');
    // Get max sortOrder for this slot
    const [maxResult] = await db
        .select({ maxSort: max(mealPlans.sortOrder) })
        .from(mealPlans)
        .where(and(eq(mealPlans.householdId, currentUser.householdId), eq(mealPlans.date, dateValue), eq(mealPlans.mealType, mealType)));
    const nextSortOrder = (maxResult?.maxSort ?? -1) + 1;
    const [entry] = await db
        .insert(mealPlans)
        .values({
        householdId: currentUser.householdId,
        recipeId,
        date: dateValue,
        mealType,
        sortOrder: nextSortOrder,
        createdByUserId: session.user.id,
        updatedByUserId: session.user.id,
    })
        .returning();
    return c.json({
        data: {
            id: entry.id,
            recipeId: entry.recipeId,
            date: entry.date.toISOString(),
            mealType: entry.mealType,
            sortOrder: entry.sortOrder,
            recipe: {
                id: recipe.id,
                title: recipe.title,
                prepTime: recipe.prepTime,
                cookTime: recipe.cookTime,
                type: recipe.type,
            },
        },
    }, 201);
});
// DELETE /:id - Remove a meal plan entry
mealPlansRouter.delete('/:id', async (c) => {
    const session = await getSession(c);
    if (!session) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const currentUser = await getUserWithHousehold(session.user.id);
    if (!currentUser?.householdId) {
        return c.json({ error: 'You must be in a household' }, 400);
    }
    const id = c.req.param('id');
    const entry = await db.query.mealPlans.findFirst({
        where: and(eq(mealPlans.id, id), eq(mealPlans.householdId, currentUser.householdId)),
    });
    if (!entry) {
        return c.json({ error: 'Meal plan entry not found' }, 404);
    }
    await db.delete(mealPlans).where(eq(mealPlans.id, id));
    return c.json({ data: { message: 'Meal plan entry removed' } });
});
export default mealPlansRouter;
