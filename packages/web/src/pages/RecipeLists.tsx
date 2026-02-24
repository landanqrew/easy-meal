import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '../lib/auth'
import { colors, shadows, radius } from '../lib/theme'

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
          <div className="skeleton" style={{ width: '90px', height: '36px', borderRadius: radius.sm }} />
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
          className="btn-primary"
          style={{ fontSize: '0.875rem', padding: '0.75rem 1.25rem' }}
        >
          + New List
        </button>
      </div>

      {error && <div className="error-message" style={{ maxWidth: '900px', margin: '0 auto 1rem' }}>{error}</div>}

      {showCreate && (
        <div className="form-entrance" style={styles.createForm}>
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
              className="btn-primary"
              style={{ fontSize: '0.875rem', padding: '0.625rem 1.25rem' }}
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
            <button
              onClick={() => {
                setShowCreate(false)
                setNewName('')
                setNewDescription('')
              }}
              className="btn-secondary"
              style={{ fontSize: '0.875rem', padding: '0.625rem 1.25rem' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {lists.length === 0 && !showCreate ? (
        <div style={styles.emptyState}>
          <p style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>📋</p>
          <p>No lists yet</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary" style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', fontSize: '0.875rem' }}>
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
  },
  subtitle: {
    margin: '0.25rem 0 0',
    color: colors.textSecondary,
    fontSize: '0.875rem',
  },
  createForm: {
    background: 'white',
    borderRadius: radius.md,
    padding: '1.25rem',
    boxShadow: shadows.sm,
    border: `1px solid ${colors.borderLight}`,
    maxWidth: '900px',
    margin: '0 auto 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  input: {
    padding: '0.625rem 0.75rem',
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    fontSize: '0.875rem',
    outline: 'none',
  },
  createActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: colors.textSecondary,
    maxWidth: '900px',
    margin: '0 auto',
  },
  listGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    maxWidth: '900px',
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
    fontWeight: 600,
  },
  countBadge: {
    padding: '0.25rem 0.5rem',
    borderRadius: radius.full,
    fontSize: '0.6875rem',
    fontWeight: 500,
    background: colors.warmBg,
    color: colors.textSecondary,
  },
  listDescription: {
    margin: '0.25rem 0 0',
    fontSize: '0.8125rem',
    color: colors.textSecondary,
    lineHeight: 1.4,
  },
  listPreview: {
    margin: '0.5rem 0 0',
    fontSize: '0.75rem',
    color: colors.textMuted,
    fontStyle: 'italic',
  },
}
