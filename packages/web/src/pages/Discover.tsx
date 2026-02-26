import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useSession } from '../lib/auth'
import { colors, radius, shadows } from '../lib/theme'
import { API_URL, queryKeys } from '../lib/api'
import type { Pagination } from '@easy-meal/shared'

type DiscoverRecipe = {
  id: string
  title: string
  description: string | null
  servings: number
  prepTime: number | null
  cookTime: number | null
  cuisine: string | null
  source: string
  createdAt: string
  creatorName: string | null
  avgEnjoymentRating: number
  avgInstructionRating: number
  checkinCount: number
}

function StarDisplay({ rating, count }: { rating: number; count?: number }) {
  const stars = []
  const rounded = Math.round(rating * 2) / 2
  for (let i = 1; i <= 5; i++) {
    if (i <= rounded) {
      stars.push(<span key={i} style={{ color: colors.warning }}>&#9733;</span>)
    } else {
      stars.push(<span key={i} style={{ color: colors.border }}>&#9733;</span>)
    }
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem' }}>
      {stars}
      {count !== undefined && <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>({count})</span>}
    </span>
  )
}

export { StarDisplay }

export default function Discover() {
  const navigate = useNavigate()
  const { data: session, isPending } = useSession()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!isPending && !session) {
      navigate('/login')
    }
  }, [session, isPending, navigate])

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  type DiscoverResponse = {
    recipes: DiscoverRecipe[]
    pagination: Pagination
  }

  const { data: discoverData, isLoading, error: queryError } = useQuery<DiscoverResponse>({
    queryKey: queryKeys.discover(page, debouncedSearch),
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (debouncedSearch) params.set('search', debouncedSearch)
      const res = await fetch(`${API_URL}/api/discover/recipes?${params}`, { credentials: 'include' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load recipes')
      return { recipes: json.data as DiscoverRecipe[], pagination: json.pagination as Pagination }
    },
    enabled: !!session,
    placeholderData: (prev) => prev,
  })

  const recipes = discoverData?.recipes ?? []
  const pagination = discoverData?.pagination ?? null
  const error = queryError?.message ?? ''

  const handleSearchChange = (value: string) => {
    setSearch(value)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (isPending) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <div className="skeleton" style={{ width: '180px', height: '1.5rem', marginBottom: '0.5rem' }} />
            <div className="skeleton" style={{ width: '240px', height: '0.875rem' }} />
          </div>
        </div>
        <div style={styles.searchBar}>
          <div className="skeleton" style={{ width: '100%', height: '44px', borderRadius: radius.md }} />
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
          <h1 style={styles.title}>Discover Recipes</h1>
          <p style={styles.subtitle}>
            Browse recipes shared by the community
          </p>
        </div>
      </div>

      <div style={styles.searchBar}>
        <input
          type="text"
          placeholder="Search recipes..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="edit-input"
          style={styles.searchInput}
        />
      </div>

      {error && <div className="error-message" style={{ maxWidth: '900px', margin: '0 auto 1rem' }}>{error}</div>}

      {isLoading && !discoverData ? (
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
      ) : recipes.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌍</p>
          <p style={{ fontSize: '1.125rem', marginBottom: '0.25rem', color: colors.text }}>No recipes shared yet</p>
          <p style={{ color: colors.textSecondary }}>Be the first to share a recipe with the community!</p>
        </div>
      ) : (
        <>
          <div style={styles.recipeGrid}>
            {recipes.map((recipe) => (
              <Link
                key={recipe.id}
                to={`/discover/recipes/${recipe.id}`}
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
                  {recipe.cuisine && <span>🌍 {recipe.cuisine}</span>}
                </div>
                {recipe.checkinCount > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <StarDisplay rating={recipe.avgEnjoymentRating} count={recipe.checkinCount} />
                  </div>
                )}
                <div style={styles.recipeFooter}>
                  <span>{recipe.creatorName ? `by ${recipe.creatorName}` : ''}</span>
                  <span>{recipe.checkinCount} check-in{recipe.checkinCount !== 1 ? 's' : ''}</span>
                </div>
              </Link>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="btn-secondary"
                style={styles.pageBtn}
              >
                Previous
              </button>
              <span style={styles.pageInfo}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="btn-secondary"
                style={styles.pageBtn}
              >
                Next
              </button>
            </div>
          )}
        </>
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
  searchBar: {
    maxWidth: '900px',
    margin: '0 auto 1.5rem',
  },
  searchInput: {
    width: '100%',
    padding: '0.75rem 1rem',
    fontSize: '0.9375rem',
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    background: 'white',
    boxSizing: 'border-box' as const,
  },
  emptyState: {
    textAlign: 'center' as const,
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
  recipeFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: colors.textMuted,
    borderTop: `1px solid ${colors.border}`,
    paddingTop: '0.75rem',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '2rem',
    maxWidth: '900px',
    margin: '2rem auto 0',
  },
  pageBtn: {
    fontSize: '0.875rem',
    padding: '0.5rem 1rem',
  },
  pageInfo: {
    fontSize: '0.875rem',
    color: colors.textSecondary,
  },
}
