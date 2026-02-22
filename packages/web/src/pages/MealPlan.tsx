import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '../lib/auth'
import type { MealType } from '@easy-meal/shared'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

type MealPlanEntry = {
  id: string
  recipeId: string
  date: string
  mealType: MealType
  recipe: {
    id: string
    title: string
    prepTime: number | null
    cookTime: number | null
  }
}

type Recipe = {
  id: string
  title: string
  prepTime: number | null
  cookTime: number | null
}

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner']
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDateParam(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getDaysOfWeek(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return d
  })
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  const mStart = MONTH_NAMES[monday.getMonth()]
  const mEnd = MONTH_NAMES[sunday.getMonth()]
  if (mStart === mEnd) {
    return `${mStart} ${monday.getDate()} – ${sunday.getDate()}`
  }
  return `${mStart} ${monday.getDate()} – ${mEnd} ${sunday.getDate()}`
}

export default function MealPlan() {
  const navigate = useNavigate()
  const { data: session, isPending } = useSession()
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()))
  const [entries, setEntries] = useState<MealPlanEntry[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pickerOpen, setPickerOpen] = useState<{ date: string; mealType: MealType } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    if (!isPending && !session) {
      navigate('/login')
    }
  }, [session, isPending, navigate])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/meal-plans?weekStart=${formatDateParam(weekStart)}`,
        { credentials: 'include' }
      )
      const data = await res.json()
      if (res.ok) {
        setEntries(data.data)
      } else {
        setError(data.error || 'Failed to load meal plan')
      }
    } catch {
      setError('Failed to load meal plan')
    } finally {
      setLoading(false)
    }
  }, [weekStart])

  const fetchRecipes = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/recipes`, { credentials: 'include' })
      const data = await res.json()
      if (res.ok) {
        setRecipes(data.data)
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (session) {
      setLoading(true)
      fetchEntries()
    }
  }, [session, fetchEntries])

  useEffect(() => {
    if (session) {
      fetchRecipes()
    }
  }, [session, fetchRecipes])

  const getEntryForSlot = (date: Date, mealType: MealType): MealPlanEntry | undefined => {
    const dateStr = formatDateParam(date)
    return entries.find((e) => {
      const entryDate = e.date.slice(0, 10)
      return entryDate === dateStr && e.mealType === mealType
    })
  }

  const handleAssignRecipe = async (recipeId: string) => {
    if (!pickerOpen) return
    setError('')

    try {
      const res = await fetch(`${API_URL}/api/meal-plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          recipeId,
          date: pickerOpen.date,
          mealType: pickerOpen.mealType,
        }),
      })

      if (res.ok) {
        setPickerOpen(null)
        setSearchQuery('')
        fetchEntries()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to assign recipe')
      }
    } catch {
      setError('Failed to assign recipe')
    }
  }

  const handleRemoveEntry = async (entryId: string) => {
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/meal-plans/${entryId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== entryId))
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to remove entry')
      }
    } catch {
      setError('Failed to remove entry')
    }
  }

  const navigateWeek = (direction: number) => {
    setWeekStart((prev) => {
      const next = new Date(prev)
      next.setDate(next.getDate() + direction * 7)
      return next
    })
  }

  const goToToday = () => {
    setWeekStart(getMonday(new Date()))
  }

  const today = new Date()
  const days = getDaysOfWeek(weekStart)
  const filteredRecipes = recipes.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isPending || loading) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.header}>
            <div className="skeleton" style={{ width: '120px', height: '1.5rem' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '6px' }} />
              <div className="skeleton" style={{ width: '140px', height: '0.9375rem' }} />
              <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '6px' }} />
              <div className="skeleton" style={{ width: '55px', height: '32px', borderRadius: '6px' }} />
            </div>
          </div>
          {isMobile ? (
            <div style={styles.mobileList}>
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} style={styles.mobileDay}>
                  <div style={{ ...styles.mobileDayHeader, display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem' }}>
                    <div className="skeleton" style={{ width: '30px', height: '0.75rem', background: 'rgba(255,255,255,0.3)' }} />
                    <div className="skeleton" style={{ width: '24px', height: '1.125rem', background: 'rgba(255,255,255,0.3)' }} />
                  </div>
                  <div style={styles.mobileMeals}>
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} style={styles.mealSlot}>
                        <div className="skeleton" style={{ width: '50px', height: '0.625rem', marginBottom: '0.375rem' }} />
                        <div className="skeleton" style={{ width: '60px', height: '0.75rem' }} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.calendarGrid}>
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} style={styles.dayColumn}>
                  <div style={{ ...styles.dayHeader, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.125rem' }}>
                    <div className="skeleton" style={{ width: '24px', height: '0.75rem', background: 'rgba(255,255,255,0.3)' }} />
                    <div className="skeleton" style={{ width: '20px', height: '1.125rem', background: 'rgba(255,255,255,0.3)' }} />
                  </div>
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} style={styles.mealSlot}>
                      <div className="skeleton" style={{ width: '50px', height: '0.625rem', marginBottom: '0.375rem' }} />
                      <div className="skeleton" style={{ width: '70%', height: '0.75rem' }} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
        <nav className="bottom-nav-bar">
          <Link to="/">Home</Link>
          <Link to="/recipes">Recipes</Link>
          <Link to="/meal-plan" className="active">Meal Plan</Link>
          <Link to="/grocery-lists">Groceries</Link>
          <Link to="/profile">Profile</Link>
        </nav>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>Meal Plan</h1>
          <div style={styles.weekNav}>
            <button onClick={() => navigateWeek(-1)} style={styles.navButton}>
              ‹
            </button>
            <span style={styles.weekLabel}>{formatWeekRange(weekStart)}</span>
            <button onClick={() => navigateWeek(1)} style={styles.navButton}>
              ›
            </button>
            <button onClick={goToToday} style={styles.todayButton}>
              Today
            </button>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {isMobile ? (
          // Mobile: vertical day list
          <div style={styles.mobileList}>
            {days.map((day, i) => {
              const isToday = isSameDay(day, today)
              return (
                <div key={i} style={styles.mobileDay}>
                  <div style={{
                    ...styles.mobileDayHeader,
                    ...(isToday ? styles.mobileDayHeaderToday : {}),
                  }}>
                    <span style={styles.dayName}>{DAY_NAMES[i]}</span>
                    <span style={styles.dayNumber}>{day.getDate()}</span>
                  </div>
                  <div style={styles.mobileMeals}>
                    {MEAL_TYPES.map((mealType) => {
                      const entry = getEntryForSlot(day, mealType)
                      return (
                        <div key={mealType} style={styles.mealSlot}>
                          <div style={styles.mealSlotLabel}>
                            {mealType}
                          </div>
                          {entry ? (
                            <div style={styles.assignedRecipeRow}>
                              <Link
                                to={`/recipes/${entry.recipe.id}`}
                                style={styles.assignedRecipe}
                              >
                                {entry.recipe.title}
                              </Link>
                              <button
                                onClick={() => handleRemoveEntry(entry.id)}
                                style={styles.removeButton}
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() =>
                                setPickerOpen({
                                  date: formatDateParam(day),
                                  mealType,
                                })
                              }
                              style={styles.addButton}
                            >
                              + Add
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          // Desktop: 7-column grid
          <div style={styles.calendarGrid}>
            {days.map((day, i) => {
              const isToday = isSameDay(day, today)
              return (
                <div key={i} style={styles.dayColumn}>
                  <div style={{
                    ...styles.dayHeader,
                    ...(isToday ? styles.dayHeaderToday : {}),
                  }}>
                    <div style={styles.dayName}>{DAY_NAMES[i]}</div>
                    <div style={styles.dayNumber}>{day.getDate()}</div>
                  </div>
                  {MEAL_TYPES.map((mealType) => {
                    const entry = getEntryForSlot(day, mealType)
                    return (
                      <div key={mealType} style={styles.mealSlot}>
                        <div style={styles.mealSlotLabel}>
                          {mealType}
                        </div>
                        {entry ? (
                          <>
                            <Link
                              to={`/recipes/${entry.recipe.id}`}
                              style={styles.assignedRecipe}
                            >
                              {entry.recipe.title}
                            </Link>
                            <button
                              onClick={() => handleRemoveEntry(entry.id)}
                              style={styles.removeButton}
                            >
                              ×
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() =>
                              setPickerOpen({
                                date: formatDateParam(day),
                                mealType,
                              })
                            }
                            style={styles.addButton}
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recipe picker modal */}
      {pickerOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setPickerOpen(null)
              setSearchQuery('')
            }
          }}
        >
          <div className="modal-card">
            <div style={styles.pickerHeader}>
              <h2 style={styles.pickerTitle}>Pick a Recipe</h2>
              <button
                onClick={() => {
                  setPickerOpen(null)
                  setSearchQuery('')
                }}
                style={styles.pickerClose}
              >
                ×
              </button>
            </div>
            <p style={styles.pickerSubtitle}>
              {pickerOpen.mealType.charAt(0).toUpperCase() + pickerOpen.mealType.slice(1)} · {pickerOpen.date}
            </p>
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.pickerSearch}
              autoFocus
            />
            <div style={styles.pickerList}>
              {filteredRecipes.length === 0 ? (
                <p style={styles.pickerEmpty}>
                  {recipes.length === 0 ? 'No recipes yet. Create one first!' : 'No recipes match your search.'}
                </p>
              ) : (
                filteredRecipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => handleAssignRecipe(recipe.id)}
                    className="picker-recipe"
                  >
                    <span style={styles.pickerRecipeTitle}>{recipe.title}</span>
                    {(recipe.prepTime || recipe.cookTime) && (
                      <span style={styles.pickerRecipeMeta}>
                        {recipe.prepTime && `${recipe.prepTime}m prep`}
                        {recipe.prepTime && recipe.cookTime && ' · '}
                        {recipe.cookTime && `${recipe.cookTime}m cook`}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
            <div style={styles.pickerCreateRow}>
              <button
                onClick={() => {
                  setPickerOpen(null)
                  setSearchQuery('')
                  navigate('/recipes/create', {
                    state: { returnTo: '/meal-plan' },
                  })
                }}
                style={styles.pickerCreateButton}
              >
                + Wizard
              </button>
              <button
                onClick={() => {
                  setPickerOpen(null)
                  setSearchQuery('')
                  navigate('/recipes/chat', {
                    state: { returnTo: '/meal-plan' },
                  })
                }}
                style={styles.pickerCreateButton}
              >
                + Chat with AI
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="bottom-nav-bar">
        <Link to="/">Home</Link>
        <Link to="/recipes">Recipes</Link>
        <Link to="/meal-plan" className="active">Meal Plan</Link>
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
    paddingBottom: '5rem',
  },
  content: {
    padding: '2rem 1rem',
    maxWidth: '1100px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#2D2420',
  },
  weekNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  navButton: {
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #E8DDD4',
    background: 'white',
    cursor: 'pointer',
    fontSize: '1.125rem',
    lineHeight: 1,
    color: '#2D2420',
  },
  weekLabel: {
    fontSize: '0.9375rem',
    fontWeight: 500,
    color: '#2D2420',
    minWidth: '140px',
    textAlign: 'center',
  },
  todayButton: {
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: 'none',
    background: '#E07A5F',
    color: 'white',
    cursor: 'pointer',
    fontSize: '0.8125rem',
    fontWeight: 500,
  },
  error: {
    background: '#FDECEA',
    color: '#C44536',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontSize: '0.875rem',
  },
  // Desktop grid
  calendarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '0.5rem',
  },
  dayColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  dayHeader: {
    textAlign: 'center',
    padding: '0.75rem 0.25rem',
    borderRadius: '8px',
    background: '#FBF0DA',
    color: '#2D2420',
  },
  dayHeaderToday: {
    background: '#E07A5F',
    color: 'white',
  },
  dayName: {
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  dayNumber: {
    fontSize: '1.125rem',
    fontWeight: 600,
  },
  mealSlot: {
    background: 'white',
    borderRadius: '8px',
    padding: '0.75rem',
    minHeight: '70px',
    border: '1px solid #E8DDD4',
  },
  mealSlotLabel: {
    fontSize: '0.625rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: '#A89888',
    marginBottom: '0.375rem',
    letterSpacing: '0.03em',
  },
  assignedRecipeRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '0.25rem',
  },
  assignedRecipe: {
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: '#2D2420',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'block',
    lineHeight: 1.3,
  },
  removeButton: {
    fontSize: '1rem',
    color: '#A89888',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0',
    lineHeight: 1,
    flexShrink: 0,
  },
  addButton: {
    fontSize: '0.75rem',
    color: '#E07A5F',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 500,
    padding: 0,
  },
  // Mobile layout
  mobileList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  mobileDay: {
    background: 'white',
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid #E8DDD4',
  },
  mobileDayHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    background: '#FBF0DA',
    color: '#2D2420',
  },
  mobileDayHeaderToday: {
    background: '#E07A5F',
    color: 'white',
  },
  mobileMeals: {
    padding: '0.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  // Modal
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '1rem',
  },
  pickerCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    width: '100%',
    maxWidth: '400px',
    maxHeight: '70vh',
    display: 'flex',
    flexDirection: 'column',
  },
  pickerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerTitle: {
    margin: 0,
    fontSize: '1.125rem',
    fontWeight: 600,
    color: '#2D2420',
  },
  pickerClose: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#A89888',
    padding: '0.25rem',
    lineHeight: 1,
  },
  pickerSubtitle: {
    fontSize: '0.8125rem',
    color: '#7A6B60',
    margin: '0.25rem 0 1rem',
  },
  pickerSearch: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid #E8DDD4',
    fontSize: '0.875rem',
    marginBottom: '0.75rem',
    boxSizing: 'border-box',
  },
  pickerList: {
    overflow: 'auto',
    flex: 1,
  },
  pickerEmpty: {
    textAlign: 'center',
    color: '#7A6B60',
    padding: '2rem 0',
    fontSize: '0.875rem',
  },
  pickerRecipe: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    padding: '0.75rem',
    borderRadius: '6px',
    cursor: 'pointer',
    border: '1px solid #E8DDD4',
    marginBottom: '0.5rem',
    background: 'white',
    textAlign: 'left',
  },
  pickerRecipeTitle: {
    fontWeight: 500,
    fontSize: '0.875rem',
    color: '#2D2420',
  },
  pickerRecipeMeta: {
    fontSize: '0.75rem',
    color: '#7A6B60',
    marginTop: '0.25rem',
  },
  pickerCreateRow: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  pickerCreateButton: {
    flex: 1,
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px dashed #E07A5F',
    background: '#FDF8F4',
    color: '#E07A5F',
    cursor: 'pointer',
    fontSize: '0.8125rem',
    fontWeight: 500,
  },
  // Bottom nav
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'white',
    display: 'flex',
    justifyContent: 'space-around',
    padding: '0.75rem 0',
    borderTop: '1px solid #E8DDD4',
  },
  bottomNavLink: {
    color: '#7A6B60',
    textDecoration: 'none',
    fontSize: '0.875rem',
  },
}
