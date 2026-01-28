import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '../lib/auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

type Tag = { id: string; name: string; color: string | null }
type Recipe = {
  id: string
  title: string
  description: string | null
  servings: number
  prepTime: number | null
  cookTime: number | null
  cuisine: string | null
  source: string
  createdAt: string
  createdBy: { id: string; name: string } | null
  tags: Tag[]
}

export default function Recipes() {
  const navigate = useNavigate()
  const { data: session, isPending } = useSession()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterTag, setFilterTag] = useState<string | null>(null)

  useEffect(() => {
    if (!isPending && !session) {
      navigate('/login')
    }
  }, [session, isPending, navigate])

  useEffect(() => {
    if (session) {
      fetchRecipes()
      fetchTags()
    }
  }, [session])

  const fetchRecipes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/recipes`, { credentials: 'include' })
      const data = await res.json()
      if (res.ok) {
        setRecipes(data.data)
      } else {
        setError(data.error || 'Failed to load recipes')
      }
    } catch {
      setError('Failed to load recipes')
    } finally {
      setLoading(false)
    }
  }

  const fetchTags = async () => {
    try {
      const res = await fetch(`${API_URL}/api/tags`, { credentials: 'include' })
      const data = await res.json()
      if (res.ok) {
        setTags(data.data)
      }
    } catch {}
  }

  const filteredRecipes = filterTag
    ? recipes.filter((r) => r.tags.some((t) => t.id === filterTag))
    : recipes

  if (isPending || loading) {
    return <div style={styles.loading}>Loading...</div>
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Recipes</h1>
          <p style={styles.subtitle}>
            {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} in your household
          </p>
        </div>
        <Link to="/recipes/create" style={styles.createButton}>
          + Create Recipe
        </Link>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {tags.length > 0 && (
        <div style={styles.filterSection}>
          <span style={styles.filterLabel}>Filter:</span>
          <button
            onClick={() => setFilterTag(null)}
            style={{
              ...styles.filterChip,
              ...(filterTag === null ? styles.filterChipActive : {}),
            }}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setFilterTag(filterTag === tag.id ? null : tag.id)}
              style={{
                ...styles.filterChip,
                ...(filterTag === tag.id ? styles.filterChipActive : {}),
              }}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {filteredRecipes.length === 0 ? (
        <div style={styles.emptyState}>
          <p>No recipes yet</p>
          <Link to="/recipes/create" style={styles.emptyButton}>
            Create your first recipe
          </Link>
        </div>
      ) : (
        <div style={styles.recipeGrid}>
          {filteredRecipes.map((recipe) => (
            <Link
              key={recipe.id}
              to={`/recipes/${recipe.id}`}
              style={styles.recipeCard}
            >
              <h3 style={styles.recipeTitle}>{recipe.title}</h3>
              {recipe.description && (
                <p style={styles.recipeDescription}>
                  {recipe.description.slice(0, 100)}
                  {recipe.description.length > 100 ? '...' : ''}
                </p>
              )}
              <div style={styles.recipeMeta}>
                {recipe.prepTime && <span>🕐 {recipe.prepTime}m prep</span>}
                {recipe.cookTime && <span>🍳 {recipe.cookTime}m cook</span>}
                <span>🍽 {recipe.servings} servings</span>
              </div>
              {recipe.tags.length > 0 && (
                <div style={styles.recipeTags}>
                  {recipe.tags.map((tag) => (
                    <span key={tag.id} style={styles.recipeTag}>
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
              <div style={styles.recipeFooter}>
                <span style={styles.recipeSource}>
                  {recipe.source === 'ai_generated' ? '✨ AI' : '✏️ Manual'}
                </span>
                {recipe.createdBy && (
                  <span style={styles.recipeAuthor}>by {recipe.createdBy.name}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <nav style={styles.bottomNav}>
        <Link to="/" style={styles.navLink}>
          Home
        </Link>
        <Link to="/household" style={styles.navLink}>
          Household
        </Link>
        <Link to="/profile" style={styles.navLink}>
          Profile
        </Link>
      </nav>
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
    background: '#f5f5f5',
    padding: '2rem 1rem',
    paddingBottom: '5rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.5rem',
    maxWidth: '900px',
    margin: '0 auto 1.5rem',
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 600,
  },
  subtitle: {
    margin: '0.25rem 0 0',
    color: '#666',
    fontSize: '0.875rem',
  },
  createButton: {
    padding: '0.75rem 1.25rem',
    borderRadius: '6px',
    background: '#2563eb',
    color: 'white',
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: '0.875rem',
  },
  error: {
    background: '#fee',
    color: '#c00',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    maxWidth: '900px',
    margin: '0 auto 1rem',
  },
  filterSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    maxWidth: '900px',
    margin: '0 auto 1.5rem',
    flexWrap: 'wrap',
  },
  filterLabel: {
    fontSize: '0.875rem',
    color: '#666',
  },
  filterChip: {
    padding: '0.375rem 0.75rem',
    borderRadius: '20px',
    border: '1px solid #ddd',
    background: 'white',
    cursor: 'pointer',
    fontSize: '0.75rem',
    textTransform: 'capitalize',
  },
  filterChipActive: {
    background: '#2563eb',
    color: 'white',
    borderColor: '#2563eb',
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: '#666',
  },
  emptyButton: {
    display: 'inline-block',
    marginTop: '1rem',
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    background: '#2563eb',
    color: 'white',
    textDecoration: 'none',
  },
  recipeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1rem',
    maxWidth: '900px',
    margin: '0 auto',
  },
  recipeCard: {
    background: 'white',
    borderRadius: '10px',
    padding: '1.25rem',
    textDecoration: 'none',
    color: 'inherit',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    transition: 'box-shadow 0.15s',
    display: 'flex',
    flexDirection: 'column',
  },
  recipeTitle: {
    margin: 0,
    fontSize: '1.125rem',
    fontWeight: 600,
    marginBottom: '0.5rem',
  },
  recipeDescription: {
    margin: 0,
    fontSize: '0.875rem',
    color: '#666',
    lineHeight: 1.5,
    marginBottom: '0.75rem',
    flex: 1,
  },
  recipeMeta: {
    display: 'flex',
    gap: '0.75rem',
    fontSize: '0.75rem',
    color: '#666',
    marginBottom: '0.75rem',
  },
  recipeTags: {
    display: 'flex',
    gap: '0.375rem',
    flexWrap: 'wrap',
    marginBottom: '0.75rem',
  },
  recipeTag: {
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    background: '#f0f0f0',
    fontSize: '0.625rem',
    textTransform: 'capitalize',
  },
  recipeFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: '#999',
    borderTop: '1px solid #eee',
    paddingTop: '0.75rem',
  },
  recipeSource: {},
  recipeAuthor: {},
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'white',
    display: 'flex',
    justifyContent: 'space-around',
    padding: '0.75rem 0',
    borderTop: '1px solid #eee',
  },
  navLink: {
    color: '#666',
    textDecoration: 'none',
    fontSize: '0.875rem',
  },
}
