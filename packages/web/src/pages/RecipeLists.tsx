import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '../lib/auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

type RecipeList = {
  id: string
  name: string
  description: string | null
  position: number
  recipeCount: number
  recipes: { id: string; title: string; position: number }[]
}

export default function RecipeLists() {
  const navigate = useNavigate()
  const { data: session, isPending } = useSession()
  const [lists, setLists] = useState<RecipeList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!isPending && !session) {
      navigate('/login')
    }
  }, [session, isPending, navigate])

  useEffect(() => {
    if (session) {
      fetchLists()
    }
  }, [session])

  const fetchLists = async () => {
    try {
      const res = await fetch(`${API_URL}/api/recipe-lists`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok) {
        setLists(data.data)
      } else {
        setError(data.error || 'Failed to load lists')
      }
    } catch {
      setError('Failed to load lists')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newName.trim()) return

    setCreating(true)
    setError('')

    try {
      const res = await fetch(`${API_URL}/api/recipe-lists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setLists([...lists, data.data])
        setNewName('')
        setNewDescription('')
        setShowCreate(false)
      } else {
        setError(data.error || 'Failed to create list')
      }
    } catch {
      setError('Failed to create list')
    } finally {
      setCreating(false)
    }
  }

  if (isPending || loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <div className="skeleton" style={{ width: '100px', height: '1.5rem', marginBottom: '0.5rem' }} />
            <div className="skeleton" style={{ width: '60px', height: '0.875rem' }} />
          </div>
          <div className="skeleton" style={{ width: '90px', height: '36px', borderRadius: '6px' }} />
        </div>
        <div style={styles.listGrid}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton-card" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div className="skeleton" style={{ width: '50%', height: '1rem' }} />
                <div className="skeleton" style={{ width: '60px', height: '0.6875rem', borderRadius: '4px' }} />
              </div>
              <div className="skeleton" style={{ width: '80%', height: '0.8125rem', marginBottom: '0.5rem' }} />
              <div className="skeleton" style={{ width: '65%', height: '0.75rem' }} />
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

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>My Lists</h1>
          <p style={styles.subtitle}>
            {lists.length} list{lists.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          style={styles.createButton}
        >
          + New List
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {showCreate && (
        <div style={styles.createForm}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="List name"
            style={styles.input}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <input
            type="text"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description (optional)"
            style={styles.input}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <div style={styles.createActions}>
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              style={styles.submitButton}
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
            <button
              onClick={() => {
                setShowCreate(false)
                setNewName('')
                setNewDescription('')
              }}
              style={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {lists.length === 0 && !showCreate ? (
        <div style={styles.emptyState}>
          <p>No lists yet</p>
          <button onClick={() => setShowCreate(true)} style={styles.emptyButton}>
            Create your first list
          </button>
        </div>
      ) : (
        <div style={styles.listGrid}>
          {lists.map((list) => (
            <Link
              key={list.id}
              to={`/recipe-lists/${list.id}`}
              className="list-card"
            >
              <div style={styles.listHeader}>
                <h3 style={styles.listName}>{list.name}</h3>
                <span style={styles.countBadge}>
                  {list.recipeCount} recipe{list.recipeCount !== 1 ? 's' : ''}
                </span>
              </div>
              {list.description && (
                <p style={styles.listDescription}>{list.description}</p>
              )}
              {list.recipes.length > 0 && (
                <p style={styles.listPreview}>
                  {list.recipes
                    .slice(0, 3)
                    .map((r) => r.title)
                    .join(', ')}
                  {list.recipes.length > 3 && ` +${list.recipes.length - 3} more`}
                </p>
              )}
            </Link>
          ))}
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.5rem',
    maxWidth: '600px',
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
    border: 'none',
    fontWeight: 500,
    fontSize: '0.875rem',
    cursor: 'pointer',
  },
  error: {
    background: '#FDECEA',
    color: '#C44536',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    maxWidth: '600px',
    margin: '0 auto 1rem',
  },
  createForm: {
    background: 'white',
    borderRadius: '10px',
    padding: '1.25rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    maxWidth: '600px',
    margin: '0 auto 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  input: {
    padding: '0.625rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #E8DDD4',
    fontSize: '0.875rem',
    outline: 'none',
  },
  createActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  submitButton: {
    padding: '0.625rem 1.25rem',
    borderRadius: '6px',
    border: 'none',
    background: '#E07A5F',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '0.625rem 1.25rem',
    borderRadius: '6px',
    border: '1px solid #E8DDD4',
    background: 'white',
    fontSize: '0.875rem',
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: '#7A6B60',
    maxWidth: '600px',
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
  listGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    maxWidth: '600px',
    margin: '0 auto',
  },
  listHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.25rem',
  },
  listName: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 500,
  },
  countBadge: {
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.6875rem',
    fontWeight: 500,
    background: '#FAF6F2',
    color: '#7A6B60',
  },
  listDescription: {
    margin: '0.25rem 0 0',
    fontSize: '0.8125rem',
    color: '#7A6B60',
    lineHeight: 1.4,
  },
  listPreview: {
    margin: '0.5rem 0 0',
    fontSize: '0.75rem',
    color: '#A89888',
    fontStyle: 'italic',
  },
}
