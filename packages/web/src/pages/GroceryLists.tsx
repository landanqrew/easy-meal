import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '../lib/auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

type GroceryList = {
  id: string
  name: string
  status: 'active' | 'completed' | 'archived'
  createdAt: string
  createdBy: { id: string; name: string } | null
}

export default function GroceryLists() {
  const navigate = useNavigate()
  const { data: session, isPending } = useSession()
  const [lists, setLists] = useState<GroceryList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active')

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
      const res = await fetch(`${API_URL}/api/grocery-lists`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok) {
        setLists(data.data)
      } else {
        setError(data.error || 'Failed to load grocery lists')
      }
    } catch {
      setError('Failed to load grocery lists')
    } finally {
      setLoading(false)
    }
  }

  const filteredLists = lists.filter((list) => {
    if (filter === 'all') return true
    return list.status === filter
  })

  const activeLists = lists.filter((l) => l.status === 'active')
  const completedLists = lists.filter((l) => l.status === 'completed')

  if (isPending || loading) {
    return <div style={styles.loading}>Loading...</div>
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Grocery Lists</h1>
          <p style={styles.subtitle}>
            {activeLists.length} active, {completedLists.length} completed
          </p>
        </div>
        <Link to="/grocery-lists/create" style={styles.createButton}>
          + New List
        </Link>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.filterSection}>
        <button
          onClick={() => setFilter('active')}
          style={{
            ...styles.filterChip,
            ...(filter === 'active' ? styles.filterChipActive : {}),
          }}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('completed')}
          style={{
            ...styles.filterChip,
            ...(filter === 'completed' ? styles.filterChipActive : {}),
          }}
        >
          Completed
        </button>
        <button
          onClick={() => setFilter('all')}
          style={{
            ...styles.filterChip,
            ...(filter === 'all' ? styles.filterChipActive : {}),
          }}
        >
          All
        </button>
      </div>

      {filteredLists.length === 0 ? (
        <div style={styles.emptyState}>
          <p>
            {filter === 'active'
              ? 'No active grocery lists'
              : filter === 'completed'
                ? 'No completed grocery lists'
                : 'No grocery lists yet'}
          </p>
          {filter !== 'completed' && (
            <Link to="/grocery-lists/create" style={styles.emptyButton}>
              Create your first grocery list
            </Link>
          )}
        </div>
      ) : (
        <div style={styles.listGrid}>
          {filteredLists.map((list) => (
            <Link key={list.id} to={`/grocery-lists/${list.id}`} style={styles.listCard}>
              <div style={styles.listHeader}>
                <h3 style={styles.listName}>{list.name}</h3>
                <span
                  style={{
                    ...styles.statusBadge,
                    ...(list.status === 'completed' ? styles.statusCompleted : {}),
                  }}
                >
                  {list.status}
                </span>
              </div>
              <div style={styles.listMeta}>
                <span>{new Date(list.createdAt).toLocaleDateString()}</span>
                {list.createdBy && <span>by {list.createdBy.name}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}

      <nav style={styles.bottomNav}>
        <Link to="/" style={styles.navLink}>
          Home
        </Link>
        <Link to="/recipes" style={styles.navLink}>
          Recipes
        </Link>
        <Link to="/household" style={styles.navLink}>
          Household
        </Link>
        <Link to="/profile" style={styles.navLink}>
          Profile
        </Link>
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
    background: '#f5f5f5',
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
    color: '#666',
    fontSize: '0.875rem',
  },
  createButton: {
    padding: '0.75rem 1.25rem',
    borderRadius: '6px',
    background: '#2563eb',
    color: 'white',
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: '0.875rem',
  },
  error: {
    background: '#fee',
    color: '#c00',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    maxWidth: '600px',
    margin: '0 auto 1rem',
  },
  filterSection: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    maxWidth: '600px',
    margin: '0 auto 1.5rem',
  },
  filterChip: {
    padding: '0.375rem 0.75rem',
    borderRadius: '20px',
    border: '1px solid #ddd',
    background: 'white',
    cursor: 'pointer',
    fontSize: '0.8125rem',
  },
  filterChipActive: {
    background: '#2563eb',
    color: 'white',
    borderColor: '#2563eb',
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: '#666',
    maxWidth: '600px',
    margin: '0 auto',
  },
  emptyButton: {
    display: 'inline-block',
    marginTop: '1rem',
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    background: '#2563eb',
    color: 'white',
    textDecoration: 'none',
  },
  listGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    maxWidth: '600px',
    margin: '0 auto',
  },
  listCard: {
    background: 'white',
    borderRadius: '10px',
    padding: '1rem 1.25rem',
    textDecoration: 'none',
    color: 'inherit',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  listHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  listName: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 500,
  },
  statusBadge: {
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.6875rem',
    fontWeight: 500,
    textTransform: 'uppercase',
    background: '#e0f2fe',
    color: '#0369a1',
  },
  statusCompleted: {
    background: '#dcfce7',
    color: '#166534',
  },
  listMeta: {
    display: 'flex',
    gap: '0.75rem',
    fontSize: '0.8125rem',
    color: '#666',
  },
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'white',
    display: 'flex',
    justifyContent: 'space-around',
    padding: '0.75rem 0',
    borderTop: '1px solid #eee',
  },
  navLink: {
    color: '#666',
    textDecoration: 'none',
    fontSize: '0.875rem',
  },
}
