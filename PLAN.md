# Recipe Edit Feature — Implementation Plan

## Design Philosophy
**Inline editing on the existing RecipeDetail page.** No separate `/recipes/:id/edit` route — tap "Edit" and the detail page transforms in-place into an editable form. Tap "Save" or "Cancel" to return to view mode. This is the minimal-click approach: the user is already looking at the recipe, so editing should happen right there.

---

## Architecture Overview

### What already exists
- **Backend**: `PATCH /api/recipes/:id` already accepts partial updates for `title`, `description`, `servings`, `prepTime`, `cookTime`, `cuisine`, `instructions` — but does NOT handle ingredient updates (it only updates the `recipes` table fields)
- **Frontend**: `RecipeDetail.tsx` renders a read-only view with a Delete button
- **Types**: `Recipe` type defined locally in `RecipeDetail.tsx` with full ingredient + tag + instruction data

### What we need to build

#### 1. Backend: Add ingredient update support to `PATCH /api/recipes/:id`
**File**: `packages/api/src/routes/recipes.ts` (lines 244-289)

When `ingredients` array is provided in the PATCH body:
- Delete all existing `recipe_ingredients` for this recipe
- Re-insert the new ingredients list (find-or-create each ingredient, then insert `recipe_ingredients`)
- This "delete-and-replace" strategy is simpler than diffing and matches how the recipe was originally created

Changes:
- Accept `ingredients` in the PATCH body destructuring (line 271)
- After updating the recipe fields, if `ingredients` is provided, delete existing `recipe_ingredients` where `recipeId` matches, then loop through new ingredients using the same find-or-create pattern from the POST handler

#### 2. Frontend: Convert RecipeDetail.tsx to support view/edit toggle
**File**: `packages/web/src/pages/RecipeDetail.tsx`

**New state:**
- `editing: boolean` — toggles between view mode and edit mode
- `editData` — a mutable copy of the recipe for the form
- `saving: boolean` — loading state for save

**UI changes when `editing === true`:**

**Header section:**
- "Edit" button replaces layout (shown next to Delete in view mode)
- In edit mode: "Cancel" and "Save" buttons in header

**Title** → `<input>` (single line, large font matching the `h1`)

**Meta row** (prep time, cook time, servings, cuisine):
- Compact inline number inputs for prep/cook time (with "min" suffix)
- +/- stepper for servings (reuse pattern from CreateRecipe)
- Text input for cuisine

**Description** → `<textarea>` (auto-grow, 2-3 rows)

**Ingredients section:**
- Each ingredient row becomes editable: quantity input, unit input, name input, preparation input
- "×" button to remove an ingredient
- "+ Add ingredient" button at bottom to append a blank row
- Inputs are compact inline fields (no labels — the column position is the label)

**Instructions section:**
- Each step's text becomes a `<textarea>`
- "×" button to remove a step
- Drag handle or up/down arrows to reorder (stretch — start with just the list and add reorder later)
- "+ Add step" button at bottom
- Step numbers auto-calculated from array index

**Tags section** — leave as-is (already has add/remove tag functionality on the detail page via the existing tag API)

#### 3. CSS additions
**File**: `packages/web/src/index.css`

Add a small set of utility classes for the inline edit inputs:
- `.edit-input` — borderless input that looks like text until focused (border appears on focus)
- `.edit-textarea` — same for multiarea
- `.edit-row` — flex row for ingredient editing
- `.edit-remove-btn` — small "×" remove button
- `.edit-add-btn` — subtle "+ Add" button

This keeps the edit mode feeling lightweight — fields look like the normal recipe text until you interact with them.

---

## Detailed File Changes

### `packages/api/src/routes/recipes.ts`
- In the `PATCH /:id` handler, after the recipe update:
  - Accept `ingredients` from body
  - If `ingredients` array provided:
    - `DELETE FROM recipe_ingredients WHERE recipe_id = :id`
    - For each ingredient: find-or-create in `ingredients` table, then insert `recipe_ingredients`
  - Return the full updated recipe (with ingredients) instead of just the recipe row

### `packages/web/src/pages/RecipeDetail.tsx`
- Add `editing`, `editData`, `saving` state
- Add "Edit" button to the header (between back link and delete)
- Add `startEditing()` — deep-copies recipe into `editData`
- Add `cancelEditing()` — resets `editing` to false, discards `editData`
- Add `handleSave()` — PATCHes to API, updates `recipe` state with response, exits edit mode
- Add helper functions: `updateIngredient()`, `removeIngredient()`, `addIngredient()`, `updateInstruction()`, `removeInstruction()`, `addInstruction()`
- Conditional rendering: each section renders either view or edit UI based on `editing` flag

### `packages/web/src/index.css`
- Add `.edit-input`, `.edit-textarea`, `.edit-row`, `.edit-remove-btn`, `.edit-add-btn` classes

---

## UX Flow

1. User views recipe → sees normal detail page with new "Edit" button in header
2. Taps "Edit" → page smoothly transitions to editable form (same layout, fields become inputs)
3. Makes changes inline — every field is directly editable
4. Taps "Save" → PATCH request fires, page returns to view mode with updated data
5. Taps "Cancel" → all changes discarded, returns to view mode
6. Error handling: if save fails, stays in edit mode with error banner

---

## Scope Boundaries (what we're NOT doing)
- No separate edit page/route
- No image upload
- No tag editing (already handled by existing add/remove tag endpoints)
- No drag-to-reorder instructions (can add later; start with manual up/down or just add/remove)
- No optimistic updates — wait for server confirmation
