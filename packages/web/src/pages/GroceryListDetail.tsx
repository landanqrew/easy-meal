import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '../lib/auth'
import { colors, radius, shadows } from '../lib/theme'
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

const CATEGORY_COLORS: Record<string, { bg: string; dot: string }> = {
  produce: { bg: 'rgba(129, 163, 132, 0.1)', dot: '#81A384' },
  meat: { bg: 'rgba(217, 122, 118, 0.1)', dot: '#D97A76' },
  seafood: { bg: 'rgba(100, 160, 180, 0.1)', dot: '#64A0B4' },
  dairy: { bg: 'rgba(212, 163, 115, 0.1)', dot: '#D4A373' },
  bakery: { bg: 'rgba(208, 135, 112, 0.1)', dot: '#D08770' },
  frozen: { bg: 'rgba(140, 170, 200, 0.1)', dot: '#8CAAC8' },
  pantry: { bg: 'rgba(184, 165, 150, 0.1)', dot: '#B8A596' },
  beverages: { bg: 'rgba(129, 163, 132, 0.1)', dot: '#81A384' },
  other: { bg: 'rgba(184, 165, 150, 0.1)', dot: '#B8A596' },
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
  const [copied, setCopied] = useState(false)

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

    const unchecked = totalCount - checkedCount
    if (!allChecked && unchecked > 0) {
      if (!confirm(`${unchecked} item${unchecked !== 1 ? 's' : ''} still unchecked. Mark as complete anyway?`)) return
    }

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
    if (!groceryList) return

    // Optimistic update: remove item from UI immediately
    const previousData = groceryList
    queryClient.setQueryData(queryKeys.groceryList(id!), {
      ...groceryList,
      items: groceryList.items.filter((item) => item.id !== itemId),
      itemsByCategory: Object.fromEntries(
        Object.entries(groceryList.itemsByCategory).map(([category, items]) => [
          category,
          items.filter((item) => item.id !== itemId),
        ])
      ),
    })

    try {
      await apiDelete(`/api/grocery-lists/${id}/items/${itemId}`)
      queryClient.invalidateQueries({ queryKey: queryKeys.groceryList(id!) })
    } catch (err: any) {
      // Revert optimistic update on failure
      queryClient.setQueryData(queryKeys.groceryList(id!), previousData)
      setError(err.message || 'Failed to remove item')
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
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
  const isComplete = groceryList.status === 'completed'
  const allChecked = checkedCount === totalCount && totalCount > 0

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <Link to="/grocery-lists" className="back-link" style={styles.backLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </Link>
          <div style={styles.headerActions}>
            <button onClick={copyToClipboard} className="btn-secondary" style={styles.headerBtn}>
              {copied ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              )}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={handleDelete}
              className="btn-danger-outline"
              style={styles.headerBtn}
              disabled={deleting}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
              {deleting ? '...' : 'Delete'}
            </button>
          </div>
        </div>

        {(error || queryError) && <div className="error-message">{error || (queryError as Error)?.message}</div>}

        <h1 style={styles.title}>{groceryList.name}</h1>

        {/* Progress */}
        <div style={styles.progressSection}>
          <div style={styles.progressTop}>
            <div style={styles.progressStats}>
              <span style={styles.progressChecked}>{checkedCount}</span>
              <span style={styles.progressTotal}> / {totalCount} items</span>
            </div>
            <span style={{
              ...styles.progressPercent,
              color: progress === 100 ? colors.success : colors.primary,
            }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div style={styles.progressBar}>
            <div style={{
              ...styles.progressFill,
              width: `${progress}%`,
              background: progress === 100
                ? colors.success
                : `linear-gradient(90deg, ${colors.primary}, ${colors.primaryHover})`,
            }} />
          </div>
        </div>

        {/* Mark Complete */}
        {!isComplete && checkedCount > 0 && (
          <button onClick={handleMarkComplete} className="btn-primary" style={styles.completeButton}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Mark as Complete{!allChecked ? ` (${checkedCount}/${totalCount})` : ''}
          </button>
        )}

        {/* Completed Badge */}
        {isComplete && (
          <div style={styles.completedBadge}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Shopping Complete
          </div>
        )}

        {/* Items by Category */}
        {CATEGORY_ORDER.map((category) => {
          const items = groceryList.itemsByCategory[category]
          if (!items || items.length === 0) return null
          const categoryColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.other
          const checkedInCategory = items.filter((i) => i.isChecked).length

          return (
            <section key={category} style={styles.categorySection}>
              <div style={styles.categoryHeader}>
                <div style={styles.categoryTitleRow}>
                  <span style={{
                    ...styles.categoryDot,
                    background: categoryColor.dot,
                  }} />
                  <h2 style={styles.categoryTitle}>
                    {CATEGORY_LABELS[category]}
                  </h2>
                </div>
                <span style={styles.categoryCount}>
                  {checkedInCategory}/{items.length}
                </span>
              </div>
              <ul style={styles.itemList}>
                {items.map((item) => (
                  <li
                    key={item.id}
                    className={`grocery-item${item.isChecked ? ' checked' : ''}`}
                  >
                    <button
                      onClick={() => toggleItem(item.id, item.isChecked)}
                      className={`grocery-check${item.isChecked ? ' checked' : ''}`}
                      aria-label={item.isChecked ? 'Uncheck item' : 'Check item'}
                    >
                      {item.isChecked && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
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
                      aria-label={`Remove ${item.ingredient.name}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
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
            <div style={styles.addFormHeader}>
              <span style={styles.addFormTitle}>Add Item</span>
              <button
                onClick={() => setShowAddItem(false)}
                style={styles.addFormClose}
                aria-label="Close add item form"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div style={styles.addInputRow}>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Ingredient name"
                style={styles.addInput}
                autoFocus
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
            <button
              onClick={handleAddItem}
              disabled={adding}
              className="btn-primary"
              style={styles.addSubmitBtn}
            >
              {adding ? 'Adding...' : 'Add'}
            </button>
          </div>
        ) : (
          <button onClick={() => setShowAddItem(true)} className="grocery-add-btn" style={styles.addBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Item
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
    padding: '1.5rem 1rem 2rem',
    paddingTop: '4.5rem',
  },
  card: {
    background: colors.surface,
    padding: '1.75rem',
    borderRadius: radius.lg,
    boxShadow: shadows.md,
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
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  headerActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  headerBtn: {
    padding: '0.375rem 0.75rem',
    fontSize: '0.8125rem',
    minHeight: '32px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  },
  title: {
    margin: '0 0 1.25rem',
    fontSize: '1.5rem',
    fontWeight: 700,
    color: colors.text,
    letterSpacing: '-0.02em',
  },

  // Progress
  progressSection: {
    marginBottom: '1.25rem',
    padding: '1rem 1.125rem',
    background: colors.warmBg,
    borderRadius: radius.md,
  },
  progressTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '0.5rem',
  },
  progressStats: {
    fontSize: '0.8125rem',
    color: colors.textSecondary,
  },
  progressChecked: {
    fontWeight: 700,
    fontSize: '1.125rem',
    color: colors.text,
  },
  progressTotal: {
    fontWeight: 400,
  },
  progressPercent: {
    fontSize: '0.875rem',
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
    borderRadius: radius.full,
    transition: 'width 300ms ease',
  },

  completeButton: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '0.9375rem',
    marginBottom: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  completedBadge: {
    background: colors.successBg,
    color: colors.successText,
    padding: '0.75rem 1rem',
    borderRadius: radius.md,
    fontSize: '0.875rem',
    fontWeight: 600,
    textAlign: 'center',
    marginBottom: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },

  // Categories
  categorySection: {
    marginBottom: '1.25rem',
  },
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '0.5rem',
    borderBottom: `1px solid ${colors.borderLight}`,
    marginBottom: '0.25rem',
  },
  categoryTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  categoryDot: {
    width: '8px',
    height: '8px',
    borderRadius: radius.full,
    flexShrink: 0,
  },
  categoryTitle: {
    fontSize: '0.8125rem',
    fontWeight: 700,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    margin: 0,
  },
  categoryCount: {
    fontSize: '0.6875rem',
    color: colors.textMuted,
    fontWeight: 500,
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

  // Add item
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.375rem',
  },
  addItemForm: {
    marginTop: '1rem',
    padding: '1rem 1.25rem',
    background: colors.warmBg,
    borderRadius: radius.md,
    border: `1px solid ${colors.borderLight}`,
  },
  addFormHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  addFormTitle: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: colors.text,
  },
  addFormClose: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: colors.textMuted,
    padding: '0.25rem',
    lineHeight: 1,
    minHeight: 'unset',
    borderRadius: radius.sm,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 150ms ease',
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
    background: colors.surface,
  },
  addSubmitBtn: {
    padding: '0.5rem 1.25rem',
    fontSize: '0.875rem',
  },
}
