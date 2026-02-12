import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
  jsonb,
  pgEnum,
  primaryKey,
  unique,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { user } from './auth-schema'

// ============================================================================
// ENUMS
// ============================================================================

export const ingredientCategoryEnum = pgEnum('ingredient_category', [
  'produce',
  'dairy',
  'meat',
  'seafood',
  'pantry',
  'frozen',
  'bakery',
  'beverages',
  'other',
])

export const recipeSourceEnum = pgEnum('recipe_source', [
  'ai_generated',
  'manual',
  'imported',
])

export const groceryListStatusEnum = pgEnum('grocery_list_status', [
  'active',
  'completed',
  'archived',
])

export const mealTypeEnum = pgEnum('meal_type', [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
])

// ============================================================================
// HOUSEHOLDS
// ============================================================================

export const households = pgTable(
  'households',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    inviteCode: varchar('invite_code', { length: 20 }).unique().notNull(),

    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    createdByUserId: uuid('created_by_user_id'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    updatedByUserId: uuid('updated_by_user_id'),
  },
  (table) => [index('idx_households_invite_code').on(table.inviteCode)]
)

// ============================================================================
// USERS - Managed by Better Auth (see auth-schema.ts)
// The 'user' table is created by Better Auth with these custom fields:
// - householdId: text (reference to households)
// - dietaryRestrictions: text (JSON string)
// - preferences: text (JSON string)
// ============================================================================

// ============================================================================
// INGREDIENTS
// ============================================================================

export const ingredients = pgTable(
  'ingredients',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).unique().notNull(),
    category: ingredientCategoryEnum('category').default('other').notNull(),
    defaultUnit: varchar('default_unit', { length: 50 }),

    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    createdByUserId: text('created_by_user_id').references(() => user.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    updatedByUserId: text('updated_by_user_id').references(() => user.id, { onDelete: 'set null' }),
  },
  (table) => [
    index('idx_ingredients_name').on(table.name),
    index('idx_ingredients_category').on(table.category),
  ]
)

// ============================================================================
// RECIPES
// ============================================================================

export const recipes = pgTable(
  'recipes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    householdId: uuid('household_id')
      .references(() => households.id, { onDelete: 'cascade' })
      .notNull(),

    // Recipe details
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    servings: integer('servings').default(4).notNull(),
    instructions: jsonb('instructions').default([]).notNull(), // [{step_number, text}]
    cuisine: varchar('cuisine', { length: 100 }),
    prepTime: integer('prep_time'), // minutes
    cookTime: integer('cook_time'), // minutes
    source: recipeSourceEnum('source').default('manual').notNull(),

    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    createdByUserId: text('created_by_user_id').references(() => user.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    updatedByUserId: text('updated_by_user_id').references(() => user.id, { onDelete: 'set null' }),
  },
  (table) => [
    index('idx_recipes_household_id').on(table.householdId),
    index('idx_recipes_cuisine').on(table.cuisine),
    index('idx_recipes_source').on(table.source),
    index('idx_recipes_created_at').on(table.createdAt),
  ]
)

// ============================================================================
// RECIPE INGREDIENTS
// ============================================================================

export const recipeIngredients = pgTable(
  'recipe_ingredients',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    recipeId: uuid('recipe_id')
      .references(() => recipes.id, { onDelete: 'cascade' })
      .notNull(),
    ingredientId: uuid('ingredient_id')
      .references(() => ingredients.id, { onDelete: 'restrict' })
      .notNull(),

    quantity: decimal('quantity', { precision: 10, scale: 3 }).notNull(),
    unit: varchar('unit', { length: 50 }).notNull(),
    preparation: varchar('preparation', { length: 100 }), // "diced", "minced", etc.

    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    createdByUserId: text('created_by_user_id').references(() => user.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    updatedByUserId: text('updated_by_user_id').references(() => user.id, { onDelete: 'set null' }),
  },
  (table) => [
    unique('unique_recipe_ingredient').on(table.recipeId, table.ingredientId),
    index('idx_recipe_ingredients_recipe_id').on(table.recipeId),
    index('idx_recipe_ingredients_ingredient_id').on(table.ingredientId),
  ]
)

// ============================================================================
// TAGS
// ============================================================================

export const tags = pgTable(
  'tags',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    householdId: uuid('household_id')
      .references(() => households.id, { onDelete: 'cascade' })
      .notNull(),

    name: varchar('name', { length: 100 }).notNull(),
    color: varchar('color', { length: 7 }), // hex color like #FF5733

    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    createdByUserId: text('created_by_user_id').references(() => user.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    updatedByUserId: text('updated_by_user_id').references(() => user.id, { onDelete: 'set null' }),
  },
  (table) => [
    unique('unique_tag_per_household').on(table.householdId, table.name),
    index('idx_tags_household_id').on(table.householdId),
  ]
)

// ============================================================================
// RECIPE TAGS (many-to-many)
// ============================================================================

export const recipeTags = pgTable(
  'recipe_tags',
  {
    recipeId: uuid('recipe_id')
      .references(() => recipes.id, { onDelete: 'cascade' })
      .notNull(),
    tagId: uuid('tag_id')
      .references(() => tags.id, { onDelete: 'cascade' })
      .notNull(),

    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    createdByUserId: text('created_by_user_id').references(() => user.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    updatedByUserId: text('updated_by_user_id').references(() => user.id, { onDelete: 'set null' }),
  },
  (table) => [
    primaryKey({ columns: [table.recipeId, table.tagId] }),
    index('idx_recipe_tags_tag_id').on(table.tagId),
  ]
)

// ============================================================================
// RECIPE LISTS (personal collections)
// ============================================================================

export const recipeLists = pgTable(
  'recipe_lists',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    householdId: uuid('household_id')
      .references(() => households.id, { onDelete: 'cascade' })
      .notNull(),

    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    position: integer('position').default(0).notNull(),

    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    createdByUserId: text('created_by_user_id').references(() => user.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    updatedByUserId: text('updated_by_user_id').references(() => user.id, { onDelete: 'set null' }),
  },
  (table) => [
    index('idx_recipe_lists_user_id').on(table.userId),
    index('idx_recipe_lists_household_id').on(table.householdId),
  ]
)

// ============================================================================
// RECIPE LIST ITEMS (many-to-many)
// ============================================================================

export const recipeListItems = pgTable(
  'recipe_list_items',
  {
    recipeListId: uuid('recipe_list_id')
      .references(() => recipeLists.id, { onDelete: 'cascade' })
      .notNull(),
    recipeId: uuid('recipe_id')
      .references(() => recipes.id, { onDelete: 'cascade' })
      .notNull(),

    position: integer('position').default(0).notNull(),

    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    createdByUserId: text('created_by_user_id').references(() => user.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    updatedByUserId: text('updated_by_user_id').references(() => user.id, { onDelete: 'set null' }),
  },
  (table) => [
    primaryKey({ columns: [table.recipeListId, table.recipeId] }),
    index('idx_recipe_list_items_recipe_id').on(table.recipeId),
  ]
)

// ============================================================================
// GROCERY LISTS
// ============================================================================

export const groceryLists = pgTable(
  'grocery_lists',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    householdId: uuid('household_id')
      .references(() => households.id, { onDelete: 'cascade' })
      .notNull(),

    name: varchar('name', { length: 255 }).notNull(),
    status: groceryListStatusEnum('status').default('active').notNull(),

    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    createdByUserId: text('created_by_user_id').references(() => user.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    updatedByUserId: text('updated_by_user_id').references(() => user.id, { onDelete: 'set null' }),
  },
  (table) => [
    index('idx_grocery_lists_household_id').on(table.householdId),
    index('idx_grocery_lists_status').on(table.status),
    index('idx_grocery_lists_created_at').on(table.createdAt),
  ]
)

// ============================================================================
// GROCERY LIST ITEMS
// ============================================================================

export const groceryListItems = pgTable(
  'grocery_list_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    groceryListId: uuid('grocery_list_id')
      .references(() => groceryLists.id, { onDelete: 'cascade' })
      .notNull(),
    ingredientId: uuid('ingredient_id')
      .references(() => ingredients.id, { onDelete: 'restrict' })
      .notNull(),

    quantity: decimal('quantity', { precision: 10, scale: 3 }).notNull(),
    unit: varchar('unit', { length: 50 }).notNull(),
    isChecked: boolean('is_checked').default(false).notNull(),

    // Source tracking for aggregation
    recipeId: uuid('recipe_id').references(() => recipes.id, { onDelete: 'set null' }),
    originalServings: integer('original_servings'),
    scaledServings: integer('scaled_servings'),

    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    createdByUserId: text('created_by_user_id').references(() => user.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    updatedByUserId: text('updated_by_user_id').references(() => user.id, { onDelete: 'set null' }),
  },
  (table) => [
    index('idx_grocery_list_items_grocery_list_id').on(table.groceryListId),
    index('idx_grocery_list_items_ingredient_id').on(table.ingredientId),
    index('idx_grocery_list_items_is_checked').on(table.isChecked),
  ]
)

// ============================================================================
// MEAL PLANS
// ============================================================================

export const mealPlans = pgTable(
  'meal_plans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    householdId: uuid('household_id')
      .references(() => households.id, { onDelete: 'cascade' })
      .notNull(),
    recipeId: uuid('recipe_id')
      .references(() => recipes.id, { onDelete: 'cascade' })
      .notNull(),
    date: timestamp('date', { withTimezone: true, mode: 'date' }).notNull(),
    mealType: mealTypeEnum('meal_type').notNull(),

    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    createdByUserId: text('created_by_user_id').references(() => user.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    updatedByUserId: text('updated_by_user_id').references(() => user.id, { onDelete: 'set null' }),
  },
  (table) => [
    unique('unique_meal_plan_slot').on(table.householdId, table.date, table.mealType),
    index('idx_meal_plans_household_id').on(table.householdId),
    index('idx_meal_plans_date').on(table.date),
    index('idx_meal_plans_household_date').on(table.householdId, table.date),
  ]
)

// ============================================================================
// RELATIONS
// ============================================================================

export const householdsRelations = relations(households, ({ many }) => ({
  recipes: many(recipes),
  tags: many(tags),
  recipeLists: many(recipeLists),
  groceryLists: many(groceryLists),
  mealPlans: many(mealPlans),
}))

export const ingredientsRelations = relations(ingredients, ({ many }) => ({
  recipeIngredients: many(recipeIngredients),
  groceryListItems: many(groceryListItems),
}))

export const recipesRelations = relations(recipes, ({ one, many }) => ({
  household: one(households, {
    fields: [recipes.householdId],
    references: [households.id],
  }),
  createdBy: one(user, {
    fields: [recipes.createdByUserId],
    references: [user.id],
  }),
  recipeIngredients: many(recipeIngredients),
  recipeTags: many(recipeTags),
  recipeListItems: many(recipeListItems),
  mealPlans: many(mealPlans),
}))

export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeIngredients.recipeId],
    references: [recipes.id],
  }),
  ingredient: one(ingredients, {
    fields: [recipeIngredients.ingredientId],
    references: [ingredients.id],
  }),
}))

export const tagsRelations = relations(tags, ({ one, many }) => ({
  household: one(households, {
    fields: [tags.householdId],
    references: [households.id],
  }),
  recipeTags: many(recipeTags),
}))

export const recipeTagsRelations = relations(recipeTags, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeTags.recipeId],
    references: [recipes.id],
  }),
  tag: one(tags, {
    fields: [recipeTags.tagId],
    references: [tags.id],
  }),
}))

export const recipeListsRelations = relations(recipeLists, ({ one, many }) => ({
  owner: one(user, {
    fields: [recipeLists.userId],
    references: [user.id],
  }),
  household: one(households, {
    fields: [recipeLists.householdId],
    references: [households.id],
  }),
  items: many(recipeListItems),
}))

export const recipeListItemsRelations = relations(recipeListItems, ({ one }) => ({
  recipeList: one(recipeLists, {
    fields: [recipeListItems.recipeListId],
    references: [recipeLists.id],
  }),
  recipe: one(recipes, {
    fields: [recipeListItems.recipeId],
    references: [recipes.id],
  }),
}))

export const groceryListsRelations = relations(groceryLists, ({ one, many }) => ({
  household: one(households, {
    fields: [groceryLists.householdId],
    references: [households.id],
  }),
  items: many(groceryListItems),
}))

export const groceryListItemsRelations = relations(groceryListItems, ({ one }) => ({
  groceryList: one(groceryLists, {
    fields: [groceryListItems.groceryListId],
    references: [groceryLists.id],
  }),
  ingredient: one(ingredients, {
    fields: [groceryListItems.ingredientId],
    references: [ingredients.id],
  }),
  recipe: one(recipes, {
    fields: [groceryListItems.recipeId],
    references: [recipes.id],
  }),
}))

export const mealPlansRelations = relations(mealPlans, ({ one }) => ({
  household: one(households, {
    fields: [mealPlans.householdId],
    references: [households.id],
  }),
  recipe: one(recipes, {
    fields: [mealPlans.recipeId],
    references: [recipes.id],
  }),
  createdBy: one(user, {
    fields: [mealPlans.createdByUserId],
    references: [user.id],
  }),
}))
