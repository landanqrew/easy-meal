import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useSession } from '../lib/auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

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
  const { data: session, isPending } = useSession()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [listName, setListName] = useState('')
  const [selectedRecipes, setSelectedRecipes] = useState<Map<string, number>>(new Map())

  useEffect(() => {
    if (!isPending && !session) {
      navigate('/login')
    }
  }, [session, isPending, navigate])

  useEffect(() => {
    if (session) {
      fetchRecipes()
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
      const res = await fetch(`${API_URL}/api/grocery-lists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: listName,
          recipes: recipeSelections,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        navigate(`/grocery-lists/${data.data.id}`)
      } else {
        setError(data.error || 'Failed to create grocery list')
      }
    } catch {
      setError('Failed to create grocery list')
    } finally {
      setCreating(false)
    }
  }

  if (isPending || loading) {
    return <div style={styles.loading}>Loading...</div>
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <Link to="/grocery-lists" style={styles.backLink}>
            ← Back
          </Link>
          <h1 style={styles.title}>Create Grocery List</h1>
        </div>

        {error && <div style={styles.error}>{error}</div>}

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
          style={{
            ...styles.createButton,
            ...(creating || selectedRecipes.size === 0 ? styles.createButtonDisabled : {}),
          }}
        >
          {creating ? 'Creating...' : 'Create Grocery List'}
        </button>
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
    marginBottom: '1.5rem',
  },
  backLink: {
    color: '#7A6B60',
    textDecoration: 'none',
    fontSize: '0.875rem',
  },
  title: {
    margin: '0.5rem 0 0',
    fontSize: '1.5rem',
    fontWeight: 600,
  },
  error: {
    background: '#FDECEA',
    color: '#C44536',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontSize: '0.875rem',
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
    color: '#7A6B60',
    margin: '0 0 1rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid #E8DDD4',
    fontSize: '1rem',
    boxSizing: 'border-box',
  },
  emptyState: {
    textAlign: 'center',
    padding: '2rem',
    color: '#7A6B60',
    background: '#FAF6F2',
    borderRadius: '8px',
  },
  emptyLink: {
    color: '#E07A5F',
    textDecoration: 'none',
  },
  recipeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  recipeCard: {
    border: '1px solid #E8DDD4',
    borderRadius: '8px',
    padding: '1rem',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  recipeCardSelected: {
    borderColor: '#E07A5F',
    background: '#FDF0ED',
  },
  recipeMain: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  checkbox: {
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    border: '2px solid #E8DDD4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#E07A5F',
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
    color: '#7A6B60',
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
    borderRadius: '4px',
    border: '1px solid #E8DDD4',
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
    color: '#7A6B60',
  },
  createButton: {
    width: '100%',
    padding: '0.875rem',
    borderRadius: '6px',
    border: 'none',
    background: '#E07A5F',
    color: 'white',
    fontSize: '1rem',
    fontWeight: 500,
    cursor: 'pointer',
  },
  createButtonDisabled: {
    background: '#ccc',
    cursor: 'not-allowed',
  },
}
