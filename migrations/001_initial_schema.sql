-- Easy Meal Initial Schema
-- All tables include standard metadata fields:
--   created_at, created_by_user_id, updated_at, updated_by_user_id

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- HOUSEHOLDS (created first since users reference it)
-- ============================================================================
CREATE TABLE households (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    invite_code VARCHAR(20) UNIQUE NOT NULL,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by_user_id UUID, -- nullable, set after user is created
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by_user_id UUID
);

CREATE INDEX idx_households_invite_code ON households(invite_code);

-- ============================================================================
-- USERS
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- nullable for OAuth-only users
    name VARCHAR(255) NOT NULL,
    google_id VARCHAR(255) UNIQUE,

    -- User settings
    dietary_restrictions TEXT[] DEFAULT '{}',
    preferences JSONB DEFAULT '{}',

    -- Household membership
    household_id UUID REFERENCES households(id) ON DELETE SET NULL,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX idx_users_household_id ON users(household_id);

-- Add foreign keys to households now that users table exists
ALTER TABLE households
    ADD CONSTRAINT fk_households_created_by
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE households
    ADD CONSTRAINT fk_households_updated_by
    FOREIGN KEY (updated_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================================
-- INGREDIENTS (normalized, global)
-- ============================================================================
CREATE TYPE ingredient_category AS ENUM (
    'produce', 'dairy', 'meat', 'seafood', 'pantry',
    'frozen', 'bakery', 'beverages', 'other'
);

CREATE TABLE ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category ingredient_category NOT NULL DEFAULT 'other',
    default_unit VARCHAR(50),

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Prevent duplicate ingredient names
    CONSTRAINT unique_ingredient_name UNIQUE (name)
);

CREATE INDEX idx_ingredients_name ON ingredients(name);
CREATE INDEX idx_ingredients_category ON ingredients(category);

-- ============================================================================
-- RECIPES
-- ============================================================================
CREATE TYPE recipe_source AS ENUM ('ai_generated', 'manual', 'imported');

CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,

    -- Recipe details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    servings INTEGER NOT NULL DEFAULT 4 CHECK (servings > 0),
    instructions JSONB NOT NULL DEFAULT '[]', -- [{step_number, text}]
    cuisine VARCHAR(100),
    prep_time INTEGER, -- minutes
    cook_time INTEGER, -- minutes
    source recipe_source NOT NULL DEFAULT 'manual',

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_recipes_household_id ON recipes(household_id);
CREATE INDEX idx_recipes_cuisine ON recipes(cuisine);
CREATE INDEX idx_recipes_source ON recipes(source);
CREATE INDEX idx_recipes_created_at ON recipes(created_at DESC);

-- ============================================================================
-- RECIPE INGREDIENTS (recipe to ingredient mapping)
-- ============================================================================
CREATE TABLE recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,

    quantity DECIMAL(10, 3) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(50) NOT NULL,
    preparation VARCHAR(100), -- "diced", "minced", etc.

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    CONSTRAINT unique_recipe_ingredient UNIQUE (recipe_id, ingredient_id)
);

CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_id);

-- ============================================================================
-- TAGS (user-created, household-scoped)
-- ============================================================================
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,

    name VARCHAR(100) NOT NULL,
    color VARCHAR(7), -- hex color like #FF5733

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    CONSTRAINT unique_tag_per_household UNIQUE (household_id, name)
);

CREATE INDEX idx_tags_household_id ON tags(household_id);

-- ============================================================================
-- RECIPE TAGS (many-to-many)
-- ============================================================================
CREATE TABLE recipe_tags (
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    PRIMARY KEY (recipe_id, tag_id)
);

CREATE INDEX idx_recipe_tags_tag_id ON recipe_tags(tag_id);

-- ============================================================================
-- RECIPE LISTS (personal collections)
-- ============================================================================
CREATE TABLE recipe_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,
    position INTEGER NOT NULL DEFAULT 0,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_recipe_lists_user_id ON recipe_lists(user_id);
CREATE INDEX idx_recipe_lists_household_id ON recipe_lists(household_id);

-- ============================================================================
-- RECIPE LIST ITEMS (many-to-many)
-- ============================================================================
CREATE TABLE recipe_list_items (
    recipe_list_id UUID NOT NULL REFERENCES recipe_lists(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,

    position INTEGER NOT NULL DEFAULT 0,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    PRIMARY KEY (recipe_list_id, recipe_id)
);

CREATE INDEX idx_recipe_list_items_recipe_id ON recipe_list_items(recipe_id);

-- ============================================================================
-- GROCERY LISTS
-- ============================================================================
CREATE TYPE grocery_list_status AS ENUM ('active', 'completed', 'archived');

CREATE TABLE grocery_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    status grocery_list_status NOT NULL DEFAULT 'active',

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_grocery_lists_household_id ON grocery_lists(household_id);
CREATE INDEX idx_grocery_lists_status ON grocery_lists(status);
CREATE INDEX idx_grocery_lists_created_at ON grocery_lists(created_at DESC);

-- ============================================================================
-- GROCERY LIST ITEMS
-- ============================================================================
CREATE TABLE grocery_list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grocery_list_id UUID NOT NULL REFERENCES grocery_lists(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,

    quantity DECIMAL(10, 3) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(50) NOT NULL,
    is_checked BOOLEAN NOT NULL DEFAULT FALSE,

    -- Source tracking for aggregation
    recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
    original_servings INTEGER,
    scaled_servings INTEGER,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_grocery_list_items_grocery_list_id ON grocery_list_items(grocery_list_id);
CREATE INDEX idx_grocery_list_items_ingredient_id ON grocery_list_items(ingredient_id);
CREATE INDEX idx_grocery_list_items_is_checked ON grocery_list_items(is_checked);

-- ============================================================================
-- HELPER FUNCTION: Auto-update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
CREATE TRIGGER update_households_updated_at BEFORE UPDATE ON households
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON ingredients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipe_ingredients_updated_at BEFORE UPDATE ON recipe_ingredients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipe_tags_updated_at BEFORE UPDATE ON recipe_tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipe_lists_updated_at BEFORE UPDATE ON recipe_lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipe_list_items_updated_at BEFORE UPDATE ON recipe_list_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grocery_lists_updated_at BEFORE UPDATE ON grocery_lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grocery_list_items_updated_at BEFORE UPDATE ON grocery_list_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
