import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useSession } from '../lib/auth'
import { colors, shadows, radius } from '../lib/theme'
import type { RecipeType } from '@easy-meal/shared'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const RECIPE_TYPE_LABELS: Record<RecipeType, string> = {
  full_meal: 'Full Meal',
  entree: 'Entree',
  side: 'Side',
  dessert: 'Dessert',
  appetizer: 'Appetizer',
  snack: 'Snack',
  drink: 'Drink',
  other: 'Other',
}

const RECIPE_TYPES: RecipeType[] = ['full_meal', 'entree', 'side', 'dessert', 'appetizer', 'snack', 'drink', 'other']

type Ingredient = {
  id: string
  name: string
  quantity: string
  unit: string
  preparation: string | null
  category: string
}

type Tag = { id: string; name: string; color: string | null }

type Recipe = {
  id: string
  title: string
  description: string | null
  servings: number
  prepTime: number | null
  cookTime: number | null
  cuisine: string | null
  instructions: { stepNumber: number; text: string }[]
  source: string
  type: RecipeType
  isPublic: boolean
  copiedFromRecipeId: string | null
  createdAt: string
  updatedAt: string
  createdBy: { id: string; name: string } | null
  ingredients: Ingredient[]
  tags: Tag[]
}

type EditIngredient = {
  name: string
  quantity: string
  unit: string
  preparation: string
  category: string
}

type EditData = {
  title: string
  description: string
  servings: number
  prepTime: number | null
  cookTime: number | null
  cuisine: string
  type: RecipeType
  instructions: { stepNumber: number; text: string }[]
  ingredients: EditIngredient[]
}

type Checkin = {
  id: string
  recipeId: string
  notes: string | null
  enjoymentRating: number
  instructionRating: number
  createdAt: string
  userId: string
  userName: string | null
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <span style={{ display: 'inline-flex', gap: '0.125rem', cursor: 'pointer' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => onChange(star)}
          style={{
            fontSize: '1.5rem',
            color: star <= value ? colors.warning : colors.border,
            transition: 'color 0.15s',
          }}
        >
          &#9733;
        </span>
      ))}
    </span>
  )
}

function StarDisplay({ rating }: { rating: number }) {
  const stars = []
  for (let i = 1; i <= 5; i++) {
    stars.push(<span key={i} style={{ color: i <= rating ? colors.warning : colors.border }}>&#9733;</span>)
  }
  return <span style={{ fontSize: '0.8125rem' }}>{stars}</span>
}

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: session, isPending } = useSession()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState<EditData | null>(null)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [showCheckinForm, setShowCheckinForm] = useState(false)
  const [enjoymentRating, setEnjoymentRating] = useState(0)
  const [instructionRating, setInstructionRating] = useState(0)
  const [checkinNotes, setCheckinNotes] = useState('')
  const [submittingCheckin, setSubmittingCheckin] = useState(false)

  useEffect(() => {
    if (!isPending && !session) {
      navigate('/login')
    }
  }, [session, isPending, navigate])

  useEffect(() => {
    if (session && id) {
      fetchRecipe()
      fetchCheckins()
    }
  }, [session, id])

  const fetchRecipe = async () => {
    try {
      const res = await fetch(`${API_URL}/api/recipes/${id}`, { credentials: 'include' })
      const data = await res.json()
      if (res.ok) {
        setRecipe(data.data)
      } else {
        setError(data.error || 'Failed to load recipe')
      }
    } catch {
      setError('Failed to load recipe')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this recipe?')) return
    setDeleting(true)

    try {
      const res = await fetch(`${API_URL}/api/recipes/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (res.ok) {
        navigate('/recipes')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to delete recipe')
      }
    } catch {
      setError('Failed to delete recipe')
    } finally {
      setDeleting(false)
    }
  }

  const handlePublish = async () => {
    setPublishing(true)
    try {
      const res = await fetch(`${API_URL}/api/recipes/${id}/publish`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok && recipe) {
        setRecipe({ ...recipe, isPublic: data.data.isPublic })
      }
    } catch {
      setError('Failed to update publish status')
    } finally {
      setPublishing(false)
    }
  }

  const fetchCheckins = async () => {
    try {
      const res = await fetch(`${API_URL}/api/checkins/recipe/${id}`, { credentials: 'include' })
      const data = await res.json()
      if (res.ok) {
        setCheckins(data.data)
      }
    } catch {}
  }

  const handleCheckin = async () => {
    if (enjoymentRating < 1 || instructionRating < 1) {
      setError('Please select both ratings')
      return
    }
    setSubmittingCheckin(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/checkins`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId: id,
          notes: checkinNotes || undefined,
          enjoymentRating,
          instructionRating,
        }),
      })
      if (res.ok) {
        setEnjoymentRating(0)
        setInstructionRating(0)
        setCheckinNotes('')
        setShowCheckinForm(false)
        fetchCheckins()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to submit check-in')
      }
    } catch {
      setError('Failed to submit check-in')
    } finally {
      setSubmittingCheckin(false)
    }
  }

  const handleDeleteCheckin = async (checkinId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/checkins/${checkinId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        fetchCheckins()
      }
    } catch {}
  }

  const startEditing = () => {
    if (!recipe) return
    setEditData({
      title: recipe.title,
      description: recipe.description || '',
      servings: recipe.servings,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      cuisine: recipe.cuisine || '',
      type: recipe.type,
      instructions: recipe.instructions.map((s) => ({ ...s })),
      ingredients: recipe.ingredients.map((ing) => ({
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        preparation: ing.preparation || '',
        category: ing.category,
      })),
    })
    setEditing(true)
    setError('')
  }

  const cancelEditing = () => {
    setEditing(false)
    setEditData(null)
    setError('')
  }

  const handleSave = async () => {
    if (!editData) return
    setSaving(true)
    setError('')

    try {
      const res = await fetch(`${API_URL}/api/recipes/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editData.title,
          description: editData.description || null,
          servings: editData.servings,
          prepTime: editData.prepTime,
          cookTime: editData.cookTime,
          cuisine: editData.cuisine || null,
          type: editData.type,
          instructions: editData.instructions.map((s, i) => ({
            stepNumber: i + 1,
            text: s.text,
          })),
          ingredients: editData.ingredients,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setRecipe(data.data)
        setEditing(false)
        setEditData(null)
      } else {
        setError(data.error || 'Failed to save recipe')
      }
    } catch {
      setError('Failed to save recipe')
    } finally {
      setSaving(false)
    }
  }

  // Edit helpers
  const updateIngredient = (index: number, field: keyof EditIngredient, value: string) => {
    if (!editData) return
    const updated = [...editData.ingredients]
    updated[index] = { ...updated[index], [field]: value }
    setEditData({ ...editData, ingredients: updated })
  }

  const removeIngredient = (index: number) => {
    if (!editData) return
    setEditData({ ...editData, ingredients: editData.ingredients.filter((_, i) => i !== index) })
  }

  const addIngredient = () => {
    if (!editData) return
    setEditData({
      ...editData,
      ingredients: [...editData.ingredients, { name: '', quantity: '', unit: '', preparation: '', category: 'other' }],
    })
  }

  const updateInstruction = (index: number, text: string) => {
    if (!editData) return
    const updated = [...editData.instructions]
    updated[index] = { ...updated[index], text }
    setEditData({ ...editData, instructions: updated })
  }

  const removeInstruction = (index: number) => {
    if (!editData) return
    setEditData({ ...editData, instructions: editData.instructions.filter((_, i) => i !== index) })
  }

  const addInstruction = () => {
    if (!editData) return
    setEditData({
      ...editData,
      instructions: [...editData.instructions, { stepNumber: editData.instructions.length + 1, text: '' }],
    })
  }

  if (isPending || loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div className="skeleton" style={{ width: '60px', height: '0.875rem' }} />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div className="skeleton" style={{ width: '50px', height: '32px', borderRadius: radius.sm }} />
              <div className="skeleton" style={{ width: '60px', height: '32px', borderRadius: radius.sm }} />
            </div>
          </div>
          <div className="skeleton" style={{ width: '65%', height: '1.75rem', marginBottom: '0.75rem' }} />
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div className="skeleton" style={{ width: '80px', height: '0.875rem' }} />
            <div className="skeleton" style={{ width: '80px', height: '0.875rem' }} />
            <div className="skeleton" style={{ width: '80px', height: '0.875rem' }} />
          </div>
          <div className="skeleton" style={{ width: '100%', height: '1rem', marginBottom: '0.5rem' }} />
          <div className="skeleton" style={{ width: '90%', height: '1rem', marginBottom: '1.5rem' }} />
          <div className="skeleton" style={{ width: '100px', height: '1.125rem', marginBottom: '1rem' }} />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: '1rem', padding: '0.5rem 0', borderBottom: `1px solid ${colors.borderLight}` }}>
              <div className="skeleton" style={{ width: '80px', height: '0.875rem' }} />
              <div className="skeleton" style={{ width: '60%', height: '0.875rem' }} />
            </div>
          ))}
          <div className="skeleton" style={{ width: '100px', height: '1.125rem', margin: '2rem 0 1rem' }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: '1rem', padding: '1rem 0', borderBottom: `1px solid ${colors.borderLight}` }}>
              <div className="skeleton" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
              <div className="skeleton" style={{ width: '85%', height: '0.875rem' }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p>Recipe not found</p>
          <Link to="/recipes">Back to recipes</Link>
        </div>
      </div>
    )
  }

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0)

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <Link to="/recipes" className="back-link">
            ← Back
          </Link>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {editing ? (
              <>
                <button onClick={cancelEditing} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }} disabled={saving}>
                  Cancel
                </button>
                <button onClick={handleSave} className="btn-primary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handlePublish}
                  className={recipe.isPublic ? 'btn-primary' : 'btn-secondary'}
                  style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                  disabled={publishing}
                >
                  {publishing ? '...' : recipe.isPublic ? 'Public \u2713' : 'Make Public'}
                </button>
                <button onClick={startEditing} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                  Edit
                </button>
                <button onClick={handleDelete} className="btn-danger-outline" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </>
            )}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Title */}
        {editing && editData ? (
          <input
            className="edit-input"
            style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.75rem' }}
            value={editData.title}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
          />
        ) : (
          <h1 style={styles.title}>{recipe.title}</h1>
        )}

        {/* Meta row */}
        {editing && editData ? (
          <div style={styles.meta}>
            <span style={styles.metaEditGroup}>
              🕐
              <input
                className="edit-input"
                type="number"
                style={{ width: '50px', textAlign: 'center' }}
                value={editData.prepTime ?? ''}
                onChange={(e) => setEditData({ ...editData, prepTime: e.target.value ? Number(e.target.value) : null })}
                placeholder="—"
              />
              m prep
            </span>
            <span style={styles.metaEditGroup}>
              🍳
              <input
                className="edit-input"
                type="number"
                style={{ width: '50px', textAlign: 'center' }}
                value={editData.cookTime ?? ''}
                onChange={(e) => setEditData({ ...editData, cookTime: e.target.value ? Number(e.target.value) : null })}
                placeholder="—"
              />
              m cook
            </span>
            <span style={styles.metaEditGroup}>
              🍽
              <input
                className="edit-input"
                type="number"
                style={{ width: '40px', textAlign: 'center' }}
                value={editData.servings}
                onChange={(e) => setEditData({ ...editData, servings: Number(e.target.value) || 1 })}
                min={1}
              />
              servings
            </span>
            <span style={styles.metaEditGroup}>
              🌍
              <input
                className="edit-input"
                style={{ width: '100px' }}
                value={editData.cuisine}
                onChange={(e) => setEditData({ ...editData, cuisine: e.target.value })}
                placeholder="Cuisine"
              />
            </span>
            <span style={styles.metaEditGroup}>
              🏷
              <select
                className="edit-input"
                style={{ padding: '0.25rem 0.5rem' }}
                value={editData.type}
                onChange={(e) => setEditData({ ...editData, type: e.target.value as RecipeType })}
              >
                {RECIPE_TYPES.map((t) => (
                  <option key={t} value={t}>{RECIPE_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </span>
          </div>
        ) : (
          <div style={styles.meta}>
            {recipe.prepTime && <span>🕐 {recipe.prepTime}m prep</span>}
            {recipe.cookTime && <span>🍳 {recipe.cookTime}m cook</span>}
            {totalTime > 0 && <span>⏱ {totalTime}m total</span>}
            <span>🍽 {recipe.servings} servings</span>
            {recipe.cuisine && <span>🌍 {recipe.cuisine}</span>}
            <span style={{ padding: '0.125rem 0.5rem', borderRadius: radius.full, background: colors.warmBg, fontSize: '0.8125rem' }}>
              {RECIPE_TYPE_LABELS[recipe.type] || recipe.type}
            </span>
          </div>
        )}

        {/* Tags (view-only) */}
        {recipe.tags.length > 0 && (
          <div style={styles.tags}>
            {recipe.tags.map((tag) => (
              <span key={tag.id} style={styles.tag}>
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {editing && editData ? (
          <textarea
            className="edit-textarea"
            style={{ marginBottom: '1.5rem', fontSize: '1.0625rem', lineHeight: 1.6 }}
            rows={3}
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            placeholder="Recipe description..."
          />
        ) : (
          recipe.description && <p style={styles.description}>{recipe.description}</p>
        )}

        {/* Ingredients */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Ingredients</h2>
          {editing && editData ? (
            <div>
              {editData.ingredients.map((ing, i) => (
                <div key={i} className="edit-row">
                  <input
                    className="edit-input"
                    style={{ width: '55px', textAlign: 'right' }}
                    value={ing.quantity}
                    onChange={(e) => updateIngredient(i, 'quantity', e.target.value)}
                    placeholder="Qty"
                  />
                  <input
                    className="edit-input"
                    style={{ width: '55px' }}
                    value={ing.unit}
                    onChange={(e) => updateIngredient(i, 'unit', e.target.value)}
                    placeholder="Unit"
                  />
                  <input
                    className="edit-input"
                    style={{ flex: 1 }}
                    value={ing.name}
                    onChange={(e) => updateIngredient(i, 'name', e.target.value)}
                    placeholder="Ingredient"
                  />
                  <input
                    className="edit-input"
                    style={{ width: '100px' }}
                    value={ing.preparation}
                    onChange={(e) => updateIngredient(i, 'preparation', e.target.value)}
                    placeholder="Prep"
                  />
                  <button className="edit-remove-btn" onClick={() => removeIngredient(i)} title="Remove ingredient">
                    ×
                  </button>
                </div>
              ))}
              <button className="edit-add-btn" onClick={addIngredient}>
                + Add ingredient
              </button>
            </div>
          ) : (
            <ul style={styles.ingredientList}>
              {recipe.ingredients.map((ing) => (
                <li key={ing.id} style={styles.ingredientItem}>
                  <span style={styles.ingredientQty}>
                    {ing.quantity} {ing.unit}
                  </span>
                  <span style={styles.ingredientName}>
                    {ing.name}
                    {ing.preparation && (
                      <span style={styles.ingredientPrep}>, {ing.preparation}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Instructions */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Instructions</h2>
          {editing && editData ? (
            <div>
              {editData.instructions.map((step, i) => (
                <div key={i} className="edit-row" style={{ alignItems: 'flex-start' }}>
                  <span style={styles.stepNumber}>{i + 1}</span>
                  <textarea
                    className="edit-textarea"
                    style={{ flex: 1 }}
                    rows={2}
                    value={step.text}
                    onChange={(e) => updateInstruction(i, e.target.value)}
                    placeholder={`Step ${i + 1}...`}
                  />
                  <button className="edit-remove-btn" onClick={() => removeInstruction(i)} title="Remove step">
                    ×
                  </button>
                </div>
              ))}
              <button className="edit-add-btn" onClick={addInstruction}>
                + Add step
              </button>
            </div>
          ) : (
            <ol style={styles.instructionList}>
              {recipe.instructions.map((step) => (
                <li key={step.stepNumber} style={styles.instructionItem}>
                  <span style={styles.stepNumber}>{step.stepNumber}</span>
                  <span style={styles.stepText}>{step.text}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Check-ins */}
        <section style={styles.section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: `1px solid ${colors.border}` }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Check-Ins ({checkins.length})</h2>
            {!showCheckinForm && (
              <button onClick={() => setShowCheckinForm(true)} className="btn-secondary" style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}>
                Check In
              </button>
            )}
          </div>

          {showCheckinForm && (
            <div style={{ background: colors.warmBg, padding: '1.25rem', borderRadius: radius.md, marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text, minWidth: '90px' }}>Enjoyment</label>
                <StarInput value={enjoymentRating} onChange={setEnjoymentRating} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text, minWidth: '90px' }}>Instructions</label>
                <StarInput value={instructionRating} onChange={setInstructionRating} />
              </div>
              <textarea
                className="edit-textarea"
                placeholder="Notes (optional)"
                rows={3}
                value={checkinNotes}
                onChange={(e) => setCheckinNotes(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', marginBottom: '0.5rem' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={handleCheckin} className="btn-primary" style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }} disabled={submittingCheckin}>
                  {submittingCheckin ? 'Submitting...' : 'Submit'}
                </button>
                <button onClick={() => setShowCheckinForm(false)} className="btn-secondary" style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {checkins.length === 0 && !showCheckinForm && (
            <p style={{ color: colors.textMuted, fontSize: '0.875rem' }}>No check-ins yet. Be the first to check in!</p>
          )}

          {checkins.map((ch) => (
            <div key={ch.id} style={{ padding: '0.75rem 0', borderBottom: `1px solid ${colors.borderLight}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem', fontSize: '0.875rem' }}>
                <strong>{ch.userName || 'Anonymous'}</strong>
                <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>{new Date(ch.createdAt).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8125rem', color: colors.textSecondary, marginBottom: '0.375rem' }}>
                <span>Enjoyment: <StarDisplay rating={ch.enjoymentRating} /></span>
                <span>Instructions: <StarDisplay rating={ch.instructionRating} /></span>
              </div>
              {ch.notes && <p style={{ fontSize: '0.875rem', color: colors.text, lineHeight: 1.5, margin: '0.25rem 0 0' }}>{ch.notes}</p>}
              {session && ch.userId === session.user.id && (
                <button
                  onClick={() => handleDeleteCheckin(ch.id)}
                  style={{ background: 'none', border: 'none', color: colors.danger, cursor: 'pointer', fontSize: '0.75rem', padding: '0.25rem 0', marginTop: '0.25rem' }}
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </section>

        <div style={styles.footer}>
          <span style={styles.source}>
            {recipe.source === 'ai_generated'
              ? '✨ Generated with AI'
              : recipe.source === 'imported'
                ? '📄 Imported from PDF'
                : recipe.source === 'community'
                  ? '🌍 From Community'
                  : '✏️ Manually created'}
            {recipe.copiedFromRecipeId && (
              <> · <Link to={`/discover/recipes/${recipe.copiedFromRecipeId}`} style={{ color: colors.primary, fontSize: '0.75rem' }}>View original</Link></>
            )}
          </span>
          {recipe.createdBy && (
            <span style={styles.author}>Added by {recipe.createdBy.name}</span>
          )}
        </div>
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
    maxWidth: '700px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  title: {
    margin: 0,
    fontSize: '1.75rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    marginBottom: '0.75rem',
  },
  meta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    fontSize: '0.875rem',
    color: colors.textSecondary,
    marginBottom: '1rem',
  },
  metaEditGroup: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  tags: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    marginBottom: '1rem',
  },
  tag: {
    padding: '0.25rem 0.75rem',
    borderRadius: radius.full,
    background: colors.primaryLight,
    color: colors.primary,
    fontSize: '0.75rem',
    textTransform: 'capitalize',
  },
  description: {
    color: colors.text,
    lineHeight: 1.6,
    marginBottom: '1.5rem',
    fontSize: '1.0625rem',
  },
  section: {
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontSize: '1.125rem',
    fontWeight: 700,
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: `1px solid ${colors.border}`,
  },
  ingredientList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  ingredientItem: {
    display: 'flex',
    gap: '1rem',
    padding: '0.5rem 0',
    borderBottom: `1px solid ${colors.borderLight}`,
  },
  ingredientQty: {
    minWidth: '80px',
    color: colors.textSecondary,
    fontSize: '0.875rem',
  },
  ingredientName: {
    fontWeight: 500,
  },
  ingredientPrep: {
    fontWeight: 400,
    color: colors.textSecondary,
  },
  instructionList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    counterReset: 'step',
  },
  instructionItem: {
    display: 'flex',
    gap: '1rem',
    padding: '1rem 0',
    borderBottom: `1px solid ${colors.borderLight}`,
  },
  stepNumber: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: colors.primary,
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.875rem',
    fontWeight: 600,
    flexShrink: 0,
  },
  stepText: {
    lineHeight: 1.6,
    paddingTop: '0.25rem',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: colors.textMuted,
    paddingTop: '1rem',
    borderTop: `1px solid ${colors.border}`,
  },
  source: {},
  author: {},
}
