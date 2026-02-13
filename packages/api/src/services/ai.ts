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
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

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
// CHAT-BASED RECIPE GENERATION
// ============================================================================

const CHAT_SYSTEM_PROMPT = `You are a friendly, enthusiastic chef assistant helping someone decide what to cook. Your goal is to have a short conversation to understand what they want, then generate a complete recipe.

CONVERSATION RULES:
1. Be warm and conversational but concise (1-3 sentences per response).
2. If the user's description is vague (e.g., "something easy" or "chicken"), ask 1-2 clarifying questions about things like cuisine style, cooking method, time available, or specific ingredients they have on hand.
3. Don't ask more than 2 questions before generating a recipe. If the user has given you a protein and a general direction, that's enough.
4. If the user gives you enough detail to create a recipe right away, go ahead and generate it immediately without asking more questions.

RESPONSE FORMAT:
- When you are still chatting (asking questions or responding conversationally), respond with ONLY a plain text message. Do NOT include any JSON.
- When you are ready to present a recipe, respond with your conversational message FOLLOWED BY a JSON code block containing the recipe.

Example conversational response:
"That sounds great! Do you have a preference for cuisine style, or should I surprise you?"

Example recipe response:
"Here's a delicious recipe for you!

\`\`\`json
{
  "title": "Recipe Title",
  "description": "Brief appetizing description",
  "servings": 4,
  "prepTime": 15,
  "cookTime": 30,
  "cuisine": "Italian",
  "ingredients": [
    {"name": "ingredient name", "quantity": 1.5, "unit": "cup", "category": "produce", "preparation": "diced"}
  ],
  "instructions": [
    {"stepNumber": 1, "text": "First step..."},
    {"stepNumber": 2, "text": "Second step..."}
  ]
}
\`\`\`"

RECIPE JSON RULES (same as structured generation):
1. All ingredient quantities must be numeric (use decimals like 0.5, 0.25, 0.33)
2. Use standard US cooking units (cup, tbsp, tsp, oz, lb, piece, clove, etc.)
3. Respect ALL dietary restrictions - never include restricted ingredients
4. Category must be one of: produce, dairy, meat, seafood, pantry, frozen, bakery, beverages, other
5. Keep instructions clear and numbered
6. Prep time and cook time in minutes
7. Ingredient names must be lowercase, canonical form`

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type ChatRecipeResponse = {
  message: string
  recipe?: GeneratedRecipe
}

export async function chatRecipeGeneration(
  messages: ChatMessage[],
  dietaryRestrictions?: string[]
): Promise<ChatRecipeResponse> {
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

  let systemPrompt = CHAT_SYSTEM_PROMPT
  if (dietaryRestrictions?.length) {
    systemPrompt += `\n\nIMPORTANT: The user has the following dietary restrictions that MUST be respected: ${dietaryRestrictions.join(', ')}. Never suggest ingredients that violate these restrictions.`
  }

  // Build Gemini chat history from our messages
  const history = messages.slice(0, -1).map((msg) => ({
    role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
    parts: [{ text: msg.content }],
  }))

  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: "I'm ready to help you find the perfect recipe! What are you in the mood for?" }] },
      ...history,
    ],
  })

  const lastMessage = messages[messages.length - 1]
  const result = await chat.sendMessage(lastMessage.content)
  const response = result.response.text()

  // Check if the response contains a recipe JSON
  const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/)
  if (jsonMatch) {
    const messageText = response.replace(/```json\n?[\s\S]*?\n?```/, '').trim()
    try {
      const recipe = JSON.parse(jsonMatch[1]) as GeneratedRecipe
      if (recipe.title && recipe.ingredients && recipe.instructions) {
        return {
          message: messageText || `Here's your recipe for ${recipe.title}!`,
          recipe,
        }
      }
    } catch {
      // JSON parse failed, treat as conversational
    }
  }

  return { message: response }
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
