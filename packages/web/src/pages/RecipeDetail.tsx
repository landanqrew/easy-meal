import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useSession } from '../lib/auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

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
  createdAt: string
  updatedAt: string
  createdBy: { id: string; name: string } | null
  ingredients: Ingredient[]
  tags: Tag[]
}

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: session, isPending } = useSession()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!isPending && !session) {
      navigate('/login')
    }
  }, [session, isPending, navigate])

  useEffect(() => {
    if (session && id) {
      fetchRecipe()
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

  if (isPending || loading) {
    return <div style={styles.loading}>Loading...</div>
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
        <div style={styles.header}>
          <Link to="/recipes" style={styles.backLink}>
            ← Back
          </Link>
          <button onClick={handleDelete} style={styles.deleteButton} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <h1 style={styles.title}>{recipe.title}</h1>

        <div style={styles.meta}>
          {recipe.prepTime && <span>🕐 {recipe.prepTime}m prep</span>}
          {recipe.cookTime && <span>🍳 {recipe.cookTime}m cook</span>}
          {totalTime > 0 && <span>⏱ {totalTime}m total</span>}
          <span>🍽 {recipe.servings} servings</span>
          {recipe.cuisine && <span>🌍 {recipe.cuisine}</span>}
        </div>

        {recipe.tags.length > 0 && (
          <div style={styles.tags}>
            {recipe.tags.map((tag) => (
              <span key={tag.id} style={styles.tag}>
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {recipe.description && <p style={styles.description}>{recipe.description}</p>}

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Ingredients</h2>
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
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Instructions</h2>
          <ol style={styles.instructionList}>
            {recipe.instructions.map((step) => (
              <li key={step.stepNumber} style={styles.instructionItem}>
                <span style={styles.stepNumber}>{step.stepNumber}</span>
                <span style={styles.stepText}>{step.text}</span>
              </li>
            ))}
          </ol>
        </section>

        <div style={styles.footer}>
          <span style={styles.source}>
            {recipe.source === 'ai_generated' ? '✨ Generated with AI' : '✏️ Manually created'}
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
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
  },
  container: {
    minHeight: '100vh',
    background: '#FDF8F4',
    padding: '2rem 1rem',
  },
  card: {
    background: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    maxWidth: '700px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  backLink: {
    color: '#7A6B60',
    textDecoration: 'none',
    fontSize: '0.875rem',
  },
  deleteButton: {
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: '1px solid #C44536',
    background: 'white',
    color: '#C44536',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  error: {
    background: '#FDECEA',
    color: '#C44536',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontSize: '0.875rem',
  },
  title: {
    margin: 0,
    fontSize: '1.75rem',
    fontWeight: 600,
    marginBottom: '0.75rem',
  },
  meta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    fontSize: '0.875rem',
    color: '#7A6B60',
    marginBottom: '1rem',
  },
  tags: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    marginBottom: '1rem',
  },
  tag: {
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    background: '#FDF0ED',
    color: '#E07A5F',
    fontSize: '0.75rem',
    textTransform: 'capitalize',
  },
  description: {
    color: '#3D3028',
    lineHeight: 1.6,
    marginBottom: '1.5rem',
    fontSize: '1.0625rem',
  },
  section: {
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontSize: '1.125rem',
    fontWeight: 600,
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid #E8DDD4',
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
    borderBottom: '1px solid #F0E8E0',
  },
  ingredientQty: {
    minWidth: '80px',
    color: '#7A6B60',
    fontSize: '0.875rem',
  },
  ingredientName: {
    fontWeight: 500,
  },
  ingredientPrep: {
    fontWeight: 400,
    color: '#7A6B60',
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
    borderBottom: '1px solid #F0E8E0',
  },
  stepNumber: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: '#E07A5F',
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
    color: '#A89888',
    paddingTop: '1rem',
    borderTop: '1px solid #E8DDD4',
  },
  source: {},
  author: {},
}
