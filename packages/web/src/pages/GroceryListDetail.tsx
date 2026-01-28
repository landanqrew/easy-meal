import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useSession } from '../lib/auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

type Ingredient = {
  id: string
  name: string
  category: string
}

type GroceryItem = {
  id: string
  quantity: string
  unit: string
  isChecked: boolean
  ingredient: Ingredient
  recipe: { id: string; title: string } | null
}

type GroceryList = {
  id: string
  name: string
  status: 'active' | 'completed' | 'archived'
  createdAt: string
  items: GroceryItem[]
  itemsByCategory: Record<string, GroceryItem[]>
}

const CATEGORY_LABELS: Record<string, string> = {
  produce: 'Produce',
  meat: 'Meat',
  seafood: 'Seafood',
  dairy: 'Dairy',
  bakery: 'Bakery',
  frozen: 'Frozen',
  pantry: 'Pantry',
  beverages: 'Beverages',
  other: 'Other',
}

const CATEGORY_ORDER = [
  'produce',
  'meat',
  'seafood',
  'dairy',
  'bakery',
  'frozen',
  'pantry',
  'beverages',
  'other',
]

export default function GroceryListDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: session, isPending } = useSession()
  const [groceryList, setGroceryList] = useState<GroceryList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', quantity: '1', unit: '' })
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!isPending && !session) {
      navigate('/login')
    }
  }, [session, isPending, navigate])

  useEffect(() => {
    if (session && id) {
      fetchGroceryList()
    }
  }, [session, id])

  const fetchGroceryList = async () => {
    try {
      const res = await fetch(`${API_URL}/api/grocery-lists/${id}`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok) {
        setGroceryList(data.data)
      } else {
        setError(data.error || 'Failed to load grocery list')
      }
    } catch {
      setError('Failed to load grocery list')
    } finally {
      setLoading(false)
    }
  }

  const toggleItem = async (itemId: string, currentChecked: boolean) => {
    if (!groceryList) return

    // Optimistic update
    setGroceryList({
      ...groceryList,
      items: groceryList.items.map((item) =>
        item.id === itemId ? { ...item, isChecked: !currentChecked } : item
      ),
      itemsByCategory: Object.fromEntries(
        Object.entries(groceryList.itemsByCategory).map(([category, items]) => [
          category,
          items.map((item) =>
            item.id === itemId ? { ...item, isChecked: !currentChecked } : item
          ),
        ])
      ),
    })

    try {
      await fetch(`${API_URL}/api/grocery-lists/${id}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isChecked: !currentChecked }),
      })
    } catch {
      // Revert on error
      fetchGroceryList()
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this grocery list?')) return
    setDeleting(true)

    try {
      const res = await fetch(`${API_URL}/api/grocery-lists/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (res.ok) {
        navigate('/grocery-lists')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to delete grocery list')
      }
    } catch {
      setError('Failed to delete grocery list')
    } finally {
      setDeleting(false)
    }
  }

  const handleMarkComplete = async () => {
    if (!groceryList) return

    try {
      const res = await fetch(`${API_URL}/api/grocery-lists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'completed' }),
      })

      if (res.ok) {
        setGroceryList({ ...groceryList, status: 'completed' })
      }
    } catch {
      setError('Failed to update status')
    }
  }

  const handleAddItem = async () => {
    if (!newItem.name.trim() || !newItem.unit.trim()) {
      setError('Please enter ingredient name and unit')
      return
    }

    setAdding(true)
    setError('')

    try {
      const res = await fetch(`${API_URL}/api/grocery-lists/${id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ingredientName: newItem.name,
          quantity: newItem.quantity,
          unit: newItem.unit,
        }),
      })

      if (res.ok) {
        setNewItem({ name: '', quantity: '1', unit: '' })
        setShowAddItem(false)
        fetchGroceryList()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to add item')
      }
    } catch {
      setError('Failed to add item')
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    try {
      await fetch(`${API_URL}/api/grocery-lists/${id}/items/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      fetchGroceryList()
    } catch {
      setError('Failed to remove item')
    }
  }

  const copyToClipboard = async () => {
    if (!groceryList) return

    const text = CATEGORY_ORDER.filter(
      (cat) => groceryList.itemsByCategory[cat]?.length > 0
    )
      .map((cat) => {
        const items = groceryList.itemsByCategory[cat]
        const header = `\n${CATEGORY_LABELS[cat].toUpperCase()}`
        const itemLines = items
          .map(
            (item) =>
              `${item.isChecked ? '✓' : '○'} ${item.quantity} ${item.unit} ${item.ingredient.name}`
          )
          .join('\n')
        return `${header}\n${itemLines}`
      })
      .join('\n')

    await navigator.clipboard.writeText(`${groceryList.name}\n${text}`)
    alert('Copied to clipboard!')
  }

  if (isPending || loading) {
    return <div style={styles.loading}>Loading...</div>
  }

  if (!groceryList) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p>Grocery list not found</p>
          <Link to="/grocery-lists">Back to grocery lists</Link>
        </div>
      </div>
    )
  }

  const checkedCount = groceryList.items.filter((i) => i.isChecked).length
  const totalCount = groceryList.items.length
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <Link to="/grocery-lists" style={styles.backLink}>
            ← Back
          </Link>
          <div style={styles.headerActions}>
            <button onClick={copyToClipboard} style={styles.copyButton}>
              Copy
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

        <h1 style={styles.title}>{groceryList.name}</h1>

        <div style={styles.progressSection}>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${progress}%` }} />
          </div>
          <span style={styles.progressText}>
            {checkedCount} of {totalCount} items
          </span>
        </div>

        {groceryList.status === 'active' && checkedCount === totalCount && totalCount > 0 && (
          <button onClick={handleMarkComplete} style={styles.completeButton}>
            Mark as Complete
          </button>
        )}

        {groceryList.status === 'completed' && (
          <div style={styles.completedBadge}>Completed</div>
        )}

        {CATEGORY_ORDER.map((category) => {
          const items = groceryList.itemsByCategory[category]
          if (!items || items.length === 0) return null

          return (
            <section key={category} style={styles.categorySection}>
              <h2 style={styles.categoryTitle}>{CATEGORY_LABELS[category]}</h2>
              <ul style={styles.itemList}>
                {items.map((item) => (
                  <li
                    key={item.id}
                    style={{
                      ...styles.item,
                      ...(item.isChecked ? styles.itemChecked : {}),
                    }}
                  >
                    <button
                      onClick={() => toggleItem(item.id, item.isChecked)}
                      style={{
                        ...styles.checkButton,
                        ...(item.isChecked ? styles.checkButtonChecked : {}),
                      }}
                    >
                      {item.isChecked ? '✓' : ''}
                    </button>
                    <span
                      style={{
                        ...styles.itemText,
                        ...(item.isChecked ? styles.itemTextChecked : {}),
                      }}
                    >
                      <span style={styles.itemQty}>
                        {item.quantity} {item.unit}
                      </span>
                      {item.ingredient.name}
                    </span>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      style={styles.removeButton}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}

        {showAddItem ? (
          <div style={styles.addItemForm}>
            <input
              type="text"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              placeholder="Ingredient name"
              style={styles.addInput}
            />
            <input
              type="text"
              value={newItem.quantity}
              onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
              placeholder="Qty"
              style={{ ...styles.addInput, width: '60px' }}
            />
            <input
              type="text"
              value={newItem.unit}
              onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
              placeholder="Unit"
              style={{ ...styles.addInput, width: '80px' }}
            />
            <button
              onClick={handleAddItem}
              disabled={adding}
              style={styles.addButton}
            >
              {adding ? '...' : 'Add'}
            </button>
            <button
              onClick={() => setShowAddItem(false)}
              style={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setShowAddItem(true)} style={styles.showAddButton}>
            + Add Item
          </button>
        )}
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
    background: '#f5f5f5',
    padding: '2rem 1rem',
  },
  card: {
    background: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    maxWidth: '500px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  backLink: {
    color: '#666',
    textDecoration: 'none',
    fontSize: '0.875rem',
  },
  headerActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  copyButton: {
    padding: '0.375rem 0.75rem',
    borderRadius: '4px',
    border: '1px solid #ddd',
    background: 'white',
    cursor: 'pointer',
    fontSize: '0.8125rem',
  },
  deleteButton: {
    padding: '0.375rem 0.75rem',
    borderRadius: '4px',
    border: '1px solid #f00',
    background: 'white',
    color: '#c00',
    cursor: 'pointer',
    fontSize: '0.8125rem',
  },
  error: {
    background: '#fee',
    color: '#c00',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontSize: '0.875rem',
  },
  title: {
    margin: '0 0 1rem',
    fontSize: '1.25rem',
    fontWeight: 600,
  },
  progressSection: {
    marginBottom: '1rem',
  },
  progressBar: {
    height: '8px',
    background: '#eee',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '0.375rem',
  },
  progressFill: {
    height: '100%',
    background: '#22c55e',
    borderRadius: '4px',
    transition: 'width 0.2s',
  },
  progressText: {
    fontSize: '0.8125rem',
    color: '#666',
  },
  completeButton: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '6px',
    border: 'none',
    background: '#22c55e',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    marginBottom: '1rem',
  },
  completedBadge: {
    background: '#dcfce7',
    color: '#166534',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: 500,
    textAlign: 'center',
    marginBottom: '1rem',
  },
  categorySection: {
    marginBottom: '1.25rem',
  },
  categoryTitle: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.5rem',
    paddingBottom: '0.375rem',
    borderBottom: '1px solid #eee',
  },
  itemList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.625rem 0',
    borderBottom: '1px solid #f5f5f5',
  },
  itemChecked: {
    opacity: 0.6,
  },
  checkButton: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '2px solid #ddd',
    background: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'white',
    flexShrink: 0,
  },
  checkButtonChecked: {
    background: '#22c55e',
    borderColor: '#22c55e',
  },
  itemText: {
    flex: 1,
    fontSize: '0.9375rem',
  },
  itemTextChecked: {
    textDecoration: 'line-through',
    color: '#999',
  },
  itemQty: {
    color: '#666',
    marginRight: '0.375rem',
  },
  removeButton: {
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '1.125rem',
    color: '#999',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addItemForm: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: '1rem',
    padding: '1rem',
    background: '#f9f9f9',
    borderRadius: '8px',
  },
  addInput: {
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '0.875rem',
    flex: 1,
    minWidth: '100px',
  },
  addButton: {
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    border: 'none',
    background: '#2563eb',
    color: 'white',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  cancelButton: {
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    border: '1px solid #ddd',
    background: 'white',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  showAddButton: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px dashed #ddd',
    background: 'transparent',
    color: '#666',
    cursor: 'pointer',
    fontSize: '0.875rem',
    marginTop: '1rem',
  },
}
