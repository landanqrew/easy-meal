import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useSession } from '../lib/auth'
import { colors, shadows, radius } from '../lib/theme'
import type { RecipeType } from '@easy-meal/shared'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

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

const CATEGORIES = ['produce', 'dairy', 'meat', 'seafood', 'pantry', 'frozen', 'bakery', 'beverages', 'other']

type IngredientRow = {
  name: string
  quantity: string
  unit: string
  category: string
  preparation: string
}

type InstructionRow = {
  text: string
}

function emptyIngredient(): IngredientRow {
  return { name: '', quantity: '', unit: '', category: 'produce', preparation: '' }
}

function emptyInstruction(): InstructionRow {
  return { text: '' }
}

export default function ManualRecipe() {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: session, isPending } = useSession()
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [recipeType, setRecipeType] = useState<RecipeType>('entree')
  const [cuisine, setCuisine] = useState('')
  const [servings, setServings] = useState(4)
  const [prepTime, setPrepTime] = useState('')
  const [cookTime, setCookTime] = useState('')
  const [ingredients, setIngredients] = useState<IngredientRow[]>([emptyIngredient()])
  const [instructions, setInstructions] = useState<InstructionRow[]>([emptyInstruction()])

  useEffect(() => {
    if (!isPending && !session) {
      navigate('/login')
    }
  }, [session, isPending, navigate])

  const updateIngredient = (index: number, field: keyof IngredientRow, value: string) => {
    setIngredients((prev) => prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing)))
  }

  const removeIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index))
  }

  const updateInstruction = (index: number, value: string) => {
    setInstructions((prev) => prev.map((inst, i) => (i === index ? { text: value } : inst)))
  }

  const removeInstruction = (index: number) => {
    setInstructions((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Recipe title is required')
      return
    }

    const validIngredients = ingredients.filter((ing) => ing.name.trim() && ing.quantity)
    const validInstructions = instructions.filter((inst) => inst.text.trim())

    setSaving(true)
    setError('')

    try {
      const res = await fetch(`${API_URL}/api/recipes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          servings,
          prepTime: prepTime ? parseInt(prepTime) : undefined,
          cookTime: cookTime ? parseInt(cookTime) : undefined,
          cuisine: cuisine.trim() || undefined,
          type: recipeType,
          source: 'manual',
          ingredients: validIngredients.map((ing) => ({
            name: ing.name.trim().toLowerCase(),
            quantity: parseFloat(ing.quantity),
            unit: ing.unit.trim() || 'piece',
            category: ing.category,
            preparation: ing.preparation.trim() || undefined,
          })),
          instructions: validInstructions.map((inst, i) => ({
            stepNumber: i + 1,
            text: inst.text.trim(),
          })),
        }),
      })

      const data = await res.json()
      if (res.ok) {
        navigate(returnTo || `/recipes/${data.data.id}`)
      } else {
        setError(data.error || 'Failed to save recipe')
      }
    } catch {
      setError('Failed to save recipe')
    } finally {
      setSaving(false)
    }
  }

  if (isPending) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div className="skeleton" style={{ width: '180px', height: '1.5rem' }} />
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <Link to="/recipes" className="back-link">
            ← Back
          </Link>
          <h1 style={styles.title}>Create Recipe</h1>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Basics */}
        <div style={styles.section}>
          <label style={styles.label}>Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Grandma's Tomato Soup"
            style={styles.input}
          />
        </div>

        <div style={styles.section}>
          <label style={styles.label}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A brief description of this recipe"
            style={styles.textarea}
            rows={2}
          />
        </div>

        <div style={styles.row}>
          <div style={styles.fieldHalf}>
            <label style={styles.label}>Type</label>
            <select
              value={recipeType}
              onChange={(e) => setRecipeType(e.target.value as RecipeType)}
              style={styles.select}
            >
              {RECIPE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.fieldHalf}>
            <label style={styles.label}>Cuisine</label>
            <input
              type="text"
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              placeholder="e.g., Italian"
              style={styles.input}
            />
          </div>
        </div>

        {/* Timing & Servings */}
        <div style={styles.row}>
          <div style={styles.fieldThird}>
            <label style={styles.label}>Servings</label>
            <input
              type="number"
              value={servings}
              onChange={(e) => setServings(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              style={styles.input}
            />
          </div>
          <div style={styles.fieldThird}>
            <label style={styles.label}>Prep (min)</label>
            <input
              type="number"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              placeholder="15"
              min={0}
              style={styles.input}
            />
          </div>
          <div style={styles.fieldThird}>
            <label style={styles.label}>Cook (min)</label>
            <input
              type="number"
              value={cookTime}
              onChange={(e) => setCookTime(e.target.value)}
              placeholder="30"
              min={0}
              style={styles.input}
            />
          </div>
        </div>

        {/* Ingredients */}
        <div style={styles.section}>
          <label style={styles.label}>Ingredients</label>
          <div style={styles.ingredientList}>
            {ingredients.map((ing, i) => (
              <div key={i} style={styles.ingredientRow}>
                <input
                  type="text"
                  value={ing.name}
                  onChange={(e) => updateIngredient(i, 'name', e.target.value)}
                  placeholder="Ingredient"
                  style={{ ...styles.input, flex: 2 }}
                />
                <input
                  type="number"
                  value={ing.quantity}
                  onChange={(e) => updateIngredient(i, 'quantity', e.target.value)}
                  placeholder="Qty"
                  step="0.25"
                  min={0}
                  style={{ ...styles.input, flex: 0.7 }}
                />
                <input
                  type="text"
                  value={ing.unit}
                  onChange={(e) => updateIngredient(i, 'unit', e.target.value)}
                  placeholder="Unit"
                  style={{ ...styles.input, flex: 0.8 }}
                />
                <select
                  value={ing.category}
                  onChange={(e) => updateIngredient(i, 'category', e.target.value)}
                  style={{ ...styles.select, flex: 1 }}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={ing.preparation}
                  onChange={(e) => updateIngredient(i, 'preparation', e.target.value)}
                  placeholder="Prep"
                  style={{ ...styles.input, flex: 1 }}
                />
                <button
                  onClick={() => removeIngredient(i)}
                  style={styles.removeBtn}
                  type="button"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setIngredients((prev) => [...prev, emptyIngredient()])}
            style={styles.addBtn}
            type="button"
          >
            + Add Ingredient
          </button>
        </div>

        {/* Instructions */}
        <div style={styles.section}>
          <label style={styles.label}>Instructions</label>
          <div style={styles.instructionList}>
            {instructions.map((inst, i) => (
              <div key={i} style={styles.instructionRow}>
                <span style={styles.stepNumber}>{i + 1}.</span>
                <textarea
                  value={inst.text}
                  onChange={(e) => updateInstruction(i, e.target.value)}
                  placeholder={`Step ${i + 1}...`}
                  style={styles.instructionInput}
                  rows={2}
                />
                <button
                  onClick={() => removeInstruction(i)}
                  style={styles.removeBtn}
                  type="button"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setInstructions((prev) => [...prev, emptyInstruction()])}
            style={styles.addBtn}
            type="button"
          >
            + Add Step
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="btn-primary"
          style={{ width: '100%', padding: '0.875rem', fontSize: '1rem' }}
        >
          {saving ? 'Saving...' : 'Save Recipe'}
        </button>
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
    maxWidth: '750px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '1.5rem',
  },
  title: {
    margin: '0.5rem 0 0',
    fontSize: '1.75rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  section: {
    marginBottom: '1.5rem',
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: 500,
    marginBottom: '0.5rem',
    color: colors.text,
  },
  input: {
    width: '100%',
    padding: '0.625rem 0.75rem',
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    fontSize: '0.875rem',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '0.625rem 0.75rem',
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    fontSize: '0.875rem',
    boxSizing: 'border-box' as const,
    resize: 'vertical' as const,
    fontFamily: 'inherit',
  },
  select: {
    width: '100%',
    padding: '0.625rem 0.75rem',
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    fontSize: '0.875rem',
    boxSizing: 'border-box' as const,
    background: 'white',
  },
  row: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap' as const,
  },
  fieldHalf: {
    flex: '1 1 200px',
  },
  fieldThird: {
    flex: '1 1 120px',
  },
  ingredientList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
    marginBottom: '0.5rem',
  },
  ingredientRow: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  instructionList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
    marginBottom: '0.5rem',
  },
  instructionRow: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'flex-start',
  },
  stepNumber: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: colors.textMuted,
    minWidth: '1.5rem',
    paddingTop: '0.625rem',
  },
  instructionInput: {
    flex: 1,
    padding: '0.625rem 0.75rem',
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    fontSize: '0.875rem',
    boxSizing: 'border-box' as const,
    resize: 'vertical' as const,
    fontFamily: 'inherit',
  },
  addBtn: {
    background: 'none',
    border: 'none',
    color: colors.primary,
    cursor: 'pointer',
    fontSize: '0.8125rem',
    fontWeight: 500,
    padding: '0.25rem 0',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: colors.textMuted,
    cursor: 'pointer',
    fontSize: '1.125rem',
    padding: '0.25rem',
    lineHeight: 1,
    flexShrink: 0,
  },
}
