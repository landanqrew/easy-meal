import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { recipes, recipeIngredients, ingredients, recipeTags, tags } from '../db/schema';
import { user } from '../db/auth-schema';
import { auth } from '../lib/auth';
import { generateRecipe } from '../services/ai';
const recipesRouter = new Hono();
async function getSession(c) {
    return auth.api.getSession({ headers: c.req.raw.headers });
}
async function getUserWithHousehold(userId) {
    return db.query.user.findFirst({
        where: eq(user.id, userId),
    });
}
// POST /recipes/generate - Generate a new recipe with AI
recipesRouter.post('/generate', async (c) => {
    const session = await getSession(c);
    if (!session) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const currentUser = await getUserWithHousehold(session.user.id);
    if (!currentUser?.householdId) {
        return c.json({ error: 'You must be in a household to create recipes' }, 400);
    }
    try {
        const preferences = await c.req.json();
        // Add user's dietary restrictions if not specified
        if (!preferences.dietaryRestrictions?.length && currentUser.dietaryRestrictions) {
            try {
                const restrictions = JSON.parse(currentUser.dietaryRestrictions);
                if (Array.isArray(restrictions) && restrictions.length > 0) {
                    preferences.dietaryRestrictions = restrictions;
                }
            }
            catch { }
        }
        const recipe = await generateRecipe(preferences);
        return c.json({ data: recipe });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate recipe';
        return c.json({ error: message }, 500);
    }
});
// POST /recipes - Save a generated recipe to the household
recipesRouter.post('/', async (c) => {
    const session = await getSession(c);
    if (!session) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const currentUser = await getUserWithHousehold(session.user.id);
    if (!currentUser?.householdId) {
        return c.json({ error: 'You must be in a household to save recipes' }, 400);
    }
    const body = await c.req.json();
    const { title, description, servings, prepTime, cookTime, cuisine, instructions, ingredients: recipeIngs, source = 'ai_generated' } = body;
    if (!title) {
        return c.json({ error: 'Recipe title is required' }, 400);
    }
    // Create the recipe
    const [recipe] = await db
        .insert(recipes)
        .values({
        householdId: currentUser.householdId,
        title,
        description,
        servings: servings || 4,
        prepTime,
        cookTime,
        cuisine,
        instructions: instructions || [],
        source,
        createdByUserId: session.user.id,
        updatedByUserId: session.user.id,
    })
        .returning();
    // Add ingredients if provided
    if (recipeIngs && Array.isArray(recipeIngs)) {
        for (const ing of recipeIngs) {
            // Find or create ingredient
            let ingredient = await db.query.ingredients.findFirst({
                where: eq(ingredients.name, ing.name.toLowerCase()),
            });
            if (!ingredient) {
                const [newIng] = await db
                    .insert(ingredients)
                    .values({
                    name: ing.name.toLowerCase(),
                    category: ing.category || 'other',
                    createdByUserId: session.user.id,
                    updatedByUserId: session.user.id,
                })
                    .returning();
                ingredient = newIng;
            }
            // Add recipe ingredient
            await db.insert(recipeIngredients).values({
                recipeId: recipe.id,
                ingredientId: ingredient.id,
                quantity: String(ing.quantity),
                unit: ing.unit,
                preparation: ing.preparation,
                createdByUserId: session.user.id,
                updatedByUserId: session.user.id,
            });
        }
    }
    return c.json({ data: recipe }, 201);
});
// GET /recipes - List all recipes in the household
recipesRouter.get('/', async (c) => {
    const session = await getSession(c);
    if (!session) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const currentUser = await getUserWithHousehold(session.user.id);
    if (!currentUser?.householdId) {
        return c.json({ error: 'You must be in a household to view recipes' }, 400);
    }
    const householdRecipes = await db.query.recipes.findMany({
        where: eq(recipes.householdId, currentUser.householdId),
        orderBy: [desc(recipes.createdAt)],
        with: {
            recipeTags: {
                with: {
                    tag: true,
                },
            },
            createdBy: true,
        },
    });
    return c.json({
        data: householdRecipes.map((r) => ({
            id: r.id,
            title: r.title,
            description: r.description,
            servings: r.servings,
            prepTime: r.prepTime,
            cookTime: r.cookTime,
            cuisine: r.cuisine,
            source: r.source,
            createdAt: r.createdAt,
            createdBy: r.createdBy ? { id: r.createdBy.id, name: r.createdBy.name } : null,
            tags: r.recipeTags.map((rt) => ({
                id: rt.tag.id,
                name: rt.tag.name,
                color: rt.tag.color,
            })),
        })),
    });
});
// GET /recipes/:id - Get a single recipe with full details
recipesRouter.get('/:id', async (c) => {
    const session = await getSession(c);
    if (!session) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const currentUser = await getUserWithHousehold(session.user.id);
    if (!currentUser?.householdId) {
        return c.json({ error: 'You must be in a household to view recipes' }, 400);
    }
    const recipeId = c.req.param('id');
    const recipe = await db.query.recipes.findFirst({
        where: and(eq(recipes.id, recipeId), eq(recipes.householdId, currentUser.householdId)),
        with: {
            recipeIngredients: {
                with: {
                    ingredient: true,
                },
            },
            recipeTags: {
                with: {
                    tag: true,
                },
            },
            createdBy: true,
        },
    });
    if (!recipe) {
        return c.json({ error: 'Recipe not found' }, 404);
    }
    return c.json({
        data: {
            id: recipe.id,
            title: recipe.title,
            description: recipe.description,
            servings: recipe.servings,
            prepTime: recipe.prepTime,
            cookTime: recipe.cookTime,
            cuisine: recipe.cuisine,
            instructions: recipe.instructions,
            source: recipe.source,
            createdAt: recipe.createdAt,
            updatedAt: recipe.updatedAt,
            createdBy: recipe.createdBy ? { id: recipe.createdBy.id, name: recipe.createdBy.name } : null,
            ingredients: recipe.recipeIngredients.map((ri) => ({
                id: ri.ingredient.id,
                name: ri.ingredient.name,
                quantity: ri.quantity,
                unit: ri.unit,
                preparation: ri.preparation,
                category: ri.ingredient.category,
            })),
            tags: recipe.recipeTags.map((rt) => ({
                id: rt.tag.id,
                name: rt.tag.name,
                color: rt.tag.color,
            })),
        },
    });
});
// PATCH /recipes/:id - Update a recipe
recipesRouter.patch('/:id', async (c) => {
    const session = await getSession(c);
    if (!session) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const currentUser = await getUserWithHousehold(session.user.id);
    if (!currentUser?.householdId) {
        return c.json({ error: 'You must be in a household to edit recipes' }, 400);
    }
    const recipeId = c.req.param('id');
    // Verify recipe belongs to household
    const existing = await db.query.recipes.findFirst({
        where: and(eq(recipes.id, recipeId), eq(recipes.householdId, currentUser.householdId)),
    });
    if (!existing) {
        return c.json({ error: 'Recipe not found' }, 404);
    }
    const body = await c.req.json();
    const { title, description, servings, prepTime, cookTime, cuisine, instructions } = body;
    const updates = { updatedAt: new Date(), updatedByUserId: session.user.id };
    if (title !== undefined)
        updates.title = title;
    if (description !== undefined)
        updates.description = description;
    if (servings !== undefined)
        updates.servings = servings;
    if (prepTime !== undefined)
        updates.prepTime = prepTime;
    if (cookTime !== undefined)
        updates.cookTime = cookTime;
    if (cuisine !== undefined)
        updates.cuisine = cuisine;
    if (instructions !== undefined)
        updates.instructions = instructions;
    const [updated] = await db
        .update(recipes)
        .set(updates)
        .where(eq(recipes.id, recipeId))
        .returning();
    return c.json({ data: updated });
});
// DELETE /recipes/:id - Delete a recipe
recipesRouter.delete('/:id', async (c) => {
    const session = await getSession(c);
    if (!session) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const currentUser = await getUserWithHousehold(session.user.id);
    if (!currentUser?.householdId) {
        return c.json({ error: 'You must be in a household to delete recipes' }, 400);
    }
    const recipeId = c.req.param('id');
    // Verify recipe belongs to household
    const existing = await db.query.recipes.findFirst({
        where: and(eq(recipes.id, recipeId), eq(recipes.householdId, currentUser.householdId)),
    });
    if (!existing) {
        return c.json({ error: 'Recipe not found' }, 404);
    }
    await db.delete(recipes).where(eq(recipes.id, recipeId));
    return c.json({ data: { message: 'Recipe deleted' } });
});
// POST /recipes/:id/tags - Add a tag to a recipe
recipesRouter.post('/:id/tags', async (c) => {
    const session = await getSession(c);
    if (!session) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const currentUser = await getUserWithHousehold(session.user.id);
    if (!currentUser?.householdId) {
        return c.json({ error: 'You must be in a household' }, 400);
    }
    const recipeId = c.req.param('id');
    const { tagId } = await c.req.json();
    // Verify recipe and tag belong to household
    const recipe = await db.query.recipes.findFirst({
        where: and(eq(recipes.id, recipeId), eq(recipes.householdId, currentUser.householdId)),
    });
    const tag = await db.query.tags.findFirst({
        where: and(eq(tags.id, tagId), eq(tags.householdId, currentUser.householdId)),
    });
    if (!recipe || !tag) {
        return c.json({ error: 'Recipe or tag not found' }, 404);
    }
    // Check if already tagged
    const existing = await db.query.recipeTags.findFirst({
        where: and(eq(recipeTags.recipeId, recipeId), eq(recipeTags.tagId, tagId)),
    });
    if (existing) {
        return c.json({ error: 'Tag already added' }, 400);
    }
    await db.insert(recipeTags).values({
        recipeId,
        tagId,
        createdByUserId: session.user.id,
        updatedByUserId: session.user.id,
    });
    return c.json({ data: { message: 'Tag added' } }, 201);
});
// DELETE /recipes/:id/tags/:tagId - Remove a tag from a recipe
recipesRouter.delete('/:id/tags/:tagId', async (c) => {
    const session = await getSession(c);
    if (!session) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const recipeId = c.req.param('id');
    const tagId = c.req.param('tagId');
    await db.delete(recipeTags).where(and(eq(recipeTags.recipeId, recipeId), eq(recipeTags.tagId, tagId)));
    return c.json({ data: { message: 'Tag removed' } });
});
export default recipesRouter;
