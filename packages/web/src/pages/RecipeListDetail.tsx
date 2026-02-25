import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '../lib/auth'
import { colors, shadows, radius } from '../lib/theme'
import { apiFetch, apiPost, apiPatch, apiDelete, queryKeys } from '../lib/api'

type Tag = { id: string; name: string; color: string | null }

type RecipeInList = {
  id: string
  title: string
  description: string | null
  servings: number
  prepTime: number | null
  cookTime: number | null
  cuisine: string | null
  position: number
  tags: Tag[]
}

type RecipeList = {
  id: string
  name: string
  description: string | null
  recipes: RecipeInList[]
}

type HouseholdRecipe = {
  id: string
  title: string
  cuisine: string | null
}

export default function RecipeListDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: session, isPending } = useSession()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [showAddRecipe, setShowAddRecipe] = useState(false)
  const [recipeSearch, setRecipeSearch] = useState('')
  const [addingRecipeId, setAddingRecipeId] = useState<string | null>(null)

  useEffect(() => {
    if (!isPending && !session) {
      navigate('/login')
    }
  }, [session, isPending, navigate])

  const { data: list, isLoading } = useQuery({
    queryKey: queryKeys.recipeList(id!),
    queryFn: () => apiFetch<RecipeList>(`/api/recipe-lists/${id}`),
    enabled: !!session && !!id,
  })

  const { data: householdRecipes = [] } = useQuery({
    queryKey: queryKeys.recipes,
    queryFn: () => apiFetch<HouseholdRecipe[]>('/api/recipes'),
    enabled: !!session && showAddRecipe,
  })

  const handleDelete = async () => {
    if (!confirm('Delete this list? Recipes won\'t be affected.')) return
    setDeleting(true)

    try {
      await apiDelete(`/api/recipe-lists/${id}`)
      navigate('/recipe-lists')
    } catch (err: any) {
      setError(err.message || 'Failed to delete list')
    } finally {
      setDeleting(false)
    }
  }

  const handleUpdate = async () => {
    if (!editName.trim()) return

    try {
      const data = await apiPatch<{ name: string; description: string | null }>(`/api/recipe-lists/${id}`, {
        name: editName.trim(),
        description: editDescription.trim() || null,
      })
      queryClient.setQueryData(queryKeys.recipeList(id!), (prev: RecipeList | undefined) =>
        prev ? { ...prev, name: data.name, description: data.description } : undefined
      )
      setEditing(false)
    } catch (err: any) {
      setError(err.message || 'Failed to update list')
    }
  }

  const handleAddRecipe = async (recipeId: string) => {
    setAddingRecipeId(recipeId)
    setError('')

    try {
      await apiPost(`/api/recipe-lists/${id}/recipes`, { recipeId })
      queryClient.invalidateQueries({ queryKey: queryKeys.recipeList(id!) })
      setRecipeSearch('')
    } catch (err: any) {
      setError(err.message || 'Failed to add recipe')
    } finally {
      setAddingRecipeId(null)
    }
  }

  const handleRemoveRecipe = async (recipeId: string) => {
    // Optimistic update
    queryClient.setQueryData(queryKeys.recipeList(id!), (prev: RecipeList | undefined) =>
      prev ? { ...prev, recipes: prev.recipes.filter((r) => r.id !== recipeId) } : undefined
    )
    try {
      await apiDelete(`/api/recipe-lists/${id}/recipes/${recipeId}`)
    } catch {
      // Revert on failure
      queryClient.invalidateQueries({ queryKey: queryKeys.recipeList(id!) })
      setError('Failed to remove recipe')
    }
  }

  const openAddRecipe = () => {
    setShowAddRecipe(true)
  }

  const availableRecipes = householdRecipes.filter(
    (hr) =>
      !list?.recipes.some((r) => r.id === hr.id) &&
      (recipeSearch === '' ||
        hr.title.toLowerCase().includes(recipeSearch.toLowerCase()))
  )

  if (isPending || isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.topBar}>
          <div className="skeleton" style={{ width: '60px', height: '0.875rem' }} />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div className="skeleton" style={{ width: '50px', height: '30px', borderRadius: radius.sm }} />
            <div className="skeleton" style={{ width: '55px', height: '30px', borderRadius: radius.sm }} />
          </div>
        </div>
        <div style={styles.titleSection}>
          <div className="skeleton" style={{ width: '45%', height: '1.5rem', marginBottom: '0.5rem' }} />
          <div className="skeleton" style={{ width: '80%', height: '0.875rem', marginBottom: '0.25rem' }} />
          <div className="skeleton" style={{ width: '80px', height: '0.8125rem' }} />
        </div>
        <div style={styles.recipeGrid}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton" style={{ width: '70%', height: '1.125rem', marginBottom: '0.5rem' }} />
              <div className="skeleton" style={{ width: '100%', height: '0.875rem', marginBottom: '0.75rem' }} />
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div className="skeleton" style={{ width: '60px', height: '0.75rem' }} />
                <div className="skeleton" style={{ width: '60px', height: '0.75rem' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!list) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p>List not found</p>
          <Link to="/recipe-lists">Back to lists</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <Link to="/recipe-lists" className="back-link">
          ← Back
        </Link>
        <div style={styles.topActions}>
          <button
            onClick={() => {
              setEditName(list.name)
              setEditDescription(list.description || '')
              setEditing(!editing)
            }}
            className="btn-secondary"
            style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button
            onClick={handleDelete}
            className="btn-danger-outline"
            style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}
            disabled={deleting}
          >
            {deleting ? '...' : 'Delete'}
          </button>
        </div>
      </div>

      {error && <div className="error-message" style={{ maxWidth: '900px', margin: '0 auto 1rem' }}>{error}</div>}

      {editing ? (
        <div style={styles.editForm}>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            style={styles.editInput}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
          />
          <input
            type="text"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Description (optional)"
            style={styles.editInput}
            onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
          />
          <button onClick={handleUpdate} className="btn-primary" style={{ fontSize: '0.875rem', padding: '0.625rem 1.25rem' }}>
            Save
          </button>
        </div>
      ) : (
        <div style={styles.titleSection}>
          <h1 style={styles.title}>{list.name}</h1>
          {list.description && (
            <p style={styles.description}>{list.description}</p>
          )}
          <p style={styles.recipeCount}>
            {list.recipes.length} recipe{list.recipes.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {list.recipes.length === 0 && !showAddRecipe ? (
        <div style={styles.emptyState}>
          <p>📋 No recipes in this list yet</p>
          <button onClick={openAddRecipe} className="btn-primary" style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', fontSize: '0.875rem' }}>
            Add recipes
          </button>
        </div>
      ) : (
        <>
          <div style={styles.recipeGrid}>
            {list.recipes.map((recipe) => (
              <div key={recipe.id} className="recipe-card" style={{ position: 'relative' as const }}>
                <Link
                  to={`/recipes/${recipe.id}`}
                  style={styles.recipeLink}
                >
                  <h3 style={styles.recipeTitle}>{recipe.title}</h3>
                  {recipe.description && (
                    <p style={styles.recipeDescription}>
                      {recipe.description.slice(0, 100)}
                      {recipe.description.length > 100 ? '...' : ''}
                    </p>
                  )}
                  <div style={styles.recipeMeta}>
                    {recipe.prepTime && <span>prep {recipe.prepTime}m</span>}
                    {recipe.cookTime && <span>cook {recipe.cookTime}m</span>}
                    <span>{recipe.servings} servings</span>
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
                </Link>
                <button
                  onClick={() => handleRemoveRecipe(recipe.id)}
                  className="edit-remove-btn"
                  style={styles.removeButton}
                  title="Remove from list"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {!showAddRecipe && (
            <button onClick={openAddRecipe} className="grocery-add-btn">
              + Add Recipe
            </button>
          )}
        </>
      )}

      {showAddRecipe && (
        <div style={styles.addSection}>
          <div style={styles.addHeader}>
            <h3 style={styles.addTitle}>Add Recipes</h3>
            <button
              onClick={() => {
                setShowAddRecipe(false)
                setRecipeSearch('')
              }}
              className="btn-secondary"
              style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}
            >
              Done
            </button>
          </div>
          <input
            type="text"
            value={recipeSearch}
            onChange={(e) => setRecipeSearch(e.target.value)}
            placeholder="Search recipes..."
            style={styles.searchInput}
            autoFocus
          />
          <div style={styles.addList}>
            {availableRecipes.length === 0 ? (
              <p style={styles.noResults}>
                {recipeSearch ? 'No matching recipes' : 'All recipes already added'}
              </p>
            ) : (
              availableRecipes.map((recipe) => (
                <div key={recipe.id} style={styles.addItem}>
                  <div>
                    <span style={styles.addItemTitle}>{recipe.title}</span>
                    {recipe.cuisine && (
                      <span style={styles.addItemCuisine}>{recipe.cuisine}</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddRecipe(recipe.id)}
                    disabled={addingRecipeId === recipe.id}
                    className="btn-primary"
                    style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem', minHeight: 'unset' }}
                  >
                    {addingRecipeId === recipe.id ? '...' : '+ Add'}
                  </button>
                </div>
              ))
            )}
          </div>
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
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '900px',
    margin: '0 auto 1rem',
  },
  topActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  editForm: {
    maxWidth: '900px',
    margin: '0 auto 1.5rem',
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  editInput: {
    padding: '0.625rem 0.75rem',
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    fontSize: '0.875rem',
    outline: 'none',
    flex: 1,
    minWidth: '150px',
  },
  titleSection: {
    maxWidth: '900px',
    margin: '0 auto 1.5rem',
  },
  title: {
    margin: 0,
    fontSize: '1.75rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  description: {
    margin: '0.25rem 0 0',
    color: colors.textSecondary,
    fontSize: '0.875rem',
    lineHeight: 1.4,
  },
  recipeCount: {
    margin: '0.25rem 0 0',
    color: colors.textMuted,
    fontSize: '0.8125rem',
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: colors.textSecondary,
    maxWidth: '900px',
    margin: '0 auto',
  },
  recipeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1rem',
    maxWidth: '900px',
    margin: '0 auto',
  },
  recipeCard: {
    position: 'relative',
  },
  recipeLink: {
    textDecoration: 'none',
    color: 'inherit',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  recipeTitle: {
    margin: '0 1.5rem 0.5rem 0',
    fontSize: '1.125rem',
    fontWeight: 600,
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
  },
  recipeTag: {
    padding: '0.25rem 0.5rem',
    borderRadius: radius.full,
    background: colors.warmBg,
    fontSize: '0.6875rem',
    textTransform: 'capitalize',
  },
  removeButton: {
    position: 'absolute',
    top: '0.75rem',
    right: '0.75rem',
  },
  addSection: {
    background: 'white',
    borderRadius: radius.md,
    padding: '1.25rem',
    boxShadow: shadows.sm,
    border: `1px solid ${colors.borderLight}`,
    maxWidth: '900px',
    margin: '1rem auto 0',
  },
  addHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  addTitle: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 500,
  },
  searchInput: {
    width: '100%',
    padding: '0.625rem 0.75rem',
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    fontSize: '0.875rem',
    outline: 'none',
    marginBottom: '0.75rem',
    boxSizing: 'border-box',
  },
  addList: {
    maxHeight: '300px',
    overflowY: 'auto',
  },
  noResults: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: '0.875rem',
    padding: '1rem 0',
  },
  addItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.625rem 0',
    borderBottom: `1px solid ${colors.borderLight}`,
  },
  addItemTitle: {
    fontSize: '0.9375rem',
    fontWeight: 500,
  },
  addItemCuisine: {
    marginLeft: '0.5rem',
    fontSize: '0.75rem',
    color: colors.textMuted,
  },
  card: {
    background: 'white',
    padding: '1.5rem',
    borderRadius: radius.lg,
    boxShadow: shadows.md,
    border: `1px solid ${colors.borderLight}`,
    maxWidth: '500px',
    margin: '0 auto',
  },
}
