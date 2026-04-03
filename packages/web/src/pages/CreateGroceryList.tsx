import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useSession } from '../lib/auth'
import { colors, shadows, radius } from '../lib/theme'
import { apiFetch, apiPost, queryKeys } from '../lib/api'
import { useQuery } from '@tanstack/react-query'

type Recipe = {
  id: string
  title: string
  servings: number
  prepTime: number | null
  cookTime: number | null
}

type SelectedRecipe = {
  recipeId: string
  servings: number
}

export default function CreateGroceryList() {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: session, isPending } = useSession()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [initialized, setInitialized] = useState(false)

  const mealPlanState = location.state as {
    fromMealPlan?: boolean
    recipeIds?: string[]
    weekLabel?: string
  } | null

  const [listName, setListName] = useState(mealPlanState?.weekLabel || '')
  const [selectedRecipes, setSelectedRecipes] = useState<Map<string, number>>(new Map())

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: queryKeys.recipes,
    queryFn: () => apiFetch<Recipe[]>('/api/recipes'),
    enabled: !!session,
  })

  useEffect(() => {
    if (!isPending && !session) {
      navigate('/login')
    }
  }, [session, isPending, navigate])

  useEffect(() => {
    if (!initialized && !isLoading && recipes.length > 0 && mealPlanState?.recipeIds?.length) {
      const preSelected = new Map<string, number>()
      for (const id of mealPlanState.recipeIds) {
        const recipe = recipes.find((r) => r.id === id)
        if (recipe) {
          preSelected.set(id, recipe.servings)
        }
      }
      if (preSelected.size > 0) {
        setSelectedRecipes(preSelected)
      }
      setInitialized(true)
    }
  }, [initialized, isLoading, recipes, mealPlanState])

  const toggleRecipe = (recipe: Recipe) => {
    const newSelected = new Map(selectedRecipes)
    if (newSelected.has(recipe.id)) {
      newSelected.delete(recipe.id)
    } else {
      newSelected.set(recipe.id, recipe.servings)
    }
    setSelectedRecipes(newSelected)
  }

  const updateServings = (recipeId: string, servings: number) => {
    if (servings < 1) return
    const newSelected = new Map(selectedRecipes)
    newSelected.set(recipeId, servings)
    setSelectedRecipes(newSelected)
  }

  const handleCreate = async () => {
    if (!listName.trim()) {
      setError('Please enter a name for your grocery list')
      return
    }
    if (selectedRecipes.size === 0) {
      setError('Please select at least one recipe')
      return
    }

    setCreating(true)
    setError('')

    const recipeSelections: SelectedRecipe[] = []
    selectedRecipes.forEach((servings, recipeId) => {
      recipeSelections.push({ recipeId, servings })
    })

    try {
      const data = await apiPost<{ id: string }>('/api/grocery-lists', {
        name: listName,
        recipes: recipeSelections,
      })
      navigate(`/grocery-lists/${data.id}`)
    } catch (err) {
      setError((err as Error).message || 'Failed to create grocery list')
    } finally {
      setCreating(false)
    }
  }

  if (isPending || isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div className="skeleton" style={{ width: '60px', height: '0.875rem' }} />
            <div className="skeleton" style={{ width: '180px', height: '1.5rem', marginTop: '0.5rem' }} />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="skeleton" style={{ width: '70px', height: '0.875rem', marginBottom: '0.5rem' }} />
            <div className="skeleton" style={{ width: '100%', height: '44px', borderRadius: radius.sm }} />
          </div>
          <div>
            <div className="skeleton" style={{ width: '120px', height: '0.875rem', marginBottom: '0.5rem' }} />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ border: `1px solid ${colors.borderLight}`, borderRadius: radius.md, padding: '1rem', marginBottom: '0.625rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="skeleton" style={{ width: '22px', height: '22px', borderRadius: '6px' }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ width: '60%', height: '0.9375rem', marginBottom: '0.25rem' }} />
                    <div className="skeleton" style={{ width: '100px', height: '0.75rem' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="skeleton" style={{ width: '100%', height: '44px', borderRadius: radius.sm, marginTop: '0.5rem' }} />
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <Link to="/grocery-lists" className="back-link" style={styles.backLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </Link>
          <h1 style={styles.title}>Create Grocery List</h1>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div style={styles.section}>
          <label style={styles.label}>List Name</label>
          <input
            type="text"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            placeholder="e.g., This week's groceries"
            style={styles.input}
          />
        </div>

        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <label style={styles.label}>Select Recipes</label>
            {selectedRecipes.size > 0 && (
              <span style={styles.selectedCount}>
                {selectedRecipes.size} selected
              </span>
            )}
          </div>
          <p style={styles.hint}>
            Choose recipes and adjust servings. Ingredients will be combined automatically.
          </p>

          {recipes.length === 0 ? (
            <div style={styles.emptyState}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '0.5rem', opacity: 0.5 }}>
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <p style={{ margin: '0 0 0.5rem' }}>No recipes yet.</p>
              <Link to="/recipes/create" style={styles.emptyLink}>
                Create your first recipe
              </Link>
            </div>
          ) : (
            <div style={styles.recipeList}>
              {recipes.map((recipe) => {
                const isSelected = selectedRecipes.has(recipe.id)
                const servings = selectedRecipes.get(recipe.id) || recipe.servings

                return (
                  <div
                    key={recipe.id}
                    className="grocery-recipe-card"
                    style={{
                      ...styles.recipeCard,
                      ...(isSelected ? styles.recipeCardSelected : {}),
                    }}
                    onClick={() => toggleRecipe(recipe)}
                  >
                    <div style={styles.recipeMain}>
                      <div style={{
                        ...styles.checkbox,
                        ...(isSelected ? styles.checkboxSelected : {}),
                      }}>
                        {isSelected && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <div style={styles.recipeInfo}>
                        <span style={styles.recipeTitle}>{recipe.title}</span>
                        <span style={styles.recipeMeta}>
                          {recipe.prepTime && `${recipe.prepTime}m prep`}
                          {recipe.prepTime && recipe.cookTime && ' · '}
                          {recipe.cookTime && `${recipe.cookTime}m cook`}
                          {!recipe.prepTime && !recipe.cookTime && `${recipe.servings} servings`}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <div style={styles.servingsControl} onClick={(e) => e.stopPropagation()}>
                        <span style={styles.servingsLabel}>Servings</span>
                        <div style={styles.servingsStepper}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              updateServings(recipe.id, servings - 1)
                            }}
                            style={styles.servingsButton}
                            aria-label="Decrease servings"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          </button>
                          <span style={styles.servingsValue}>{servings}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              updateServings(recipe.id, servings + 1)
                            }}
                            style={styles.servingsButton}
                            aria-label="Increase servings"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <button
          onClick={handleCreate}
          disabled={creating || selectedRecipes.size === 0}
          className="btn-primary"
          style={styles.createBtn}
        >
          {creating ? (
            <>
              <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
              Creating...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              Create Grocery List
            </>
          )}
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: colors.bg,
    padding: '1.5rem 1rem 2rem',
    paddingTop: '5.5rem',
  },
  card: {
    background: colors.surface,
    padding: '2rem',
    borderRadius: radius.lg,
    boxShadow: shadows.md,
    border: `1px solid ${colors.borderLight}`,
    maxWidth: '700px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '1.5rem',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  title: {
    margin: '0.625rem 0 0',
    fontSize: '1.5rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: colors.text,
  },
  section: {
    marginBottom: '1.5rem',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: '0.25rem',
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: colors.text,
    marginBottom: '0.5rem',
  },
  selectedCount: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: colors.primary,
    background: colors.primaryLight,
    padding: '0.125rem 0.5rem',
    borderRadius: radius.full,
  },
  hint: {
    fontSize: '0.8125rem',
    color: colors.textSecondary,
    margin: '0 0 1rem',
    lineHeight: 1.4,
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
    fontSize: '0.9375rem',
    boxSizing: 'border-box',
    background: colors.warmBg,
    color: colors.text,
    transition: 'all 150ms ease',
  },
  emptyState: {
    textAlign: 'center',
    padding: '2rem',
    color: colors.textSecondary,
    background: colors.warmBg,
    borderRadius: radius.md,
    fontSize: '0.875rem',
  },
  emptyLink: {
    color: colors.primary,
    textDecoration: 'none',
    fontWeight: 500,
  },
  recipeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.625rem',
  },
  recipeCard: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: '0.875rem 1rem',
    cursor: 'pointer',
    background: colors.surface,
    outline: 'none',
  },
  recipeCardSelected: {
    borderColor: colors.primary,
    background: colors.primaryLight,
  },
  recipeMain: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: colors.textMuted,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    background: colors.surface,
    flexShrink: 0,
  },
  checkboxSelected: {
    background: colors.primary,
    borderColor: colors.primary,
  },
  recipeInfo: {
    flex: 1,
    minWidth: 0,
  },
  recipeTitle: {
    display: 'block',
    fontWeight: 500,
    fontSize: '0.9375rem',
    color: colors.text,
    lineHeight: 1.3,
  },
  recipeMeta: {
    fontSize: '0.75rem',
    color: colors.textMuted,
    marginTop: '0.125rem',
    display: 'block',
  },
  servingsControl: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '0.75rem',
    marginLeft: '2.5rem',
    padding: '0.5rem 0.75rem',
    background: colors.warmBg,
    borderRadius: radius.sm,
  },
  servingsLabel: {
    fontSize: '0.75rem',
    color: colors.textSecondary,
    fontWeight: 500,
  },
  servingsStepper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.125rem',
    background: colors.surface,
    borderRadius: radius.sm,
    border: `1px solid ${colors.borderLight}`,
  },
  servingsButton: {
    width: '32px',
    height: '32px',
    minHeight: '32px',
    borderRadius: radius.sm,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.textSecondary,
    transition: 'all 150ms ease',
  },
  servingsValue: {
    minWidth: '2rem',
    textAlign: 'center',
    fontWeight: 600,
    fontSize: '0.9375rem',
    color: colors.text,
  },
  createBtn: {
    width: '100%',
    padding: '0.875rem',
    fontSize: '0.9375rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
}
