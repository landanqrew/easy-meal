# Easy Meal - Design System & Philosophy

## Design Philosophy

The design philosophy for **Easy Meal** is centered around **warmth, clarity, and approachability**. The purpose of the application is meal planning—an activity that should feel organic, enjoyable, and related to the comforts of home and good food. 

We avoid harsh contrasts, stark whites, and "techy" blues. Instead, we lean into a **pastoral, soft, and culinary-inspired aesthetic**:
- **Warmth:** Off-white backgrounds with subtle yellow/tan undertones feel like natural paper, parchment, or a sunny kitchen.
- **Organic Colors:** Terracotta (rust/clay), Sage/Olive greens, and muted earth tones reflect fresh ingredients and pottery.
- **Softness:** Rounded corners (`radius-md`, `radius-lg`), diffused drop shadows, and subtle translucent hover states instead of harsh opaque background swaps.
- **Playfulness (in moderation):** Subtle, slow CSS animations (like the floating circles on the homepage) and occasional use of emojis provide character without being overwhelming.

---

## Color Palette & Theme Definitions

The theme is globally defined in two places:
1. `packages/web/src/lib/theme.ts` (for React inline-styles/JS consumption)
2. `packages/web/src/index.css` (CSS variables for global styles, hover states, and animations)

### Core Colors
*   **Background (`--color-bg`, `#FAF5E9`):** A warm, creamy off-white. This is the foundation of the app. It prevents eye strain and sets the warm tone.
*   **Surface (`--color-surface`, `#ffffff`):** Pure white, used exclusively for cards, modals, and elevated elements to make them pop off the creamy background.
*   **Primary (`--color-primary`, `#D08770`):** A muted terracotta/rust. Used for primary actions, badges, and prominent links. It evokes spices, clay pots, and warmth.
*   **Primary Hover (`--color-primary-hover`, `#BF7259`):** A slightly deeper, richer terracotta for interactive states.
*   **Primary Light (`--color-primary-light`, `rgba(208, 135, 112, 0.1)`):** A translucent "stain" of the primary color. **Crucial pattern:** Using rgba instead of a solid hex allows the background color to bleed through, creating a soft, cohesive highlight for hover states and badges.

### Supporting Colors
*   **Success (`--color-success`, `#81A384`):** A muted, earthy sage green. Evokes fresh herbs and vegetables.
*   **Warning/Accent (`--color-warning`, `#D4A373`):** A warm tan/wheat color.
*   **Danger (`--color-danger`, `#D97A76`):** A soft, dusty rose/red rather than a blaring siren red.

### Typography Colors
*   **Text (`--color-text`, `#4A3B32`):** Deep, warm espresso brown. Much softer on the eyes than pure black (`#000`), tying into the organic theme.
*   **Text Secondary (`--color-text-secondary`, `#857163`):** Muted taupe/brown for subtitles and secondary information.
*   **Text Muted (`--color-text-muted`, `#B8A596`):** Very light brown/tan for placeholders, disabled states, and subtle borders.

---

## Typography Decisions

*   **Font Family:** We rely on the native system UI stack (`system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`). This ensures maximum performance, familiarity to the user's OS, and clean legibility.
*   **Headings:** Headings are bold (`font-weight: 700` or `800`) with tight letter-spacing (`letter-spacing: -0.02em`) on large display text (like the homepage hero). This gives a modern, editorial feel.
*   **Body Text:** Generous line height (`line-height: 1.5` or `1.6`) for comfortable reading of recipes and instructions. 

---

## Design Patterns & Components

### 1. Elevation and Shadows
Shadows in this app are designed to be **diffused, soft, and slightly warm** rather than sharp and gray/black.
*   **The Shadow Color:** We use variations of our muted text color (`rgba(184, 165, 150, X)`) instead of pure black (`rgba(0,0,0,X)`). This prevents the UI from looking muddy or dirty.
*   **Card Hover Pattern:** Elevated cards (like recipes or selection items) should "lift" slightly on hover. 
    *   *Implementation:* `transform: translateY(-2px)` coupled with an expanded, slightly darker shadow.

### 2. Button Hierarchy
*   **Primary Buttons:** Solid `--color-primary` background, white text, no border. On hover: darker background, slight lift (`translateY(-1px)`), and a warm, diffused shadow.
*   **Secondary Buttons:** White (`--color-surface`) background, `--color-border` border, and `--color-text` text. On hover: The border and text transition to `--color-primary`, accompanied by a slight lift and diffused shadow.
*   **"Ghost" / Nav Links:** No background. On hover: text deepens to `--color-primary-hover` and the background receives a soft stain of `--color-primary-light`.

### 3. Modals and Overlays
*   Overlays (`.modal-overlay`) utilize a backdrop blur (`backdrop-filter: blur(4px)`) combined with a semi-transparent black overlay to maintain context of the page underneath while drawing focus.
*   Modals animate in using `modalSlideUp` (fading in and slightly scaling up/sliding up from below) for a smooth entrance.

### 4. Layout & Spacing
*   **Max Widths:** Content is generally constrained to a max-width (e.g., `1200px` for the main layout, `700px` for reading/chat interfaces, `500px` for focused forms) to prevent lines of text from becoming unreadably long on wide monitors.
*   **Rhythm:** Consistent use of `gap` in flex/grid layouts (e.g., `0.5rem`, `1rem`, `1.5rem`) rather than arbitrary margins ensures vertical and horizontal rhythm.

---

## How to Apply These Concepts to New Pages

When building a new feature or page, follow this checklist to ensure it matches the Easy Meal aesthetic:

### 1. Structure
*   Always wrap the main content in a container that restricts max-width (`<main style={styles.main}>` or `.container`).
*   If building a focused, single-task page (like a form or a specific setting), wrap the content in a `.content-card` or `.content-card-narrow` to elevate it off the warm background.

### 2. Styling Interactive Elements
*   **Never use raw hex colors for hover states.** Always use the CSS variables or the `colors` object from `theme.ts`.
*   If you need a highlighted background for a selected item, a subtle alert, or a hover state on a list item, use `--color-primary-light` (the translucent `rgba`). This is the secret to the soft aesthetic.
*   **Interactive = Lift.** If a user can click a card or a large button, give it a `transition: all var(--transition-fast)` and add a hover state that applies `transform: translateY(-1px)` or `(-2px)` and a subtle shadow increase.

### 3. Typography
*   Use `--color-text` for main body copy, never `#000`.
*   Use `--color-text-secondary` for timestamps, helper text, subtitles, and less important metadata.
*   If a headline feels too "basic", try reducing the letter spacing slightly (`letterSpacing: '-0.02em'`) and bumping the font weight to `700`.

### 4. Empty States & Feedback
*   If a list is empty (e.g., "No recipes found"), center the text, use `--color-text-secondary`, and consider adding a muted, friendly emoji (e.g., 📝, 🛒) to keep it playful.
*   Use the existing `.success-message` and `.error-message` classes for feedback. They have been styled to match the muted pastel palette (sage green and dusty rose) rather than harsh neon green/red.

### Example: Building a new "Ingredient Tag" component

**Bad Approach (Generic/Harsh):**
```css
.tag {
  background: #eee;
  color: black;
  border-radius: 4px;
}
.tag:hover {
  background: orange;
}
```

**Good Approach (Easy Meal Style):**
```css
.ingredient-tag {
  background: var(--color-surface); /* Pure white to pop off the warm background */
  color: var(--color-text-secondary); /* Soft brown text */
  border: 1px solid var(--color-border); /* Subtle dividing line */
  border-radius: var(--radius-full); /* Soft, pill-shaped corners */
  padding: 0.25rem 0.75rem;
  font-size: var(--font-sm);
  transition: all var(--transition-fast);
  cursor: pointer;
}

.ingredient-tag:hover {
  border-color: var(--color-primary); /* Terracotta border */
  background: var(--color-primary-light); /* Translucent terracotta stain */
  color: var(--color-primary-hover); /* Deeper text for contrast */
  transform: translateY(-1px); /* Tactile lift */
  box-shadow: 0 2px 8px rgba(184, 165, 150, 0.2); /* Soft, warm shadow */
}
```