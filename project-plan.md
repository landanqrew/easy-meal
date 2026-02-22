# Easy Meal - Project Plan

## Executive Summary

Easy Meal is a web application that streamlines the meal preparation process—from recipe creation to grocery shopping. The MVP focuses on a structured recipe creation flow powered by AI, personal recipe organization via lists and tags, and grocery list generation with Google Tasks export for in-store use. Household sharing enables multiple users to collaborate on a shared recipe collection.

---

## Goals & Success Criteria

### Primary Goals
1. Enable users to generate personalized recipes based on ingredient/preference selections
2. Provide flexible recipe organization through user-created tags and personal lists
3. Automatically generate consolidated grocery lists with servings scaling
4. Support household collaboration on a shared recipe collection

### Success Criteria (MVP)
- [ ] User can sign up, log in, and join/create a household
- [ ] User can generate a recipe by selecting preferences (protein, vegetables, cuisine, etc.)
- [ ] User can save, view, edit, and tag recipes
- [ ] User can create personal lists and organize recipes into them
- [ ] User can browse household recipes with tag filtering
- [ ] User can generate a grocery list from one or more recipes with servings scaling
- [ ] Grocery list supports check-off functionality and Google Tasks export
- [ ] Dietary restrictions are respected in all AI-generated recipes
- [ ] Application works on web (mobile via React Native is post-MVP)

---

## Tech Stack

| Layer | Technology | Status |
|-------|------------|--------|
| Web Frontend | Bun, React, TanStack Query, Vite | Scaffolded |
| Backend/API | Bun, Hono, TypeScript | Scaffolded |
| Database | PostgreSQL + Drizzle ORM (Cloud SQL prod, local Docker dev) | Implemented |
| AI | Google AI Studio (Gemini 2.5 Flash) | Prototyped |
| Auth | Better Auth (Email/Password + Google OAuth) | Implemented |
| Deployment | Google Cloud Run | Planned |
| Grocery Export | Google Tasks API | Planned |
| Mobile (Post-MVP) | React Native | Planned |

---

## Architecture Overview

```
┌───────────────────────────────────────┐
│              React Web                │
│  (responsive, works on mobile browser)│
└──────────────────┬────────────────────┘
                   │
                   ▼
┌───────────────────────────────────────────────────────┐
│                API Layer (Cloud Run)                  │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Bun + Hono/Elysia                              │  │
│  │  - Auth endpoints                               │  │
│  │  - Recipe CRUD + tagging                        │  │
│  │  - Recipe lists (personal collections)          │  │
│  │  - Grocery list management                      │  │
│  │  - Household management                         │  │
│  │  - AI orchestration                             │  │
│  │  - Community discover + check-ins               │  │
│  │  - Google Tasks export                          │  │
│  └─────────────────────────────────────────────────┘  │
└───────────┬───────────────────────────┬───────────────┘
            │                           │
            ▼                           ▼
┌───────────────────────┐   ┌───────────────────────────┐
│  PostgreSQL           │   │  Vertex AI (Gemini)       │
│  - Users              │   │  - Recipe generation      │
│  - Households         │   │  - Ingredient parsing     │
│  - Recipes + Tags     │   │  - Store section mapping  │
│  - Recipe Lists       │   └───────────────────────────┘
│  - Recipe Check-ins   │
│  - Grocery Lists      │
└───────────────────────┘
```

---

## Data Model (Core Entities)

> **Note:** All entities include standard metadata fields:
> - `created_at` (timestamp)
> - `created_by_user_id` (FK to User)
> - `updated_at` (timestamp)
> - `updated_by_user_id` (FK to User)

### User
- id, email, password_hash, name, google_id
- dietary_restrictions (array)
- preferences (JSON - cuisine preferences, default servings, etc.)
- household_id (FK)

### Household
- id, name, invite_code

### Ingredient (normalized, global)
- id, name (canonical)
- category (produce, dairy, meat, pantry, etc.)
- default_unit (optional)

### Recipe
- id, household_id
- title, description, servings
- instructions (JSON array - step_number, text)
- cuisine, prep_time, cook_time
- source (enum: ai_generated, manual, imported, community)
- is_public (boolean, default false)
- copied_from_recipe_id (self-referencing FK, nullable)

### RecipeIngredient (recipe to ingredient mapping)
- recipe_id, ingredient_id
- quantity, unit
- preparation (optional - "diced", "minced", etc.)

### Tag (user-created, household-scoped)
- id, household_id
- name, color (optional)

### RecipeTag (many-to-many)
- recipe_id, tag_id

### RecipeList (personal collections)
- id, user_id, household_id
- name, description (optional)
- position (for ordering)

### RecipeListItem (many-to-many)
- recipe_list_id, recipe_id
- position (for ordering within list)

### RecipeCheckin
- id, recipe_id, user_id
- notes (optional)
- enjoyment_rating (1-5)
- instruction_rating (1-5)

### GroceryList
- id, household_id
- name, status (active, completed, archived)

### GroceryListItem
- id, grocery_list_id
- ingredient_id, quantity, unit
- is_checked, recipe_id (source reference)
- original_servings, scaled_servings (for scaling support)

---

## Phases

### Phase 0: Project Scaffolding ✅ COMPLETE
**Objective**: Establish project structure and development environment

| Task | Complexity | Status |
|------|------------|--------|
| Initialize project structure (packages: web, api, shared) | Low | ✅ Done |
| Set up Bun + React web app scaffold | Low | ✅ Done |
| Set up Bun API scaffold (Hono) | Low | ✅ Done |
| Configure local PostgreSQL with Docker Compose (port 5433) | Low | ✅ Done |
| Set up shared TypeScript types package | Low | ✅ Done |
| Configure ESLint, Prettier, shared configs | Low | ✅ Done |
| Set up Drizzle ORM with type-safe schema | Low | ✅ Done |
| Prototype AI recipe generation (Gemini 2.5 Flash) | Medium | ✅ Done |
| Design recipe creation wizard UI spec | Medium | ✅ Done |

**Deliverable**: Running dev environment with web and API starting successfully

---

### Phase 1: Authentication & User Management ✅ COMPLETE
**Objective**: Users can register, log in, and manage their profile

| Task | Complexity | Status |
|------|------------|--------|
| Design and implement auth database schema | Low | ✅ Done (Better Auth) |
| Implement email/password registration & login | Medium | ✅ Done |
| Implement Google OAuth flow | Medium | ✅ Done |
| Build session management | Medium | ✅ Done (Better Auth sessions) |
| Create user profile API (dietary restrictions, preferences) | Low | ✅ Done |
| Build web auth UI (login, register, profile) | Medium | ✅ Done |

**Deliverable**: Users can sign up, log in, and set dietary preferences

---

### Phase 2: Household Management ✅ COMPLETE
**Objective**: Users can create/join households and share data

| Task | Complexity | Status |
|------|------------|--------|
| Design household database schema | Low | ✅ Done (Phase 0) |
| Implement household CRUD API | Low | ✅ Done |
| Implement invite code generation and join flow | Medium | ✅ Done |
| Add household context to API authorization | Medium | ✅ Done |
| Build web household UI (create, join, manage members) | Medium | ✅ Done |

**Deliverable**: Users can create households, invite others via code, and see shared data

---

### Phase 3: Recipe Creation & Organization ✅ COMPLETE
**Objective**: Users can generate recipes via structured preference selection and organize them with tags and lists

| Task | Complexity | Status |
|------|------------|--------|
| Design recipe, tag, and recipe list database schemas | Low | ✅ Done (Phase 0) |
| Define preference selection options (proteins, vegetables, cuisines, etc.) | Low | ✅ Done |
| Build Vertex AI integration layer | Medium | ✅ Done (Gemini) |
| Design recipe generation prompt engineering | Medium | ✅ Done |
| Implement recipe generation API endpoint | Medium | ✅ Done |
| Implement recipe CRUD API | Low | ✅ Done |
| Implement tag CRUD API (user-created tags) | Low | ✅ Done |
| Implement recipe list CRUD API (personal collections) | Low | ✅ Done |
| Build web recipe creation wizard UI | High | ✅ Done |
| Build web recipe "marketplace" view (browse all household recipes) | Medium | ✅ Done |
| Build tag management UI (create, assign, filter) | Medium | ✅ Done (in Recipes page) |
| Build recipe list management UI (create lists, add/remove recipes) | Medium | ✅ Done |
| Build web recipe detail view | Medium | ✅ Done |
| Implement recipe edit functionality | Medium | ✅ Done |

**Note**: All Phase 3 tasks complete. Recipe list UI and recipe edit were initially deferred but have since been implemented.

**Deliverable**: Users can create AI-generated recipes, tag them, organize into personal lists, and browse the household recipe collection

---

### Phase 4: Grocery List Generation ✅ COMPLETE
**Objective**: Users can generate and manage grocery lists from recipes with servings scaling

| Task | Complexity | Status |
|------|------------|--------|
| Design grocery list database schema (with scaling fields) | Low | ✅ Done (Phase 0) |
| Implement servings scaling logic | Medium | ✅ Done |
| Implement ingredient aggregation logic (combine duplicates, convert units) | High | ✅ Done |
| Implement grocery list CRUD API | Low | ✅ Done |
| Implement item check-off API | Low | ✅ Done |
| Build web recipe selection UI with servings input | Medium | ✅ Done |
| Build web grocery list view with check-off | Medium | ✅ Done |
| Categorize items by store section (produce, dairy, etc.) | Medium | ✅ Done |
| Implement Google Tasks export integration | Medium | ✅ Done (export format ready) |

**Note**: Google Tasks API integration exports data in a format ready for import. Full OAuth-based direct export to Google Tasks can be added post-MVP.

**Deliverable**: Users can select recipes, adjust servings, generate a consolidated grocery list, check off items, and export to Google Tasks

---

### Phase 5: Polish & Launch Prep ✅ COMPLETE
**Objective**: Production readiness

| Task | Complexity | Status |
|------|------------|--------|
| Set up Cloud Run deployment pipeline | Medium | ✅ Done (cloudbuild.yaml) |
| Configure Cloud SQL instance | Low | ✅ Done (docs/deployment.md) |
| Set up Vertex AI production access | Low | ✅ Done (using Gemini API) |
| Implement error tracking (Sentry or similar) | Low | ✅ Done (optional Sentry integration) |
| Add basic analytics | Low | ⏸️ Deferred (add post-launch) |
| Responsive design pass (mobile browser experience) | Medium | ✅ Done |
| Performance optimization pass | Medium | ✅ Done (nginx caching, gzip) |
| Security audit (auth, API, data access) | Medium | ✅ Done (rate limiting, security headers) |

**Note**: Analytics deferred to post-launch. Sentry is optional and can be enabled by installing @sentry/node and setting SENTRY_DSN.

**Deliverable**: Application deployed and accessible to users on web and mobile browsers

---

### Phase 6: Community Recipe Sharing & Check-Ins ✅ COMPLETE
**Objective**: Untappd-style recipe discovery — publish recipes globally, browse community recipes, copy to household, and check in with ratings

| Task | Complexity | Status |
|------|------------|--------|
| Add `community` source, `is_public`, `copied_from_recipe_id` to recipes schema | Low | ✅ Done |
| Create `recipe_checkins` table with enjoyment/instruction ratings | Low | ✅ Done |
| Implement publish toggle endpoint (`POST /recipes/:id/publish`) | Low | ✅ Done |
| Build discover API (`GET/POST /discover/recipes`) with search, pagination, aggregated ratings | High | ✅ Done |
| Build check-in CRUD API (`/checkins`) | Medium | ✅ Done |
| Build Discover page (search, recipe grid, star ratings, pagination) | Medium | ✅ Done |
| Build PublicRecipeDetail page (read-only view, copy to household, inline check-in form) | Medium | ✅ Done |
| Add publish toggle and check-in section to RecipeDetail page | Medium | ✅ Done |
| Add Discover link to NavBar (desktop + mobile) and Home page | Low | ✅ Done |
| Update source labels for `community` recipes across UI | Low | ✅ Done |

**Deliverable**: Users can publish recipes publicly, browse/search community recipes, copy them to their household, and submit check-ins with ratings and notes

---

## Active Phases

### Phase 7: UI Modernization & Responsiveness 🔄 IN PROGRESS
**Objective**: Elevate the UI to a modern, polished standard with improved responsiveness

| Task | Complexity | Status |
|------|------------|--------|
| Add CSS transitions and hover states to all interactive elements | Medium | 🔄 In Progress |
| Improve card designs with modern shadows and depth | Low | Pending |
| Add backdrop blur and smooth animations to modals | Low | Pending |
| Improve responsive layouts across all pages | Medium | Pending |
| Refine typography hierarchy and spacing consistency | Low | Pending |
| Add loading skeleton states to replace plain "Loading..." text | Medium | Pending |

### Phase 8: Recipe Creation Enhancements 🔄 IN PROGRESS
**Objective**: Allow custom inputs in the wizard flow and add conversational recipe creation

| Task | Complexity | Status |
|------|------------|--------|
| Add custom item input to wizard categories (protein, vegetables, cuisine, cooking method) | Medium | Pending |
| Build chat-based recipe creation UI (ChatRecipe page) | High | Pending |
| Build chat API endpoint with multi-turn conversation support | High | Pending |
| Add AI clarification flow when user input is insufficient | Medium | Pending |
| Add chat route to App.tsx and navigation | Low | Pending |
| Update recipe creation entry point to offer wizard vs. chat choice | Low | Pending |

### Phase 8 (Original): Meal Planner ✅ COMPLETE
- Calendar view for meal scheduling (implemented)
- Recipe assignment to meal slots
- Week navigation
- Recipe creation from meal plan context

---

## Future Phases (Post-MVP)

### Phase 9: React Native Mobile App
- Port web experience to React Native
- Shared component library with web
- Offline support for recipes and grocery lists
- Push notifications for household activity

### Phase 10: Agent Chat Interface (Extended)
- Recipe modification via chat
- Meal plan suggestions via chat
- Grocery list refinement via chat

### Phase 11: Voice Assistant
- Speech-to-text integration
- Step-by-step voice walkthrough
- Hands-free cooking mode
- Contextual Q&A during cooking

### Phase 12: Enhancements
- Recipe import (URL parsing)
- AI meal suggestions based on history
- Nutritional information

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| AI recipe quality inconsistent | Medium | High | Extensive prompt engineering, user feedback loop, ability to regenerate |
| Ingredient parsing/aggregation errors | Medium | Medium | Start with structured ingredient format, add fuzzy matching iteratively |
| Household data isolation bugs | Low | High | Comprehensive authorization tests, row-level security in Postgres |
| Google Tasks API changes | Low | Medium | Use stable API endpoints; abstract integration layer for easy swap |
| Vertex AI latency affects UX | Medium | Medium | Streaming responses, loading states, consider caching common patterns |
| Scope creep into meal planning | High | Medium | Strict MVP boundary enforcement, separate tracking for future features |

---

## Decisions Made

| Decision | Resolution |
|----------|------------|
| Platform priority | Web-first; mobile browser via responsive design; React Native post-MVP |
| API framework | Hono (lightweight, fast, good TypeScript support) |
| ORM | Drizzle ORM (type-safe, schema as code, lightweight) |
| AI provider | Google AI Studio with Gemini 2.5 Flash (prototyping); Vertex AI for production |
| Database port | 5433 (avoids conflict with local PostgreSQL on 5432) |
| Grocery store access | Google Tasks API (free, works with consumer accounts, has iOS/Android apps) |
| Recipe organization | Recipes in household "marketplace" with user-created tags; personal lists for curation |
| Lists scope | Personal (per user), not household-shared |
| Tags scope | User-created, household-scoped (all members see tags) |
| Servings scaling | Yes, include serving multiplier in grocery list generation |
| Ingredient normalization | AI-assisted matching to ingredient database; AI can add new ingredients if no match exists |
| State management | TanStack Query for server state |
| Offline support | Not MVP |
| Nutrition tracking | Out of scope |
| AI suggestions | Out of scope (AI only generates on-demand) |
| Community sharing model | One-click publish toggle; full copy model (independent copy to household); no photos |
| Check-in ratings | Dual rating system: enjoyment (1-5) + instruction clarity (1-5) |

## Open Questions

None currently - all major decisions resolved.

---

## Recommended Next Steps

**MVP Complete!** Phases 0-5 are done. The application is ready for deployment.

To deploy:
1. Follow instructions in `docs/deployment.md`
2. Set up GCP project and Cloud SQL
3. Configure secrets and deploy via Cloud Build

Post-MVP priorities:
1. **Phase 7: UI Modernization** - Polish transitions, skeletons, responsive layouts
2. **Phase 8: Recipe Creation Enhancements** - Chat-based recipe creation, custom wizard inputs
3. **Phase 9: React Native Mobile App** - Native mobile experience

---

## Appendix: Preference Selection Options (Draft)

### Protein
- Chicken, Beef, Pork, Fish, Shrimp, Tofu, Tempeh, Eggs, None

### Vegetables
- Multi-select from: Broccoli, Spinach, Bell Peppers, Onions, Garlic, Tomatoes, Zucchini, Carrots, Mushrooms, etc.

### Cuisine
- American, Italian, Mexican, Asian, Mediterranean, Indian, Thai, Japanese, French, Other

### Meal Type
- Breakfast, Lunch, Dinner, Snack

### Cooking Method
- Stovetop, Oven, Grill, Slow Cooker, Instant Pot, Air Fryer, No-Cook

### Time Constraint
- Quick (< 30 min), Medium (30-60 min), Leisurely (60+ min)

### Dietary Restrictions (User Profile)
- Vegetarian, Vegan, Gluten-Free, Dairy-Free, Nut-Free, Keto, Low-Sodium, Halal, Kosher
