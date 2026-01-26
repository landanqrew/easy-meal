# Recipe Creation Wizard - UI Specification

## Overview

A step-by-step wizard that guides users through selecting preferences for AI-powered recipe generation. The flow is designed to be quick (under 60 seconds) while providing enough customization for personalized results.

---

## User Flow

```
[Start] → Protein → Vegetables → Cuisine & Method → Time & Servings → [Generate] → Preview → [Save]
```

**Key Principles:**
- Progressive disclosure - show only what's needed at each step
- Smart defaults - pre-fill common choices
- Skip-friendly - all steps optional except final generation
- Mobile-first - thumb-friendly tap targets

---

## Step 1: Protein Selection

**Purpose:** Choose the main protein for the meal (or none for vegetarian)

### Layout
```
┌─────────────────────────────────────┐
│  What protein would you like?       │
│                                     │
│  ┌───────┐ ┌───────┐ ┌───────┐     │
│  │ 🍗    │ │ 🥩    │ │ 🐷    │     │
│  │Chicken│ │ Beef  │ │ Pork  │     │
│  └───────┘ └───────┘ └───────┘     │
│  ┌───────┐ ┌───────┐ ┌───────┐     │
│  │ 🐟    │ │ 🍤    │ │ 🥚    │     │
│  │ Fish  │ │Shrimp │ │ Eggs  │     │
│  └───────┘ └───────┘ └───────┘     │
│  ┌───────┐ ┌───────┐ ┌───────┐     │
│  │ 🫘    │ │ 🥬    │ │ ❌    │     │
│  │ Tofu  │ │Tempeh │ │ None  │     │
│  └───────┘ └───────┘ └───────┘     │
│                                     │
│  [Skip]                    [Next →] │
└─────────────────────────────────────┘
```

### Interactions
- **Single select** - tap to select, tap again to deselect
- **Selected state** - elevated card with primary color border
- **Skip** - proceeds without selection (AI will choose)
- **Next** - proceeds with selection

### Responsive
- 3 columns on mobile (320px+)
- 4-5 columns on tablet/desktop

---

## Step 2: Vegetable Selection

**Purpose:** Choose vegetables to include (multi-select)

### Layout
```
┌─────────────────────────────────────┐
│  Which vegetables? (select any)     │
│                                     │
│  ┌─────────┐ ┌─────────┐ ┌───────┐ │
│  │ 🥦      │ │ 🫑      │ │ 🧅    │ │
│  │Broccoli │ │Peppers  │ │Onions │ │
│  └─────────┘ └─────────┘ └───────┘ │
│  ┌─────────┐ ┌─────────┐ ┌───────┐ │
│  │ 🍅      │ │ 🥕      │ │ 🍄    │ │
│  │Tomatoes │ │Carrots  │ │Mushroom│ │
│  └─────────┘ └─────────┘ └───────┘ │
│  ┌─────────┐ ┌─────────┐ ┌───────┐ │
│  │ 🥬      │ │ 🥒      │ │ 🌽    │ │
│  │ Spinach │ │Zucchini │ │ Corn  │ │
│  └─────────┘ └─────────┘ └───────┘ │
│                                     │
│  Selected: Broccoli, Peppers        │
│                                     │
│  [← Back] [Skip]           [Next →] │
└─────────────────────────────────────┘
```

### Interactions
- **Multi-select** - tap to toggle selection
- **Selected state** - checkmark overlay + primary border
- **Selection summary** - shows selected items below grid
- **Maximum** - soft limit of 5 (show warning, don't block)

---

## Step 3: Cuisine & Cooking Method

**Purpose:** Set cuisine style and preferred cooking method

### Layout
```
┌─────────────────────────────────────┐
│  Cuisine Style                      │
│  ┌─────────────────────────────────┐│
│  │ ▼ Select cuisine...             ││
│  └─────────────────────────────────┘│
│                                     │
│  Options: American, Italian,        │
│  Mexican, Asian, Mediterranean,     │
│  Indian, Thai, Japanese, French,    │
│  Surprise me                        │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Cooking Method                     │
│                                     │
│  ○ Stovetop    ○ Oven    ○ Grill   │
│  ○ Slow Cooker ○ Instant Pot       │
│  ○ Air Fryer   ○ No-Cook           │
│                                     │
│  [← Back] [Skip]           [Next →] │
└─────────────────────────────────────┘
```

### Interactions
- **Cuisine** - dropdown/bottom sheet on mobile
- **Cooking method** - single select radio buttons
- **"Surprise me"** - valid cuisine option, AI chooses

---

## Step 4: Time & Servings

**Purpose:** Set time constraints and serving size

### Layout
```
┌─────────────────────────────────────┐
│  How much time do you have?         │
│                                     │
│  ┌───────────┐ ┌───────────┐        │
│  │  ⚡ Quick │ │ ⏱ Medium │        │
│  │  < 30 min │ │ 30-60 min │        │
│  └───────────┘ └───────────┘        │
│  ┌───────────┐                      │
│  │ 🍳 Leisurely │                   │
│  │   60+ min    │                   │
│  └───────────┘                      │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  How many servings?                 │
│                                     │
│       [ − ]    4    [ + ]           │
│                                     │
│  [← Back]              [Generate →] │
└─────────────────────────────────────┘
```

### Interactions
- **Time** - single select cards
- **Servings** - stepper control (min: 1, max: 12, default: 4)
- **Generate** - final CTA, triggers AI generation

---

## Step 5: Generation & Preview

**Purpose:** Show loading state, then display generated recipe for review

### Loading State
```
┌─────────────────────────────────────┐
│                                     │
│           🍳                        │
│                                     │
│    Creating your recipe...          │
│                                     │
│    ████████████░░░░░░░░░            │
│                                     │
│    "Finding the perfect             │
│     combination of flavors"         │
│                                     │
└─────────────────────────────────────┘
```

- Animated icon (cooking/mixing)
- Progress bar (indeterminate or timed ~5-10s)
- Rotating flavor text for delight

### Preview State
```
┌─────────────────────────────────────┐
│  Asian Chicken Stir-Fry             │
│  ─────────────────────────────────  │
│  🕐 15 min prep  🍳 12 min cook     │
│  🍽 4 servings   🌏 Asian           │
│                                     │
│  A quick and vibrant stovetop       │
│  stir-fry featuring tender          │
│  chicken, crisp broccoli...         │
│                                     │
│  ─────────────────────────────────  │
│  INGREDIENTS (14)                   │
│  ─────────────────────────────────  │
│  • 1.5 lb chicken breast, diced     │
│  • 3 cups broccoli florets          │
│  • 1 red bell pepper, sliced        │
│  • ...                              │
│  [Show all]                         │
│                                     │
│  ─────────────────────────────────  │
│  INSTRUCTIONS (6 steps)             │
│  ─────────────────────────────────  │
│  1. In a small bowl, whisk...       │
│  [Show all]                         │
│                                     │
│  ┌─────────────┐ ┌─────────────┐   │
│  │ 🔄 Try Again│ │ ✓ Save      │   │
│  └─────────────┘ └─────────────┘   │
└─────────────────────────────────────┘
```

### Interactions
- **Try Again** - regenerate with same preferences
- **Save** - save to household recipes, navigate to recipe detail
- **Show all** - expand collapsed sections
- **Scroll** - full recipe scrollable

---

## Component Specifications

### Selection Card
```
┌─────────────────┐
│     [icon]      │  ← 24-32px icon/emoji
│                 │
│   [label]       │  ← 14px medium weight
└─────────────────┘

Size: 80-100px square
Border radius: 12px
States:
  - Default: light bg, subtle border
  - Hover: slight elevation
  - Selected: primary border (2px), light primary bg
  - Disabled: 50% opacity
```

### Step Indicator
```
  ●───●───●───○───○
  1   2   3   4   5

- Completed: filled primary
- Current: filled primary + larger
- Upcoming: outline only
- Connector: thin line between
```

### Primary Button
```
┌─────────────────────┐
│      Next →         │
└─────────────────────┘

- Full width on mobile
- Primary color bg
- White text
- 48px height (touch target)
- 8px border radius
```

---

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| < 480px | Single column, full-width cards |
| 480-768px | 3-column grid for selections |
| 768px+ | Centered container (max 600px), 4+ columns |

---

## State Management

```typescript
type WizardState = {
  step: 1 | 2 | 3 | 4 | 5
  preferences: {
    protein?: string
    vegetables: string[]
    cuisine?: string
    cookingMethod?: string
    timeConstraint?: 'quick' | 'medium' | 'leisurely'
    servings: number
  }
  generatedRecipe?: GeneratedRecipe
  isGenerating: boolean
  error?: string
}
```

---

## Error States

### Generation Failed
```
┌─────────────────────────────────────┐
│                                     │
│           ⚠️                        │
│                                     │
│    Couldn't create recipe           │
│                                     │
│    Something went wrong. Please     │
│    try again.                       │
│                                     │
│         [Try Again]                 │
│                                     │
└─────────────────────────────────────┘
```

### Network Error
- Show toast/snackbar
- Allow retry without losing progress

---

## Accessibility

- All cards keyboard navigable (arrow keys within grid)
- Step indicator announces current step
- Loading state announces to screen readers
- Sufficient color contrast (4.5:1 minimum)
- Focus visible indicators

---

## Animation Guidelines

| Element | Animation |
|---------|-----------|
| Step transition | Slide left/right, 200ms ease |
| Card selection | Scale 0.95→1, 100ms |
| Loading icon | Rotate or bounce, continuous |
| Progress bar | Left-to-right fill |
| Recipe appear | Fade in + slide up, 300ms |
