import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useSession } from '../lib/auth'
import { apiFetch, queryKeys } from '../lib/api'
import { colors, radius, shadows } from '../lib/theme'
import type { GroceryListSummary } from '@easy-meal/shared'

export default function GroceryLists() {
  const navigate = useNavigate()
  const { data: session, isPending } = useSession()
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active')

  useEffect(() => {
    if (!isPending && !session) {
      navigate('/login')
    }
  }, [session, isPending, navigate])

  const { data: lists = [], isLoading, error } = useQuery({
    queryKey: queryKeys.groceryLists,
    queryFn: () => apiFetch<GroceryListSummary[]>('/api/grocery-lists'),
    enabled: !!session,
  })

  const filteredLists = lists.filter((list) => {
    if (filter === 'all') return true
    return list.status === filter
  })

  const activeLists = lists.filter((l) => l.status === 'active')
  const completedLists = lists.filter((l) => l.status === 'completed')

  if (isPending || isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.headerCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <div className="skeleton" style={{ width: '160px', height: '1.75rem', marginBottom: '0.375rem' }} />
              <div className="skeleton" style={{ width: '120px', height: '0.8125rem' }} />
            </div>
            <div className="skeleton" style={{ width: '110px', height: '40px', borderRadius: radius.sm }} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ width: '70px', height: '32px', borderRadius: radius.full }} />
            ))}
          </div>
        </div>
        <div style={styles.listGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div className="skeleton" style={{ width: '55%', height: '1rem' }} />
                <div className="skeleton" style={{ width: '60px', height: '1.25rem', borderRadius: radius.full }} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div className="skeleton" style={{ width: '80px', height: '0.8125rem' }} />
                <div className="skeleton" style={{ width: '70px', height: '0.8125rem' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Header card */}
      <div style={styles.headerCard}>
        <div style={styles.headerTop}>
          <div>
            <h1 style={styles.title}>Grocery Lists</h1>
            <p style={styles.subtitle}>
              {activeLists.length} active, {completedLists.length} completed
            </p>
          </div>
          <Link to="/grocery-lists/create" className="btn-primary" style={styles.createButton}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New List
          </Link>
        </div>
        <div style={styles.filterSection}>
          {([
            { key: 'active' as const, label: 'Active', count: activeLists.length },
            { key: 'completed' as const, label: 'Completed', count: completedLists.length },
            { key: 'all' as const, label: 'All', count: lists.length },
          ]).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`filter-chip${filter === f.key ? ' active' : ''}`}
            >
              {f.label}
              <span style={{
                marginLeft: '0.375rem',
                fontSize: '0.6875rem',
                opacity: 0.7,
              }}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error-message" style={{ maxWidth: '900px', margin: '0 auto 1rem' }}>{error.message}</div>}

      {filteredLists.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          </div>
          <p style={styles.emptyText}>
            {filter === 'active'
              ? 'No active grocery lists'
              : filter === 'completed'
                ? 'No completed grocery lists'
                : 'No grocery lists yet'}
          </p>
          {filter !== 'completed' && (
            <Link to="/grocery-lists/create" className="btn-primary" style={{ textDecoration: 'none', marginTop: '1rem', display: 'inline-block' }}>
              Create your first list
            </Link>
          )}
        </div>
      ) : (
        <div style={styles.listGrid}>
          {filteredLists.map((list) => (
            <Link key={list.id} to={`/grocery-lists/${list.id}`} className="list-card" style={styles.listCard}>
              <div style={styles.listCardLeft}>
                <div style={{
                  ...styles.listIcon,
                  ...(list.status === 'completed' ? styles.listIconCompleted : {}),
                }}>
                  {list.status === 'completed' ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 01-8 0" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 style={styles.listName}>{list.name}</h3>
                  <div style={styles.listMeta}>
                    <span>{new Date(list.createdAt).toLocaleDateString()}</span>
                    {list.createdBy && <span>by {list.createdBy.name}</span>}
                  </div>
                </div>
              </div>
              <span
                style={{
                  ...styles.statusBadge,
                  ...(list.status === 'completed' ? styles.statusCompleted : {}),
                }}
              >
                {list.status === 'completed' ? 'Done' : 'Active'}
              </span>
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
    padding: '1.5rem 1rem 2rem',
    paddingTop: '4.5rem',
  },
  headerCard: {
    background: colors.surface,
    borderRadius: radius.lg,
    padding: '1.25rem 1.5rem',
    marginBottom: '1.5rem',
    boxShadow: shadows.sm,
    border: `1px solid ${colors.borderLight}`,
    maxWidth: '900px',
    margin: '0 auto 1.5rem',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 700,
    color: colors.text,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    margin: '0.25rem 0 0',
    color: colors.textMuted,
    fontSize: '0.8125rem',
  },
  createButton: {
    padding: '0.625rem 1.25rem',
    textDecoration: 'none',
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  },
  filterSection: {
    display: 'flex',
    gap: '0.5rem',
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    maxWidth: '900px',
    margin: '0 auto',
  },
  emptyIcon: {
    marginBottom: '1rem',
    opacity: 0.4,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: '1.0625rem',
    margin: 0,
  },
  listGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.625rem',
    maxWidth: '900px',
    margin: '0 auto',
  },
  listCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  listCardLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flex: 1,
    minWidth: 0,
  },
  listIcon: {
    width: '40px',
    height: '40px',
    borderRadius: radius.md,
    background: colors.warmBg,
    color: colors.warning,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  listIconCompleted: {
    background: colors.successBg,
    color: colors.success,
  },
  listName: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 600,
    color: colors.text,
    lineHeight: 1.3,
  },
  statusBadge: {
    padding: '0.25rem 0.625rem',
    borderRadius: radius.full,
    fontSize: '0.6875rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    background: colors.accentWarm,
    color: colors.warning,
    flexShrink: 0,
  },
  statusCompleted: {
    background: colors.successBg,
    color: colors.successText,
  },
  listMeta: {
    display: 'flex',
    gap: '0.75rem',
    fontSize: '0.8125rem',
    color: colors.textSecondary,
    marginTop: '0.125rem',
  },
}
