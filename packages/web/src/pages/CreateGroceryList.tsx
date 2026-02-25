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

  // Read pre-selection state from MealPlan navigation
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

  // Pre-select recipes from meal plan navigation
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
            <div className="skeleton" style={{ width: '280px', height: '0.8125rem', marginBottom: '1rem' }} />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '1rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="skeleton" style={{ width: '24px', height: '24px', borderRadius: '4px' }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ width: '60%', height: '0.9375rem', marginBottom: '0.25rem' }} />
                    <div className="skeleton" style={{ width: '100px', height: '0.8125rem' }} />
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
          <Link to="/grocery-lists" className="back-link">
            ← Back
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
          <label style={styles.label}>
            Select Recipes ({selectedRecipes.size} selected)
          </label>
          <p style={styles.hint}>
            Choose recipes and adjust servings. Ingredients will be combined automatically.
          </p>

          {recipes.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📝</p>
              <p>No recipes yet.</p>
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
                    className="selectable-recipe"
                    style={{
                      ...styles.recipeCard,
                      ...(isSelected ? styles.recipeCardSelected : {}),
                    }}
                  >
                    <div style={styles.recipeMain} onClick={() => toggleRecipe(recipe)}>
                      <div style={styles.checkbox}>
                        {isSelected ? '✓' : ''}
                      </div>
                      <div style={styles.recipeInfo}>
                        <span style={styles.recipeTitle}>{recipe.title}</span>
                        <span style={styles.recipeMeta}>
                          {recipe.prepTime && `${recipe.prepTime}m prep`}
                          {recipe.prepTime && recipe.cookTime && ' · '}
                          {recipe.cookTime && `${recipe.cookTime}m cook`}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <div style={styles.servingsControl}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            updateServings(recipe.id, servings - 1)
                          }}
                          style={styles.servingsButton}
                        >
                          −
                        </button>
                        <span style={styles.servingsValue}>{servings}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            updateServings(recipe.id, servings + 1)
                          }}
                          style={styles.servingsButton}
                        >
                          +
                        </button>
                        <span style={styles.servingsLabel}>servings</span>
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
          style={{ width: '100%', padding: '0.875rem', fontSize: '1rem' }}
        >
          {creating ? 'Creating...' : 'Create Grocery List'}
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
    maxWidth: '700px',
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
  },
  hint: {
    fontSize: '0.8125rem',
    color: colors.textSecondary,
    margin: '0 0 1rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    fontSize: '1rem',
    boxSizing: 'border-box',
  },
  emptyState: {
    textAlign: 'center',
    padding: '2rem',
    color: colors.textSecondary,
    background: colors.warmBg,
    borderRadius: radius.md,
  },
  emptyLink: {
    color: colors.primary,
    textDecoration: 'none',
  },
  recipeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  recipeCard: {
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    padding: '1rem',
    cursor: 'pointer',
    transition: 'all 0.15s',
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
    width: '24px',
    height: '24px',
    borderRadius: radius.sm,
    border: `2px solid ${colors.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: colors.primary,
    background: 'white',
    flexShrink: 0,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeTitle: {
    display: 'block',
    fontWeight: 500,
  },
  recipeMeta: {
    fontSize: '0.8125rem',
    color: colors.textSecondary,
  },
  servingsControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '0.75rem',
    marginLeft: '2.25rem',
  },
  servingsButton: {
    width: '28px',
    height: '28px',
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    background: 'white',
    cursor: 'pointer',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingsValue: {
    minWidth: '2rem',
    textAlign: 'center',
    fontWeight: 500,
  },
  servingsLabel: {
    fontSize: '0.8125rem',
    color: colors.textSecondary,
  },
}
