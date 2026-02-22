import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useSession } from '../lib/auth'
import { colors, shadows, radius } from '../lib/theme'
import type { GeneratedRecipe } from '@easy-meal/shared'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

type State = 'upload' | 'processing' | 'preview' | 'error'

export default function ImportRecipe() {
  const navigate = useNavigate()
  const { data: session } = useSession()

  const [state, setState] = useState<State>('upload')
  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a PDF, JPG, or PNG file.')
      setState('error')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10MB.')
      setState('error')
      return
    }

    setState('processing')
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`${API_URL}/api/recipes/import-pdf`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to extract recipe from PDF')
        setState('error')
      } else {
        setRecipe(data.data)
        setState('preview')
      }
    } catch {
      setError('Failed to extract recipe from PDF')
      setState('error')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
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
          source: 'imported',
          type: recipe.type || 'full_meal',
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to save recipe')
      } else {
        navigate(`/recipes/${data.data.id}`)
      }
    } catch {
      setError('Failed to save recipe')
    } finally {
      setSaving(false)
    }
  }

  const handleTryAgain = () => {
    setRecipe(null)
    setError('')
    setState('upload')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (!session) return null

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <Link to="/recipes" className="back-link">
            ← Back
          </Link>
          <h1 style={styles.title}>Import from PDF</h1>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Upload state */}
        {(state === 'upload' || state === 'error') && (
          <div
            style={{
              ...styles.dropZone,
              borderColor: dragOver ? colors.primary : colors.border,
              background: dragOver ? colors.primaryLight : colors.warmBg,
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div style={styles.dropIcon}>📄</div>
            <p style={styles.dropText}>
              Drop a file here, or click to select
            </p>
            <p style={styles.dropHint}>PDF, JPG, or PNG — max 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {/* Processing state */}
        {state === 'processing' && (
          <div style={styles.processingContainer}>
            <div className="spinner" style={styles.spinner} />
            <p style={styles.processingText}>Extracting recipe from PDF...</p>
            <p style={styles.processingHint}>This may take a few seconds</p>
          </div>
        )}

        {/* Preview state */}
        {state === 'preview' && recipe && (
          <div>
            <h2 style={styles.recipeTitle}>{recipe.title}</h2>
            {recipe.description && <p style={styles.description}>{recipe.description}</p>}

            <div style={styles.meta}>
              {recipe.prepTime && <span>🕐 {recipe.prepTime}m prep</span>}
              {recipe.cookTime && <span>🍳 {recipe.cookTime}m cook</span>}
              <span>🍽 {recipe.servings} servings</span>
              {recipe.cuisine && <span>🌍 {recipe.cuisine}</span>}
            </div>

            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>Ingredients</h3>
              <ul style={styles.ingredientList}>
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} style={styles.ingredientItem}>
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
            </section>

            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>Instructions</h3>
              <ol style={styles.instructionList}>
                {recipe.instructions.map((step) => (
                  <li key={step.stepNumber} style={styles.instructionItem}>
                    <span style={styles.stepNumber}>{step.stepNumber}</span>
                    <span style={styles.stepText}>{step.text}</span>
                  </li>
                ))}
              </ol>
            </section>

            <div style={styles.actions}>
              <button
                onClick={handleSave}
                className="btn-primary"
                style={{ padding: '0.75rem 1.5rem' }}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Recipe'}
              </button>
              <button
                onClick={handleTryAgain}
                className="btn-secondary"
                style={{ padding: '0.75rem 1.5rem' }}
                disabled={saving}
              >
                Try Again
              </button>
            </div>
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
  header: {
    marginBottom: '1.5rem',
  },
  title: {
    margin: '0.75rem 0 0',
    fontSize: '1.5rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: colors.text,
  },
  dropZone: {
    border: `2px dashed ${colors.border}`,
    borderRadius: radius.md,
    padding: '3rem 2rem',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  dropIcon: {
    fontSize: '3rem',
    marginBottom: '0.75rem',
  },
  dropText: {
    fontSize: '1.0625rem',
    fontWeight: 500,
    color: colors.text,
    margin: '0 0 0.5rem',
  },
  dropHint: {
    fontSize: '0.875rem',
    color: colors.textMuted,
    margin: 0,
  },
  processingContainer: {
    textAlign: 'center',
    padding: '3rem 2rem',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: `3px solid ${colors.borderLight}`,
    borderTopColor: colors.primary,
    borderRadius: '50%',
    margin: '0 auto 1rem',
    animation: 'spin 0.8s linear infinite',
  },
  processingText: {
    fontSize: '1.0625rem',
    fontWeight: 500,
    color: colors.text,
    margin: '0 0 0.25rem',
  },
  processingHint: {
    fontSize: '0.875rem',
    color: colors.textMuted,
    margin: 0,
  },
  recipeTitle: {
    margin: '0 0 0.5rem',
    fontSize: '1.5rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: colors.text,
  },
  description: {
    color: colors.textSecondary,
    lineHeight: 1.6,
    marginBottom: '1rem',
    fontSize: '1rem',
  },
  meta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    fontSize: '0.875rem',
    color: colors.textSecondary,
    marginBottom: '1.5rem',
  },
  section: {
    marginBottom: '1.5rem',
  },
  sectionTitle: {
    fontSize: '1.0625rem',
    fontWeight: 700,
    marginBottom: '0.75rem',
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
  },
  instructionItem: {
    display: 'flex',
    gap: '1rem',
    padding: '0.75rem 0',
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
  actions: {
    display: 'flex',
    gap: '0.75rem',
    paddingTop: '0.5rem',
  },
}
