import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '../lib/auth'
import { colors, radius } from '../lib/theme'
import { apiFetch, apiPost, apiDelete, queryKeys } from '../lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { MealType, RecipeType, MealPlanEntry } from '@easy-meal/shared'

type Recipe = {
  id: string
  title: string
  prepTime: number | null
  cookTime: number | null
  type: RecipeType
}

const RECIPE_TYPE_LABELS: Record<RecipeType, string> = {
  full_meal: 'Full Meal',
  entree: 'Entree',
  side: 'Side',
  dessert: 'Dessert',
  appetizer: 'Appetizer',
  snack: 'Snack',
  drink: 'Drink',
  other: 'Other',
}

const PICKER_TYPE_FILTERS: { value: RecipeType | null; label: string }[] = [
  { value: null, label: 'All' },
  { value: 'full_meal', label: 'Full Meal' },
  { value: 'entree', label: 'Entree' },
  { value: 'side', label: 'Side' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'appetizer', label: 'Appetizer' },
  { value: 'snack', label: 'Snack' },
  { value: 'drink', label: 'Drink' },
]

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
  const queryClient = useQueryClient()
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()))
  const [error, setError] = useState('')
  const [pickerOpen, setPickerOpen] = useState<{ date: string; mealType: MealType } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [pickerTypeFilter, setPickerTypeFilter] = useState<RecipeType | null>(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  const weekParam = formatDateParam(weekStart)

  const { data: entries = [], isLoading: entriesLoading, error: entriesError } = useQuery({
    queryKey: queryKeys.mealPlanEntries(weekParam),
    queryFn: () => apiFetch<MealPlanEntry[]>(`/api/meal-plans?weekStart=${weekParam}`),
    enabled: !!session,
  })

  const { data: recipes = [] } = useQuery({
    queryKey: queryKeys.recipes,
    queryFn: () => apiFetch<Recipe[]>('/api/recipes'),
    enabled: !!session,
  })

  const assignMutation = useMutation({
    mutationFn: (body: { recipeId: string; date: string; mealType: string }) =>
      apiPost('/api/meal-plans', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mealPlanEntries(weekParam) })
      setPickerOpen(null)
      setSearchQuery('')
      setPickerTypeFilter(null)
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to assign recipe')
    },
  })

  const removeMutation = useMutation({
    mutationFn: (entryId: string) => apiDelete(`/api/meal-plans/${entryId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mealPlanEntries(weekParam) })
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to remove entry')
    },
  })

  useEffect(() => {
    if (!isPending && !session) {
      navigate('/login')
    }
  }, [session, isPending, navigate])

  useEffect(() => {
    if (entriesError) {
      setError((entriesError as Error).message || 'Failed to load meal plan')
    }
  }, [entriesError])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const getEntriesForSlot = (date: Date, mealType: MealType): MealPlanEntry[] => {
    const dateStr = formatDateParam(date)
    return entries
      .filter((e) => {
        const entryDate = e.date.slice(0, 10)
        return entryDate === dateStr && e.mealType === mealType
      })
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }

  const handleAssignRecipe = (recipeId: string) => {
    if (!pickerOpen) return
    setError('')
    assignMutation.mutate({
      recipeId,
      date: pickerOpen.date,
      mealType: pickerOpen.mealType,
    })
  }

  const handleRemoveEntry = (entryId: string) => {
    setError('')
    removeMutation.mutate(entryId)
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

  const weekRecipeIds = useMemo(() => {
    return [...new Set(entries.map((e) => e.recipeId))]
  }, [entries])

  const handleCreateGroceryList = () => {
    navigate('/grocery-lists/create', {
      state: {
        fromMealPlan: true,
        recipeIds: weekRecipeIds,
        weekLabel: `Week of ${formatWeekRange(weekStart)}`,
      },
    })
  }

  const filteredRecipes = recipes
    .filter((r) => r.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((r) => !pickerTypeFilter || r.type === pickerTypeFilter)

  if (isPending || entriesLoading) {
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
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <h1 style={styles.title}>Meal Plan</h1>
            {weekRecipeIds.length > 0 && (
              <button
                onClick={handleCreateGroceryList}
                className="btn-secondary"
                style={styles.groceryButton}
              >
                Grocery List
              </button>
            )}
          </div>
          <div style={styles.weekNav}>
            <button onClick={() => navigateWeek(-1)} className="btn-secondary" style={{ padding: '0.5rem 0.75rem', fontSize: '1.125rem', lineHeight: 1, minHeight: 'unset' }}>
              ‹
            </button>
            <span style={styles.weekLabel}>{formatWeekRange(weekStart)}</span>
            <button onClick={() => navigateWeek(1)} className="btn-secondary" style={{ padding: '0.5rem 0.75rem', fontSize: '1.125rem', lineHeight: 1, minHeight: 'unset' }}>
              ›
            </button>
            <button onClick={goToToday} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem', minHeight: 'unset' }}>
              Today
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

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
                      const slotEntries = getEntriesForSlot(day, mealType)
                      return (
                        <div key={mealType} className="meal-slot" style={styles.mealSlot}>
                          <div style={styles.mealSlotLabel}>
                            {mealType}
                          </div>
                          {slotEntries.map((entry) => (
                            <div key={entry.id} style={styles.assignedRecipeRow}>
                              <Link
                                to={`/recipes/${entry.recipe.id}`}
                                style={styles.assignedRecipe}
                              >
                                {entry.recipe.title}
                              </Link>
                              <button
                                onClick={() => handleRemoveEntry(entry.id)}
                                className="meal-remove-btn"
                                style={styles.removeButton}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() =>
                              setPickerOpen({
                                date: formatDateParam(day),
                                mealType,
                              })
                            }
                            className="meal-add-btn"
                            style={styles.addButton}
                          >
                            + Add
                          </button>
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
                    const slotEntries = getEntriesForSlot(day, mealType)
                    return (
                      <div key={mealType} style={styles.mealSlot}>
                        <div style={styles.mealSlotLabel}>
                          {mealType}
                        </div>
                        {slotEntries.map((entry) => (
                          <div key={entry.id} style={styles.assignedRecipeRow}>
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
                        ))}
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
              setPickerTypeFilter(null)
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
                  setPickerTypeFilter(null)
                }}
                style={styles.pickerClose}
              >
                ×
              </button>
            </div>
            <p style={styles.pickerSubtitle}>
              {pickerOpen.mealType.charAt(0).toUpperCase() + pickerOpen.mealType.slice(1)} · {pickerOpen.date}
            </p>
            <div style={styles.pickerTypeFilters}>
              {PICKER_TYPE_FILTERS.map((t) => (
                <button
                  key={t.label}
                  onClick={() => setPickerTypeFilter(pickerTypeFilter === t.value ? null : t.value)}
                  className={`filter-chip${pickerTypeFilter === t.value ? ' active' : ''}`}
                  style={{ fontSize: '0.6875rem', padding: '0.25rem 0.5rem' }}
                >
                  {t.label}
                </button>
              ))}
            </div>
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
                    <span style={styles.pickerRecipeMeta}>
                      <span style={{ padding: '0.0625rem 0.375rem', borderRadius: radius.full, background: colors.warmBg, fontSize: '0.625rem', marginRight: '0.375rem' }}>
                        {RECIPE_TYPE_LABELS[recipe.type] || recipe.type}
                      </span>
                      {recipe.prepTime && `${recipe.prepTime}m prep`}
                      {recipe.prepTime && recipe.cookTime && ' · '}
                      {recipe.cookTime && `${recipe.cookTime}m cook`}
                    </span>
                  </button>
                ))
              )}
            </div>
            <div style={styles.pickerCreateRow}>
              <button
                onClick={() => {
                  setPickerOpen(null)
                  setSearchQuery('')
                  setPickerTypeFilter(null)
                  navigate('/recipes/create', {
                    state: { returnTo: '/meal-plan' },
                  })
                }}
                className="picker-create-btn"
                style={styles.pickerCreateButton}
              >
                + Wizard
              </button>
              <button
                onClick={() => {
                  setPickerOpen(null)
                  setSearchQuery('')
                  setPickerTypeFilter(null)
                  navigate('/recipes/chat', {
                    state: { returnTo: '/meal-plan' },
                  })
                }}
                className="picker-create-btn"
                style={styles.pickerCreateButton}
              >
                + Chat with AI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: colors.bg,
    paddingTop: '4.5rem',
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
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  title: {
    margin: 0,
    fontSize: '1.75rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: colors.text,
  },
  groceryButton: {
    padding: '0.5rem 1rem',
    fontSize: '0.8125rem',
    minHeight: 'unset',
  },
  weekNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  weekLabel: {
    fontSize: '0.9375rem',
    fontWeight: 500,
    color: colors.text,
    minWidth: '140px',
    textAlign: 'center',
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
    borderRadius: radius.md,
    background: colors.accentWarm,
    color: colors.text,
  },
  dayHeaderToday: {
    background: colors.primary,
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
    borderRadius: radius.md,
    padding: '0.75rem',
    minHeight: '70px',
    border: `1px solid ${colors.border}`,
  },
  mealSlotLabel: {
    fontSize: '0.625rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: colors.textMuted,
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
    color: colors.text,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'block',
    lineHeight: 1.3,
  },
  removeButton: {
    fontSize: '1rem',
    color: colors.textMuted,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0',
    lineHeight: 1,
    flexShrink: 0,
  },
  addButton: {
    fontSize: '0.75rem',
    color: colors.primary,
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
    borderRadius: radius.md,
    overflow: 'hidden',
    border: `1px solid ${colors.border}`,
  },
  mobileDayHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    background: colors.accentWarm,
    color: colors.text,
  },
  mobileDayHeaderToday: {
    background: colors.primary,
    color: 'white',
  },
  mobileMeals: {
    padding: '0.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  // Modal
  pickerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerTitle: {
    margin: 0,
    fontSize: '1.125rem',
    fontWeight: 600,
    color: colors.text,
  },
  pickerClose: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: colors.textMuted,
    padding: '0.25rem',
    lineHeight: 1,
  },
  pickerSubtitle: {
    fontSize: '0.8125rem',
    color: colors.textSecondary,
    margin: '0.25rem 0 0.75rem',
  },
  pickerTypeFilters: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.375rem',
    marginBottom: '0.75rem',
  },
  pickerSearch: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
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
    color: colors.textSecondary,
    padding: '2rem 0',
    fontSize: '0.875rem',
  },
  pickerRecipeTitle: {
    fontWeight: 500,
    fontSize: '0.875rem',
    color: colors.text,
  },
  pickerRecipeMeta: {
    fontSize: '0.75rem',
    color: colors.textSecondary,
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
    borderRadius: radius.sm,
    border: `1px dashed ${colors.primary}`,
    background: colors.bg,
    color: colors.primary,
    cursor: 'pointer',
    fontSize: '0.8125rem',
    fontWeight: 500,
  },
}
