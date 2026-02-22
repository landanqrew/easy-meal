import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useSession } from '../lib/auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

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
  const [list, setList] = useState<RecipeList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [showAddRecipe, setShowAddRecipe] = useState(false)
  const [householdRecipes, setHouseholdRecipes] = useState<HouseholdRecipe[]>([])
  const [recipeSearch, setRecipeSearch] = useState('')
  const [addingRecipeId, setAddingRecipeId] = useState<string | null>(null)

  useEffect(() => {
    if (!isPending && !session) {
      navigate('/login')
    }
  }, [session, isPending, navigate])

  useEffect(() => {
    if (session && id) {
      fetchList()
    }
  }, [session, id])

  const fetchList = async () => {
    try {
      const res = await fetch(`${API_URL}/api/recipe-lists/${id}`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok) {
        setList(data.data)
      } else {
        setError(data.error || 'Failed to load list')
      }
    } catch {
      setError('Failed to load list')
    } finally {
      setLoading(false)
    }
  }

  const fetchHouseholdRecipes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/recipes`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok) {
        setHouseholdRecipes(data.data)
      }
    } catch {}
  }

  const handleDelete = async () => {
    if (!confirm('Delete this list? Recipes won\'t be affected.')) return
    setDeleting(true)

    try {
      const res = await fetch(`${API_URL}/api/recipe-lists/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        navigate('/recipe-lists')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to delete list')
      }
    } catch {
      setError('Failed to delete list')
    } finally {
      setDeleting(false)
    }
  }

  const handleUpdate = async () => {
    if (!editName.trim()) return

    try {
      const res = await fetch(`${API_URL}/api/recipe-lists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setList((prev) =>
          prev
            ? { ...prev, name: data.data.name, description: data.data.description }
            : null
        )
        setEditing(false)
      } else {
        setError(data.error || 'Failed to update list')
      }
    } catch {
      setError('Failed to update list')
    }
  }

  const handleAddRecipe = async (recipeId: string) => {
    setAddingRecipeId(recipeId)
    setError('')

    try {
      const res = await fetch(`${API_URL}/api/recipe-lists/${id}/recipes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ recipeId }),
      })
      if (res.ok) {
        await fetchList()
        setRecipeSearch('')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to add recipe')
      }
    } catch {
      setError('Failed to add recipe')
    } finally {
      setAddingRecipeId(null)
    }
  }

  const handleRemoveRecipe = async (recipeId: string) => {
    try {
      await fetch(`${API_URL}/api/recipe-lists/${id}/recipes/${recipeId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      setList((prev) =>
        prev
          ? { ...prev, recipes: prev.recipes.filter((r) => r.id !== recipeId) }
          : null
      )
    } catch {
      setError('Failed to remove recipe')
    }
  }

  const openAddRecipe = () => {
    setShowAddRecipe(true)
    fetchHouseholdRecipes()
  }

  const availableRecipes = householdRecipes.filter(
    (hr) =>
      !list?.recipes.some((r) => r.id === hr.id) &&
      (recipeSearch === '' ||
        hr.title.toLowerCase().includes(recipeSearch.toLowerCase()))
  )

  if (isPending || loading) {
    return (
      <div style={styles.container}>
        <div style={styles.topBar}>
          <div className="skeleton" style={{ width: '60px', height: '0.875rem' }} />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div className="skeleton" style={{ width: '50px', height: '30px', borderRadius: '4px' }} />
            <div className="skeleton" style={{ width: '55px', height: '30px', borderRadius: '4px' }} />
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
        <nav className="bottom-nav-bar">
          <Link to="/">Home</Link>
          <Link to="/recipes">Recipes</Link>
          <Link to="/meal-plan">Meal Plan</Link>
          <Link to="/grocery-lists">Groceries</Link>
          <Link to="/profile">Profile</Link>
        </nav>
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
        <Link to="/recipe-lists" style={styles.backLink}>
          ← Back
        </Link>
        <div style={styles.topActions}>
          <button
            onClick={() => {
              setEditName(list.name)
              setEditDescription(list.description || '')
              setEditing(!editing)
            }}
            style={styles.editButton}
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button
            onClick={handleDelete}
            style={styles.deleteButton}
            disabled={deleting}
          >
            {deleting ? '...' : 'Delete'}
          </button>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

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
          <button onClick={handleUpdate} style={styles.saveButton}>
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
          <p>No recipes in this list yet</p>
          <button onClick={openAddRecipe} style={styles.emptyButton}>
            Add recipes
          </button>
        </div>
      ) : (
        <>
          <div style={styles.recipeGrid}>
            {list.recipes.map((recipe) => (
              <div key={recipe.id} style={styles.recipeCard}>
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
                  style={styles.removeButton}
                  title="Remove from list"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {!showAddRecipe && (
            <button onClick={openAddRecipe} style={styles.addRecipeButton}>
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
              style={styles.closeButton}
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
                    style={styles.addItemButton}
                  >
                    {addingRecipeId === recipe.id ? '...' : '+ Add'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <nav className="bottom-nav-bar">
        <Link to="/">Home</Link>
        <Link to="/recipes">Recipes</Link>
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
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '900px',
    margin: '0 auto 1rem',
  },
  backLink: {
    color: '#7A6B60',
    textDecoration: 'none',
    fontSize: '0.875rem',
  },
  topActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  editButton: {
    padding: '0.375rem 0.75rem',
    borderRadius: '4px',
    border: '1px solid #E8DDD4',
    background: 'white',
    cursor: 'pointer',
    fontSize: '0.8125rem',
  },
  deleteButton: {
    padding: '0.375rem 0.75rem',
    borderRadius: '4px',
    border: '1px solid #C44536',
    background: 'white',
    color: '#C44536',
    cursor: 'pointer',
    fontSize: '0.8125rem',
  },
  error: {
    background: '#FDECEA',
    color: '#C44536',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    maxWidth: '900px',
    margin: '0 auto 1rem',
    fontSize: '0.875rem',
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
    borderRadius: '6px',
    border: '1px solid #E8DDD4',
    fontSize: '0.875rem',
    outline: 'none',
    flex: 1,
    minWidth: '150px',
  },
  saveButton: {
    padding: '0.625rem 1.25rem',
    borderRadius: '6px',
    border: 'none',
    background: '#E07A5F',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
  },
  titleSection: {
    maxWidth: '900px',
    margin: '0 auto 1.5rem',
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 600,
  },
  description: {
    margin: '0.25rem 0 0',
    color: '#7A6B60',
    fontSize: '0.875rem',
    lineHeight: 1.4,
  },
  recipeCount: {
    margin: '0.25rem 0 0',
    color: '#A89888',
    fontSize: '0.8125rem',
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: '#7A6B60',
    maxWidth: '900px',
    margin: '0 auto',
  },
  emptyButton: {
    display: 'inline-block',
    marginTop: '1rem',
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    background: '#E07A5F',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
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
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
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
  },
  recipeTag: {
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    background: '#FAF6F2',
    fontSize: '0.6875rem',
    textTransform: 'capitalize',
  },
  removeButton: {
    position: 'absolute',
    top: '0.75rem',
    right: '0.75rem',
    width: '28px',
    height: '28px',
    borderRadius: '4px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '1.25rem',
    color: '#A89888',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRecipeButton: {
    display: 'block',
    width: '100%',
    maxWidth: '900px',
    margin: '1rem auto 0',
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px dashed #E8DDD4',
    background: 'transparent',
    color: '#7A6B60',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  addSection: {
    background: 'white',
    borderRadius: '10px',
    padding: '1.25rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
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
  closeButton: {
    padding: '0.375rem 0.75rem',
    borderRadius: '4px',
    border: '1px solid #E8DDD4',
    background: 'white',
    cursor: 'pointer',
    fontSize: '0.8125rem',
  },
  searchInput: {
    width: '100%',
    padding: '0.625rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #E8DDD4',
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
    color: '#A89888',
    fontSize: '0.875rem',
    padding: '1rem 0',
  },
  addItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.625rem 0',
    borderBottom: '1px solid #F0E8E0',
  },
  addItemTitle: {
    fontSize: '0.9375rem',
    fontWeight: 500,
  },
  addItemCuisine: {
    marginLeft: '0.5rem',
    fontSize: '0.75rem',
    color: '#A89888',
  },
  addItemButton: {
    padding: '0.375rem 0.75rem',
    borderRadius: '4px',
    border: 'none',
    background: '#E07A5F',
    color: 'white',
    cursor: 'pointer',
    fontSize: '0.8125rem',
    flexShrink: 0,
  },
  card: {
    background: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    maxWidth: '500px',
    margin: '0 auto',
  },
}
