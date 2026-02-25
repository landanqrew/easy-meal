import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '../lib/auth'
import { colors, radius } from '../lib/theme'
import { apiFetch, apiPost, apiPatch, apiDelete, queryKeys } from '../lib/api'

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

const CATEGORY_EMOJI: Record<string, string> = {
  produce: '🥬',
  meat: '🥩',
  seafood: '🐟',
  dairy: '🧀',
  bakery: '🍞',
  frozen: '❄️',
  pantry: '🫙',
  beverages: '🥤',
  other: '📦',
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
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', quantity: '1', unit: '' })
  const [adding, setAdding] = useState(false)

  const { data: groceryList, isLoading, error: queryError } = useQuery({
    queryKey: queryKeys.groceryList(id!),
    queryFn: () => apiFetch<GroceryList>(`/api/grocery-lists/${id}`),
    enabled: !!session && !!id,
  })

  useEffect(() => {
    if (!isPending && !session) {
      navigate('/login')
    }
  }, [session, isPending, navigate])

  const toggleItem = async (itemId: string, currentChecked: boolean) => {
    if (!groceryList) return

    // Optimistic update
    queryClient.setQueryData(queryKeys.groceryList(id!), {
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
      await apiPatch(`/api/grocery-lists/${id}/items/${itemId}`, { isChecked: !currentChecked })
    } catch {
      // Revert on error
      queryClient.invalidateQueries({ queryKey: queryKeys.groceryList(id!) })
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this grocery list?')) return
    setDeleting(true)

    try {
      await apiDelete(`/api/grocery-lists/${id}`)
      navigate('/grocery-lists')
    } catch (err: any) {
      setError(err.message || 'Failed to delete grocery list')
    } finally {
      setDeleting(false)
    }
  }

  const handleMarkComplete = async () => {
    if (!groceryList) return

    try {
      await apiPatch(`/api/grocery-lists/${id}`, { status: 'completed' })
      queryClient.setQueryData(queryKeys.groceryList(id!), (old: GroceryList | undefined) =>
        old ? { ...old, status: 'completed' as const } : old
      )
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
      await apiPost(`/api/grocery-lists/${id}/items`, {
        ingredientName: newItem.name,
        quantity: newItem.quantity,
        unit: newItem.unit,
      })
      setNewItem({ name: '', quantity: '1', unit: '' })
      setShowAddItem(false)
      queryClient.invalidateQueries({ queryKey: queryKeys.groceryList(id!) })
    } catch (err: any) {
      setError(err.message || 'Failed to add item')
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    try {
      await apiDelete(`/api/grocery-lists/${id}/items/${itemId}`)
      queryClient.invalidateQueries({ queryKey: queryKeys.groceryList(id!) })
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

  if (isPending || isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div className="skeleton" style={{ width: '60px', height: '0.875rem' }} />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div className="skeleton" style={{ width: '45px', height: '32px', borderRadius: radius.sm }} />
              <div className="skeleton" style={{ width: '55px', height: '32px', borderRadius: radius.sm }} />
            </div>
          </div>
          <div className="skeleton" style={{ width: '65%', height: '1.75rem', marginBottom: '1.25rem' }} />
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="skeleton" style={{ width: '100%', height: '8px', borderRadius: radius.full, marginBottom: '0.5rem' }} />
            <div className="skeleton" style={{ width: '90px', height: '0.8125rem' }} />
          </div>
          {Array.from({ length: 2 }).map((_, ci) => (
            <div key={ci} style={{ marginBottom: '1.5rem' }}>
              <div className="skeleton" style={{ width: '100px', height: '0.875rem', marginBottom: '0.75rem' }} />
              {Array.from({ length: 3 }).map((_, ii) => (
                <div key={ii} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.5rem' }}>
                  <div className="skeleton" style={{ width: '22px', height: '22px', borderRadius: '50%' }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ width: '55%', height: '0.9375rem' }} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!groceryList) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={{ color: colors.textSecondary, marginBottom: '1rem' }}>Grocery list not found.</p>
          <Link to="/grocery-lists" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-block' }}>
            Back to grocery lists
          </Link>
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
        {/* Header */}
        <div style={styles.header}>
          <Link to="/grocery-lists" className="back-link">
            ← Back
          </Link>
          <div style={styles.headerActions}>
            <button onClick={copyToClipboard} className="btn-secondary" style={styles.headerBtn}>
              Copy
            </button>
            <button
              onClick={handleDelete}
              className="btn-danger-outline"
              style={styles.headerBtn}
              disabled={deleting}
            >
              {deleting ? '...' : 'Delete'}
            </button>
          </div>
        </div>

        {(error || queryError) && <div className="error-message">{error || (queryError as Error)?.message}</div>}

        <h1 style={styles.title}>{groceryList.name}</h1>

        {/* Progress */}
        <div style={styles.progressSection}>
          <div style={styles.progressRow}>
            <span style={styles.progressLabel}>
              {checkedCount} of {totalCount} items
            </span>
            <span style={styles.progressPercent}>{Math.round(progress)}%</span>
          </div>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${progress}%` }} />
          </div>
        </div>

        {/* Mark Complete */}
        {groceryList.status === 'active' && checkedCount === totalCount && totalCount > 0 && (
          <button onClick={handleMarkComplete} className="btn-primary" style={styles.completeButton}>
            Mark as Complete
          </button>
        )}

        {/* Completed Badge */}
        {groceryList.status === 'completed' && (
          <div style={styles.completedBadge}>
            <span style={{ marginRight: '0.5rem' }}>✓</span>
            Shopping Complete
          </div>
        )}

        {/* Items by Category */}
        {CATEGORY_ORDER.map((category) => {
          const items = groceryList.itemsByCategory[category]
          if (!items || items.length === 0) return null

          return (
            <section key={category} style={styles.categorySection}>
              <h2 style={styles.categoryTitle}>
                <span style={styles.categoryEmoji}>{CATEGORY_EMOJI[category]}</span>
                {CATEGORY_LABELS[category]}
              </h2>
              <ul style={styles.itemList}>
                {items.map((item) => (
                  <li
                    key={item.id}
                    className={`grocery-item${item.isChecked ? ' checked' : ''}`}
                  >
                    <button
                      onClick={() => toggleItem(item.id, item.isChecked)}
                      className={`grocery-check${item.isChecked ? ' checked' : ''}`}
                    >
                      {item.isChecked ? '✓' : ''}
                    </button>
                    <span style={{
                      ...styles.itemText,
                      ...(item.isChecked ? styles.itemTextChecked : {}),
                    }}>
                      <span style={styles.itemQty}>
                        {item.quantity} {item.unit}
                      </span>
                      {item.ingredient.name}
                    </span>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="grocery-remove"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}

        {/* Add Item */}
        {showAddItem ? (
          <div style={styles.addItemForm}>
            <div style={styles.addInputRow}>
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
                style={{ ...styles.addInput, flex: '0 0 60px' }}
              />
              <input
                type="text"
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                placeholder="Unit"
                style={{ ...styles.addInput, flex: '0 0 80px' }}
              />
            </div>
            <div style={styles.addActions}>
              <button
                onClick={handleAddItem}
                disabled={adding}
                className="btn-primary"
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}
              >
                {adding ? 'Adding...' : 'Add Item'}
              </button>
              <button
                onClick={() => setShowAddItem(false)}
                className="btn-secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAddItem(true)} className="grocery-add-btn">
            + Add Item
          </button>
        )}
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
    padding: '1.75rem',
    borderRadius: radius.lg,
    boxShadow: `0 4px 16px rgba(184, 165, 150, 0.15), 0 1px 3px rgba(184, 165, 150, 0.1)`,
    maxWidth: '540px',
    margin: '0 auto',
    border: `1px solid ${colors.borderLight}`,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
  },
  headerActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  headerBtn: {
    padding: '0.375rem 0.75rem',
    fontSize: '0.8125rem',
    minHeight: '32px',
  },
  title: {
    margin: '0 0 1.25rem',
    fontSize: '1.75rem',
    fontWeight: 700,
    color: colors.text,
    letterSpacing: '-0.02em',
  },
  progressSection: {
    marginBottom: '1.25rem',
    padding: '1rem',
    background: colors.warmBg,
    borderRadius: radius.md,
  },
  progressRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  progressLabel: {
    fontSize: '0.8125rem',
    color: colors.textSecondary,
    fontWeight: 500,
  },
  progressPercent: {
    fontSize: '0.8125rem',
    color: colors.success,
    fontWeight: 700,
  },
  progressBar: {
    height: '6px',
    background: colors.borderLight,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: colors.success,
    borderRadius: radius.full,
    transition: 'width 0.3s ease',
  },
  completeButton: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '0.9375rem',
    marginBottom: '1.25rem',
  },
  completedBadge: {
    background: colors.successBg,
    color: colors.successText,
    padding: '0.75rem 1rem',
    borderRadius: radius.sm,
    fontSize: '0.875rem',
    fontWeight: 600,
    textAlign: 'center',
    marginBottom: '1.25rem',
  },
  categorySection: {
    marginBottom: '1.5rem',
  },
  categoryTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: 700,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: '0.25rem',
    paddingBottom: '0.5rem',
    borderBottom: `1px solid ${colors.borderLight}`,
  },
  categoryEmoji: {
    fontSize: '1rem',
  },
  itemList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  itemText: {
    flex: 1,
    fontSize: '0.9375rem',
    color: colors.text,
    lineHeight: 1.4,
  },
  itemTextChecked: {
    textDecoration: 'line-through',
    color: colors.textMuted,
  },
  itemQty: {
    color: colors.textSecondary,
    marginRight: '0.375rem',
    fontWeight: 500,
  },
  addItemForm: {
    marginTop: '1rem',
    padding: '1.25rem',
    background: colors.warmBg,
    borderRadius: radius.md,
    border: `1px solid ${colors.borderLight}`,
  },
  addInputRow: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '0.75rem',
    flexWrap: 'wrap',
  },
  addInput: {
    padding: '0.625rem 0.75rem',
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    fontSize: '0.875rem',
    flex: 1,
    minWidth: '80px',
    background: 'white',
  },
  addActions: {
    display: 'flex',
    gap: '0.5rem',
  },
}
