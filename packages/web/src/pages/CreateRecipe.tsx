import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSession } from '../lib/auth'
import { colors, shadows, radius } from '../lib/theme'
import type { GeneratedRecipe, RecipeType } from '@easy-meal/shared'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const DEFAULT_PROTEINS = ['Chicken', 'Beef', 'Pork', 'Fish', 'Shrimp', 'Tofu', 'Tempeh', 'Eggs', 'None']
const DEFAULT_VEGETABLES = ['Broccoli', 'Bell Peppers', 'Onions', 'Tomatoes', 'Carrots', 'Mushrooms', 'Spinach', 'Zucchini', 'Corn', 'Garlic']
const DEFAULT_FRUITS = ['Lemon', 'Lime', 'Avocado', 'Mango', 'Banana', 'Apple', 'Berries', 'Pineapple', 'Orange', 'Peach']
const DEFAULT_CUISINES = ['American', 'Italian', 'Mexican', 'Asian', 'Mediterranean', 'Indian', 'Thai', 'Japanese', 'French', 'Surprise me']
const DEFAULT_COOKING_METHODS = ['Stovetop', 'Oven', 'Grill', 'Slow Cooker', 'Instant Pot', 'Air Fryer', 'No-Cook']
const TIME_OPTIONS = [
  { value: 'quick', label: 'Quick', desc: '< 30 min' },
  { value: 'medium', label: 'Medium', desc: '30-60 min' },
  { value: 'leisurely', label: 'Leisurely', desc: '60+ min' },
]

const RECIPE_TYPE_OPTIONS: { value: RecipeType; label: string }[] = [
  { value: 'full_meal', label: 'Full Meal' },
  { value: 'entree', label: 'Entree' },
  { value: 'side', label: 'Side' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'appetizer', label: 'Appetizer' },
  { value: 'snack', label: 'Snack' },
  { value: 'drink', label: 'Drink' },
  { value: 'other', label: 'Other' },
]

type WizardStep = 1 | 2 | 3 | 4 | 5

export default function CreateRecipe() {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: session } = useSession()
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo
  const [step, setStep] = useState<WizardStep>(1)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Custom items added by user
  const [customProteins, setCustomProteins] = useState<string[]>([])
  const [customVegetables, setCustomVegetables] = useState<string[]>([])
  const [customFruits, setCustomFruits] = useState<string[]>([])
  const [customCuisines, setCustomCuisines] = useState<string[]>([])
  const [customMethods, setCustomMethods] = useState<string[]>([])

  // Custom input fields
  const [customProteinInput, setCustomProteinInput] = useState('')
  const [customVegetableInput, setCustomVegetableInput] = useState('')
  const [customFruitInput, setCustomFruitInput] = useState('')
  const [customCuisineInput, setCustomCuisineInput] = useState('')
  const [customMethodInput, setCustomMethodInput] = useState('')

  // Selections
  const [protein, setProtein] = useState<string | null>(null)
  const [vegetables, setVegetables] = useState<string[]>([])
  const [fruits, setFruits] = useState<string[]>([])
  const [cuisine, setCuisine] = useState<string | null>(null)
  const [cookingMethods, setCookingMethods] = useState<string[]>([])
  const [timeConstraint, setTimeConstraint] = useState<string | null>(null)
  const [servings, setServings] = useState(4)
  const [recipeType, setRecipeType] = useState<RecipeType>('full_meal')

  // Generated recipe
  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null)

  const allProteins = [...DEFAULT_PROTEINS, ...customProteins]
  const allVegetables = [...DEFAULT_VEGETABLES, ...customVegetables]
  const allFruits = [...DEFAULT_FRUITS, ...customFruits]
  const allCuisines = [...DEFAULT_CUISINES, ...customCuisines]
  const allMethods = [...DEFAULT_COOKING_METHODS, ...customMethods]

  const addCustomItem = (
    value: string,
    existing: string[],
    setCustom: React.Dispatch<React.SetStateAction<string[]>>,
    setInput: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    const trimmed = value.trim()
    if (!trimmed) return
    const titleCased = trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
    if (!existing.some((item) => item.toLowerCase() === titleCased.toLowerCase())) {
      setCustom((prev) => [...prev, titleCased])
    }
    setInput('')
  }

  const handleNext = () => {
    if (step < 4) setStep((step + 1) as WizardStep)
    else if (step === 4) handleGenerate()
  }

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as WizardStep)
  }

  const handleGenerate = async () => {
    setError('')
    setGenerating(true)
    setStep(5)

    try {
      const res = await fetch(`${API_URL}/api/recipes/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          protein: protein === 'None' ? undefined : protein?.toLowerCase(),
          vegetables: vegetables.map((v) => v.toLowerCase()),
          fruits: fruits.map((f) => f.toLowerCase()),
          cuisine: cuisine === 'Surprise me' ? undefined : cuisine?.toLowerCase(),
          cookingMethod: cookingMethods.length > 0 ? cookingMethods.map((m) => m.toLowerCase().replace(' ', '-')).join(', ') : undefined,
          timeConstraint,
          servings,
          recipeType,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to generate recipe')
        setStep(4)
      } else {
        setRecipe(data.data)
      }
    } catch {
      setError('Failed to generate recipe')
      setStep(4)
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!recipe) return
    setError('')
    setSaving(true)

    try {
      const res = await fetch(`${API_URL}/api/recipes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: recipe.title,
          description: recipe.description,
          servings: recipe.servings,
          prepTime: recipe.prepTime,
          cookTime: recipe.cookTime,
          cuisine: recipe.cuisine,
          instructions: recipe.instructions,
          ingredients: recipe.ingredients,
          source: 'ai_generated',
          type: recipe.type || recipeType,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to save recipe')
      } else {
        navigate(returnTo || `/recipes/${data.data.id}`)
      }
    } catch {
      setError('Failed to save recipe')
    } finally {
      setSaving(false)
    }
  }

  const handleTryAgain = () => {
    setRecipe(null)
    handleGenerate()
  }

  if (!session) {
    navigate('/login')
    return null
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Step indicator */}
        <div style={styles.stepIndicator}>
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              style={{
                ...styles.stepDot,
                ...(s <= step ? styles.stepDotActive : {}),
                ...(s === step ? styles.stepDotCurrent : {}),
              }}
            />
          ))}
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Step 1: Protein */}
        {step === 1 && (
          <div style={styles.stepContent}>
            <h2 style={styles.stepTitle}>What protein would you like?</h2>
            <div style={styles.selectionGrid}>
              {allProteins.map((p) => (
                <button
                  key={p}
                  onClick={() => setProtein(protein === p ? null : p)}
                  className={`selection-card${protein === p ? ' selected' : ''}`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="custom-input-row">
              <input
                type="text"
                placeholder="Add other protein..."
                value={customProteinInput}
                onChange={(e) => setCustomProteinInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addCustomItem(customProteinInput, allProteins, setCustomProteins, setCustomProteinInput)
                  }
                }}
              />
              <button
                onClick={() => addCustomItem(customProteinInput, allProteins, setCustomProteins, setCustomProteinInput)}
              >
                Add
              </button>
            </div>
            <div style={styles.stepActions}>
              <button onClick={() => navigate(returnTo || '/recipes')} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleNext} className="btn-primary">
                {protein ? 'Next' : 'Skip'} →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Vegetables */}
        {step === 2 && (
          <div style={styles.stepContent}>
            <h2 style={styles.stepTitle}>Which vegetables? (select any)</h2>
            <div style={styles.selectionGrid}>
              {allVegetables.map((v) => (
                <button
                  key={v}
                  onClick={() =>
                    setVegetables(
                      vegetables.includes(v)
                        ? vegetables.filter((x) => x !== v)
                        : [...vegetables, v]
                    )
                  }
                  className={`selection-card${vegetables.includes(v) ? ' selected' : ''}`}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="custom-input-row">
              <input
                type="text"
                placeholder="Add other vegetable..."
                value={customVegetableInput}
                onChange={(e) => setCustomVegetableInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addCustomItem(customVegetableInput, allVegetables, setCustomVegetables, setCustomVegetableInput)
                  }
                }}
              />
              <button
                onClick={() => addCustomItem(customVegetableInput, allVegetables, setCustomVegetables, setCustomVegetableInput)}
              >
                Add
              </button>
            </div>
            {vegetables.length > 0 && (
              <p style={styles.selectionSummary}>Selected: {vegetables.join(', ')}</p>
            )}

            <h2 style={{ ...styles.stepTitle, marginTop: '1.5rem' }}>Any fruits? (select any)</h2>
            <div style={styles.selectionGrid}>
              {allFruits.map((f) => (
                <button
                  key={f}
                  onClick={() =>
                    setFruits(
                      fruits.includes(f)
                        ? fruits.filter((x) => x !== f)
                        : [...fruits, f]
                    )
                  }
                  className={`selection-card${fruits.includes(f) ? ' selected' : ''}`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="custom-input-row">
              <input
                type="text"
                placeholder="Add other fruit..."
                value={customFruitInput}
                onChange={(e) => setCustomFruitInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addCustomItem(customFruitInput, allFruits, setCustomFruits, setCustomFruitInput)
                  }
                }}
              />
              <button
                onClick={() => addCustomItem(customFruitInput, allFruits, setCustomFruits, setCustomFruitInput)}
              >
                Add
              </button>
            </div>
            {fruits.length > 0 && (
              <p style={styles.selectionSummary}>Selected: {fruits.join(', ')}</p>
            )}

            <div style={styles.stepActions}>
              <button onClick={handleBack} className="btn-secondary">
                ← Back
              </button>
              <button onClick={handleNext} className="btn-primary">
                {vegetables.length > 0 || fruits.length > 0 ? 'Next' : 'Skip'} →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Cuisine & Method */}
        {step === 3 && (
          <div style={styles.stepContent}>
            <h2 style={styles.stepTitle}>Cuisine Style</h2>
            <div style={styles.selectionGrid}>
              {allCuisines.map((c) => (
                <button
                  key={c}
                  onClick={() => setCuisine(cuisine === c ? null : c)}
                  className={`selection-card${cuisine === c ? ' selected' : ''}`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="custom-input-row">
              <input
                type="text"
                placeholder="Add other cuisine..."
                value={customCuisineInput}
                onChange={(e) => setCustomCuisineInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addCustomItem(customCuisineInput, allCuisines, setCustomCuisines, setCustomCuisineInput)
                  }
                }}
              />
              <button
                onClick={() => addCustomItem(customCuisineInput, allCuisines, setCustomCuisines, setCustomCuisineInput)}
              >
                Add
              </button>
            </div>

            <h2 style={{ ...styles.stepTitle, marginTop: '1.5rem' }}>Cooking Method (select any)</h2>
            <div style={styles.selectionGrid}>
              {allMethods.map((m) => (
                <button
                  key={m}
                  onClick={() =>
                    setCookingMethods(
                      cookingMethods.includes(m)
                        ? cookingMethods.filter((x) => x !== m)
                        : [...cookingMethods, m]
                    )
                  }
                  className={`selection-card${cookingMethods.includes(m) ? ' selected' : ''}`}
                >
                  {m}
                </button>
              ))}
            </div>
            <div className="custom-input-row">
              <input
                type="text"
                placeholder="Add other method..."
                value={customMethodInput}
                onChange={(e) => setCustomMethodInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addCustomItem(customMethodInput, allMethods, setCustomMethods, setCustomMethodInput)
                  }
                }}
              />
              <button
                onClick={() => addCustomItem(customMethodInput, allMethods, setCustomMethods, setCustomMethodInput)}
              >
                Add
              </button>
            </div>
            {cookingMethods.length > 0 && (
              <p style={styles.selectionSummary}>Selected: {cookingMethods.join(', ')}</p>
            )}

            <div style={styles.stepActions}>
              <button onClick={handleBack} className="btn-secondary">
                ← Back
              </button>
              <button onClick={handleNext} className="btn-primary">
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Time & Servings */}
        {step === 4 && (
          <div style={styles.stepContent}>
            <h2 style={styles.stepTitle}>How much time do you have?</h2>
            <div style={styles.timeGrid}>
              {TIME_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTimeConstraint(timeConstraint === t.value ? null : t.value)}
                  className={`selection-card${timeConstraint === t.value ? ' selected' : ''}`}
                  style={{ textAlign: 'center' }}
                >
                  <div style={styles.timeLabel}>{t.label}</div>
                  <div style={styles.timeDesc}>{t.desc}</div>
                </button>
              ))}
            </div>

            <h2 style={{ ...styles.stepTitle, marginTop: '1.5rem' }}>How many servings?</h2>
            <div style={styles.servingsControl}>
              <button
                onClick={() => setServings(Math.max(1, servings - 1))}
                className="btn-secondary"
                style={{ width: '40px', height: '40px', borderRadius: '50%', padding: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                −
              </button>
              <span style={styles.servingsValue}>{servings}</span>
              <button
                onClick={() => setServings(Math.min(12, servings + 1))}
                className="btn-secondary"
                style={{ width: '40px', height: '40px', borderRadius: '50%', padding: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                +
              </button>
            </div>

            <h2 style={{ ...styles.stepTitle, marginTop: '1.5rem' }}>Recipe type</h2>
            <div style={styles.selectionGrid}>
              {RECIPE_TYPE_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setRecipeType(t.value)}
                  className={`selection-card${recipeType === t.value ? ' selected' : ''}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div style={styles.stepActions}>
              <button onClick={handleBack} className="btn-secondary">
                ← Back
              </button>
              <button onClick={handleNext} className="btn-primary" style={{ background: colors.success }}>
                Generate Recipe →
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Loading & Preview */}
        {step === 5 && (
          <div style={styles.stepContent}>
            {generating ? (
              <div style={styles.loadingContainer}>
                <div style={styles.loadingIcon}>🍳</div>
                <h2 style={styles.loadingTitle}>Creating your recipe...</h2>
                <p style={styles.loadingText}>Finding the perfect combination of flavors</p>
              </div>
            ) : recipe ? (
              <div style={styles.previewContainer}>
                <h2 style={styles.recipeTitle}>{recipe.title}</h2>
                <div style={styles.recipeMeta}>
                  <span>🕐 {recipe.prepTime} min prep</span>
                  <span>🍳 {recipe.cookTime} min cook</span>
                  <span>🍽 {recipe.servings} servings</span>
                  {recipe.cuisine && <span>🌍 {recipe.cuisine}</span>}
                </div>
                <p style={styles.recipeDescription}>{recipe.description}</p>

                <h3 style={styles.sectionTitle}>Ingredients ({recipe.ingredients.length})</h3>
                <ul style={styles.ingredientList}>
                  {recipe.ingredients.slice(0, 5).map((ing, i) => (
                    <li key={i} style={styles.ingredientItem}>
                      {ing.quantity} {ing.unit} {ing.name}
                      {ing.preparation && `, ${ing.preparation}`}
                    </li>
                  ))}
                  {recipe.ingredients.length > 5 && (
                    <li style={styles.moreItems}>
                      +{recipe.ingredients.length - 5} more ingredients
                    </li>
                  )}
                </ul>

                <h3 style={styles.sectionTitle}>Instructions ({recipe.instructions.length} steps)</h3>
                <ol style={styles.instructionList}>
                  {recipe.instructions.slice(0, 2).map((step) => (
                    <li key={step.stepNumber} style={styles.instructionItem}>
                      {step.text}
                    </li>
                  ))}
                  {recipe.instructions.length > 2 && (
                    <li style={styles.moreItems}>
                      +{recipe.instructions.length - 2} more steps
                    </li>
                  )}
                </ol>

                <div style={styles.previewActions}>
                  <button onClick={handleTryAgain} className="btn-secondary" style={{ flex: 1 }}>
                    🔄 Try Again
                  </button>
                  <button onClick={handleSave} className="btn-primary" style={{ flex: 1, background: colors.success }} disabled={saving}>
                    {saving ? 'Saving...' : '✓ Save Recipe'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: colors.bg,
    padding: '2rem 1rem',
    paddingTop: '4.5rem',
  },
  card: {
    background: 'white',
    padding: '2rem',
    borderRadius: radius.lg,
    boxShadow: shadows.md,
    border: `1px solid ${colors.borderLight}`,
    maxWidth: '600px',
    margin: '0 auto',
  },
  stepIndicator: {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.5rem',
    marginBottom: '2rem',
  },
  stepDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: colors.border,
    transition: 'all 0.2s ease',
  },
  stepDotActive: {
    background: colors.primary,
  },
  stepDotCurrent: {
    width: '12px',
    height: '12px',
  },
  stepContent: {},
  stepTitle: {
    fontSize: '1.375rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    marginBottom: '1rem',
  },
  selectionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: '0.75rem',
  },
  selectionSummary: {
    marginTop: '1rem',
    fontSize: '0.875rem',
    color: colors.textSecondary,
  },
  stepActions: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '2rem',
  },
  timeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: '0.75rem',
  },
  timeLabel: {
    fontWeight: 600,
    marginBottom: '0.25rem',
  },
  timeDesc: {
    fontSize: '0.75rem',
    color: colors.textSecondary,
  },
  servingsControl: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.5rem',
  },
  servingsValue: {
    fontSize: '2rem',
    fontWeight: 600,
    minWidth: '60px',
    textAlign: 'center',
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '3rem 0',
  },
  loadingIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
    animation: 'pulse 1.5s infinite',
  },
  loadingTitle: {
    fontSize: '1.375rem',
    fontWeight: 700,
    marginBottom: '0.5rem',
  },
  loadingText: {
    color: colors.textSecondary,
  },
  previewContainer: {},
  recipeTitle: {
    fontSize: '1.75rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    marginBottom: '0.5rem',
  },
  recipeMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    fontSize: '0.875rem',
    color: colors.textSecondary,
    marginBottom: '1rem',
  },
  recipeDescription: {
    color: colors.text,
    lineHeight: 1.6,
    marginBottom: '1.5rem',
  },
  sectionTitle: {
    fontSize: '1.125rem',
    fontWeight: 700,
    color: colors.textSecondary,
    marginBottom: '0.5rem',
    borderTop: `1px solid ${colors.border}`,
    paddingTop: '1rem',
  },
  ingredientList: {
    listStyle: 'disc',
    paddingLeft: '1.5rem',
    marginBottom: '1rem',
  },
  ingredientItem: {
    marginBottom: '0.25rem',
  },
  instructionList: {
    paddingLeft: '1.5rem',
    marginBottom: '1.5rem',
  },
  instructionItem: {
    marginBottom: '0.5rem',
    lineHeight: 1.5,
  },
  moreItems: {
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  previewActions: {
    display: 'flex',
    gap: '1rem',
  },
}
