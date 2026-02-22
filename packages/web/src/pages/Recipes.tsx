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
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <div className="skeleton" style={{ width: '120px', height: '1.5rem', marginBottom: '0.5rem' }} />
            <div className="skeleton" style={{ width: '180px', height: '0.875rem' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div className="skeleton" style={{ width: '70px', height: '36px', borderRadius: '6px' }} />
            <div className="skeleton" style={{ width: '70px', height: '36px', borderRadius: '6px' }} />
          </div>
        </div>
        <div style={styles.recipeGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton" style={{ width: '70%', height: '1.125rem', marginBottom: '0.5rem' }} />
              <div className="skeleton" style={{ width: '100%', height: '0.875rem', marginBottom: '0.375rem' }} />
              <div className="skeleton" style={{ width: '85%', height: '0.875rem', marginBottom: '0.75rem' }} />
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div className="skeleton" style={{ width: '60px', height: '0.75rem' }} />
                <div className="skeleton" style={{ width: '60px', height: '0.75rem' }} />
              </div>
              <div className="skeleton" style={{ width: '100%', height: '1px', marginBottom: '0.75rem' }} />
              <div className="skeleton" style={{ width: '40%', height: '0.75rem' }} />
            </div>
          ))}
        </div>
        <nav className="bottom-nav-bar">
          <Link to="/">Home</Link>
          <Link to="/recipes" className="active">Recipes</Link>
          <Link to="/meal-plan">Meal Plan</Link>
          <Link to="/grocery-lists">Groceries</Link>
          <Link to="/profile">Profile</Link>
        </nav>
      </div>
    )
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
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/recipe-lists" className="btn-secondary" style={{ textDecoration: 'none', fontSize: '0.8125rem', padding: '0.625rem 1rem' }}>
            My Lists
          </Link>
          <Link to="/recipes/create" className="btn-primary" style={{ textDecoration: 'none', fontSize: '0.8125rem', padding: '0.625rem 1rem' }}>
            Wizard
          </Link>
          <Link to="/recipes/chat" className="btn-secondary" style={{ textDecoration: 'none', fontSize: '0.8125rem', padding: '0.625rem 1rem' }}>
            Chat
          </Link>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {tags.length > 0 && (
        <div style={styles.filterSection}>
          <span style={styles.filterLabel}>Filter:</span>
          <button
            onClick={() => setFilterTag(null)}
            className={`filter-chip${filterTag === null ? ' active' : ''}`}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setFilterTag(filterTag === tag.id ? null : tag.id)}
              className={`filter-chip${filterTag === tag.id ? ' active' : ''}`}
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
              className="recipe-card"
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

      <nav className="bottom-nav-bar">
        <Link to="/">Home</Link>
        <Link to="/recipes" className="active">Recipes</Link>
        <Link to="/meal-plan">Meal Plan</Link>
        <Link to="/grocery-lists">Groceries</Link>
        <Link to="/profile">Profile</Link>
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
    background: '#FDF8F4',
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
    color: '#7A6B60',
    fontSize: '0.875rem',
  },
  createButton: {
    padding: '0.75rem 1.25rem',
    borderRadius: '6px',
    background: '#E07A5F',
    color: 'white',
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: '0.875rem',
  },
  error: {
    background: '#FDECEA',
    color: '#C44536',
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
    color: '#7A6B60',
  },
  filterChip: {
    padding: '0.375rem 0.75rem',
    borderRadius: '20px',
    border: '1px solid #E8DDD4',
    background: 'white',
    cursor: 'pointer',
    fontSize: '0.75rem',
    textTransform: 'capitalize',
  },
  filterChipActive: {
    background: '#E07A5F',
    color: 'white',
    borderColor: '#E07A5F',
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: '#7A6B60',
  },
  emptyButton: {
    display: 'inline-block',
    marginTop: '1rem',
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    background: '#E07A5F',
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
    color: '#7A6B60',
    lineHeight: 1.5,
    marginBottom: '0.75rem',
    flex: 1,
  },
  recipeMeta: {
    display: 'flex',
    gap: '0.75rem',
    fontSize: '0.75rem',
    color: '#7A6B60',
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
    background: '#FAF6F2',
    fontSize: '0.6875rem',
    textTransform: 'capitalize',
  },
  recipeFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: '#A89888',
    borderTop: '1px solid #E8DDD4',
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
    borderTop: '1px solid #E8DDD4',
  },
  navLink: {
    color: '#7A6B60',
    textDecoration: 'none',
    fontSize: '0.875rem',
  },
}
