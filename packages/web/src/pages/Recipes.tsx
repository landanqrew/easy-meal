import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useSession } from '../lib/auth'
import { apiFetch, queryKeys } from '../lib/api'
import { colors, radius } from '../lib/theme'
import type { RecipeType, Tag, RecipeCard } from '@easy-meal/shared'

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

const RECIPE_TYPE_FILTERS: { value: RecipeType | null; label: string }[] = [
  { value: null, label: 'All Types' },
  { value: 'full_meal', label: 'Full Meal' },
  { value: 'entree', label: 'Entree' },
  { value: 'side', label: 'Side' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'appetizer', label: 'Appetizer' },
  { value: 'snack', label: 'Snack' },
  { value: 'drink', label: 'Drink' },
  { value: 'other', label: 'Other' },
]

export default function Recipes() {
  const navigate = useNavigate()
  const { data: session, isPending } = useSession()
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<RecipeType | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    if (!isPending && !session) {
      navigate('/login')
    }
  }, [session, isPending, navigate])

  const { data: recipes = [], isLoading: recipesLoading, error: recipesError } = useQuery({
    queryKey: queryKeys.recipes,
    queryFn: () => apiFetch<RecipeCard[]>('/api/recipes'),
    enabled: !!session,
  })

  const { data: tags = [] } = useQuery({
    queryKey: queryKeys.tags,
    queryFn: () => apiFetch<Tag[]>('/api/tags'),
    enabled: !!session,
  })

  const filteredRecipes = recipes
    .filter((r) => !filterTag || r.tags.some((t) => t.id === filterTag))
    .filter((r) => !filterType || r.type === filterType)
    .filter((r) => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        r.title.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q))
      )
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'az':
          return a.title.localeCompare(b.title)
        case 'za':
          return b.title.localeCompare(a.title)
        case 'cooktime':
          return ((a.prepTime ?? 0) + (a.cookTime ?? 0)) - ((b.prepTime ?? 0) + (b.cookTime ?? 0))
        case 'servings':
          return a.servings - b.servings
        default: // newest
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

  if (isPending || recipesLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <div className="skeleton" style={{ width: '120px', height: '1.5rem', marginBottom: '0.5rem' }} />
            <div className="skeleton" style={{ width: '180px', height: '0.875rem' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div className="skeleton" style={{ width: '70px', height: '36px', borderRadius: radius.sm }} />
            <div className="skeleton" style={{ width: '70px', height: '36px', borderRadius: radius.sm }} />
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
        <Link to="/recipe-lists" className="btn-secondary" style={{ textDecoration: 'none', fontSize: '0.8125rem', padding: '0.625rem 1rem' }}>
          My Lists
        </Link>
      </div>

      <div style={styles.createRow}>
        <Link to="/recipes/create" className="create-method-card" style={styles.createCard}>
          <span style={styles.createIcon}>✨</span>
          <span style={styles.createLabel}>Wizard</span>
          <span style={styles.createHint}>Step-by-step preferences</span>
        </Link>
        <Link to="/recipes/chat" className="create-method-card" style={styles.createCard}>
          <span style={styles.createIcon}>💬</span>
          <span style={styles.createLabel}>Chat</span>
          <span style={styles.createHint}>Describe a craving</span>
        </Link>
        <Link to="/recipes/manual" className="create-method-card" style={styles.createCard}>
          <span style={styles.createIcon}>✏️</span>
          <span style={styles.createLabel}>Manual</span>
          <span style={styles.createHint}>Type your own recipe</span>
        </Link>
        <Link to="/recipes/import" className="create-method-card" style={styles.createCardSecondary}>
          <span style={styles.createIcon}>📄</span>
          <span style={styles.createLabel}>Import</span>
          <span style={styles.createHint}>From PDF or image</span>
        </Link>
      </div>

      {recipesError && <div className="error-message" style={{ maxWidth: '900px', margin: '0 auto 1rem' }}>{recipesError.message}</div>}

      <div style={styles.searchRow}>
        <input
          type="text"
          placeholder="Search recipes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={styles.sortSelect}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="az">A-Z</option>
          <option value="za">Z-A</option>
          <option value="cooktime">Cook Time</option>
          <option value="servings">Servings</option>
        </select>
      </div>

      <div style={styles.filterSection}>
        <span style={styles.filterLabel}>Type:</span>
        {RECIPE_TYPE_FILTERS.map((t) => (
          <button
            key={t.label}
            onClick={() => setFilterType(filterType === t.value ? null : t.value)}
            className={`filter-chip${filterType === t.value ? ' active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tags.length > 0 && (
        <div style={styles.filterSection}>
          <span style={styles.filterLabel}>Tag:</span>
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
          <p style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>📝</p>
          <p>No recipes yet</p>
          <Link to="/recipes/create" className="btn-primary" style={{ display: 'inline-block', marginTop: '1rem', padding: '0.75rem 1.5rem', textDecoration: 'none' }}>
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
                <span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {recipe.source === 'ai_generated' ? '✨ AI' : recipe.source === 'imported' ? '📄 Imported' : recipe.source === 'community' ? '🌍 Community' : '✏️ Manual'}
                  <span style={{ padding: '0.125rem 0.375rem', borderRadius: radius.full, background: colors.warmBg, fontSize: '0.625rem' }}>
                    {RECIPE_TYPE_LABELS[recipe.type] || recipe.type}
                  </span>
                </span>
                {recipe.createdBy && (
                  <span>by {recipe.createdBy.name}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
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
    fontSize: '1.75rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: colors.text,
  },
  subtitle: {
    margin: '0.25rem 0 0',
    color: colors.textSecondary,
    fontSize: '0.875rem',
  },
  createRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '0.75rem',
    maxWidth: '900px',
    margin: '0 auto 1.5rem',
  },
  createCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '1rem 0.75rem',
    textDecoration: 'none',
    color: 'inherit',
  },
  createCardSecondary: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '1rem 0.75rem',
    textDecoration: 'none',
    color: 'inherit',
    opacity: 0.75,
  },
  createIcon: {
    fontSize: '1.5rem',
    marginBottom: '0.125rem',
  },
  createLabel: {
    fontWeight: 600,
    fontSize: '0.9375rem',
  },
  createHint: {
    fontSize: '0.75rem',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  searchRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    maxWidth: '900px',
    margin: '0 auto 1.5rem',
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: 1,
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    background: colors.surface,
    color: colors.text,
    outline: 'none',
    minWidth: '0',
  },
  sortSelect: {
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    background: colors.surface,
    color: colors.text,
    outline: 'none',
    cursor: 'pointer',
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
    color: colors.textSecondary,
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: colors.textSecondary,
  },
  recipeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1rem',
    maxWidth: '900px',
    margin: '0 auto',
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
    color: colors.textSecondary,
    lineHeight: 1.5,
    marginBottom: '0.75rem',
    flex: 1,
  },
  recipeMeta: {
    display: 'flex',
    gap: '0.75rem',
    fontSize: '0.75rem',
    color: colors.textSecondary,
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
    borderRadius: radius.full,
    background: colors.warmBg,
    fontSize: '0.6875rem',
    textTransform: 'capitalize',
  },
  recipeFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: colors.textMuted,
    borderTop: `1px solid ${colors.border}`,
    paddingTop: '0.75rem',
  },
}
