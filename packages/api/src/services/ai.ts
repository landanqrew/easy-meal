import { GoogleGenerativeAI } from '@google/generative-ai'
import type { RecipePreferences, GeneratedRecipe } from '@easy-meal/shared'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export type { RecipePreferences, GeneratedRecipe }

// ============================================================================
// RECIPE GENERATION
// ============================================================================

const RECIPE_GENERATION_PROMPT = `You are a professional chef assistant that creates detailed, delicious recipes based on user preferences.

Given the user's preferences, generate a complete recipe in JSON format.

IMPORTANT RULES:
1. All ingredient quantities must be numeric (use decimals like 0.5, 0.25, 0.33)
2. Use standard US cooking units (cup, tbsp, tsp, oz, lb, piece, clove, etc.)
3. Respect ALL dietary restrictions - never include restricted ingredients
4. Category must be one of: produce, dairy, meat, seafood, pantry, frozen, bakery, beverages, other
5. Keep instructions clear and numbered
6. Prep time and cook time in minutes

Respond ONLY with valid JSON matching this exact structure:
{
  "title": "Recipe Title",
  "description": "Brief appetizing description",
  "servings": 4,
  "prepTime": 15,
  "cookTime": 30,
  "cuisine": "Italian",
  "ingredients": [
    {
      "name": "ingredient name (lowercase, canonical form)",
      "quantity": 1.5,
      "unit": "cup",
      "category": "produce",
      "preparation": "diced"
    }
  ],
  "instructions": [
    {"stepNumber": 1, "text": "First step..."},
    {"stepNumber": 2, "text": "Second step..."}
  ]
}`

export async function generateRecipe(preferences: RecipePreferences): Promise<GeneratedRecipe> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const userPreferences = buildPreferencesPrompt(preferences)

  const result = await model.generateContent([
    RECIPE_GENERATION_PROMPT,
    `\n\nUser Preferences:\n${userPreferences}`,
  ])

  const response = result.response.text()

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || response.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Failed to parse recipe from AI response')
  }

  const jsonStr = jsonMatch[1] || jsonMatch[0]
  const recipe = JSON.parse(jsonStr) as GeneratedRecipe

  // Validate required fields
  if (!recipe.title || !recipe.ingredients || !recipe.instructions) {
    throw new Error('Invalid recipe structure from AI')
  }

  return recipe
}

function buildPreferencesPrompt(prefs: RecipePreferences): string {
  const lines: string[] = []

  if (prefs.protein) lines.push(`- Protein: ${prefs.protein}`)
  if (prefs.vegetables?.length) lines.push(`- Vegetables: ${prefs.vegetables.join(', ')}`)
  if (prefs.cuisine) lines.push(`- Cuisine style: ${prefs.cuisine}`)
  if (prefs.mealType) lines.push(`- Meal type: ${prefs.mealType}`)
  if (prefs.cookingMethod) lines.push(`- Cooking method: ${prefs.cookingMethod}`)
  if (prefs.timeConstraint) {
    const timeMap = { quick: 'under 30 minutes', medium: '30-60 minutes', leisurely: 'over 60 minutes' }
    lines.push(`- Time constraint: ${timeMap[prefs.timeConstraint]}`)
  }
  if (prefs.servings) lines.push(`- Servings: ${prefs.servings}`)
  if (prefs.dietaryRestrictions?.length) {
    lines.push(`- DIETARY RESTRICTIONS (MUST RESPECT): ${prefs.dietaryRestrictions.join(', ')}`)
  }
  if (prefs.additionalNotes) lines.push(`- Additional notes: ${prefs.additionalNotes}`)

  return lines.length > 0 ? lines.join('\n') : 'No specific preferences - create a delicious, balanced meal'
}

// ============================================================================
// INGREDIENT NORMALIZATION
// ============================================================================

const INGREDIENT_MATCHING_PROMPT = `You are a kitchen ingredient database assistant.

Given a list of ingredient names from a recipe and a list of existing ingredients in the database, determine which recipe ingredients match existing database entries and which are new.

For each recipe ingredient, either:
1. Match it to an existing database ingredient (use exact database name)
2. Mark it as new and provide a canonical name

Rules for canonical names:
- Lowercase
- Singular form (not plural)
- No brand names
- Most common/general term (e.g., "olive oil" not "extra virgin olive oil")
- Category must be one of: produce, dairy, meat, seafood, pantry, frozen, bakery, beverages, other

Respond ONLY with valid JSON:
{
  "matches": [
    {"recipeIngredient": "diced tomatoes", "matchedTo": "tomato", "isNew": false},
    {"recipeIngredient": "fresh basil leaves", "matchedTo": "basil", "isNew": false},
    {"recipeIngredient": "pancetta", "matchedTo": "pancetta", "isNew": true, "category": "meat"}
  ]
}`

export type IngredientMatch = {
  recipeIngredient: string
  matchedTo: string
  isNew: boolean
  category?: string
}

export async function normalizeIngredients(
  recipeIngredients: string[],
  existingIngredients: string[]
): Promise<IngredientMatch[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `${INGREDIENT_MATCHING_PROMPT}

Recipe ingredients to process:
${recipeIngredients.map((i) => `- ${i}`).join('\n')}

Existing ingredients in database:
${existingIngredients.length > 0 ? existingIngredients.map((i) => `- ${i}`).join('\n') : '(database is empty)'}`

  const result = await model.generateContent(prompt)
  const response = result.response.text()

  const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || response.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Failed to parse ingredient matches from AI response')
  }

  const jsonStr = jsonMatch[1] || jsonMatch[0]
  const parsed = JSON.parse(jsonStr) as { matches: IngredientMatch[] }

  return parsed.matches
}
