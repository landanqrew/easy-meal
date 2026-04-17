import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '../lib/auth'
import { colors, radius, shadows } from '../lib/theme'
import { apiFetch, apiPost, apiPatch, apiDelete, queryKeys } from '../lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
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
const DAY_NAMES_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const MEAL_TYPE_COLORS: Record<MealType, { dot: string; bg: string; text: string }> = {
  breakfast: { dot: '#D4A373', bg: 'rgba(212, 163, 115, 0.08)', text: '#A67B4B' },
  lunch: { dot: '#81A384', bg: 'rgba(129, 163, 132, 0.08)', text: '#5B7A5E' },
  dinner: { dot: '#D08770', bg: 'rgba(208, 135, 112, 0.08)', text: '#B06A52' },
  snack: { dot: '#B8A596', bg: 'rgba(184, 165, 150, 0.08)', text: '#857163' },
}

// Drag-and-drop sub-components
function DraggableRecipeChip({
  entry,
  onRemove,
}: {
  entry: MealPlanEntry
  onRemove: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, isDragging, active } = useDraggable({
    id: entry.id,
    data: { entry },
  })

  const handleClick = (e: React.MouseEvent) => {
    // If a drag just ended, don't navigate
    if (active) {
      e.preventDefault()
      return
    }
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        ...styles.recipeChip,
        opacity: isDragging ? 0.3 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
      }}
    >
      <Link
        to={`/recipes/${entry.recipe.id}`}
        style={styles.recipeChipLink}
        onClick={handleClick}
        draggable={false}
      >
        {entry.recipe.title}
      </Link>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove(entry.id)
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="meal-remove-btn"
        style={styles.recipeChipRemove}
        aria-label={`Remove ${entry.recipe.title}`}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}

function DroppableMealSlot({
  droppableId,
  mealType,
  children,
}: {
  droppableId: string
  mealType: MealType
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: { mealType },
  })

  const mealColors = MEAL_TYPE_COLORS[mealType]

  return (
    <div
      ref={setNodeRef}
      className="meal-slot"
      style={{
        ...styles.mealSlot,
        ...(isOver ? {
          background: mealColors.bg,
          borderColor: mealColors.dot,
          borderStyle: 'dashed',
        } : {}),
      }}
    >
      {children}
    </div>
  )
}

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

function formatPickerDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const dayName = DAY_NAMES_FULL[d.getDay() === 0 ? 6 : d.getDay() - 1]
  const month = MONTH_NAMES[d.getMonth()]
  return `${dayName}, ${month} ${d.getDate()}`
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
  const gridRef = useRef<HTMLDivElement>(null)
  const todayColumnRef = useRef<HTMLDivElement>(null)

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

  const moveMutation = useMutation({
    mutationFn: (args: { id: string; date: string; mealType: MealType; sortOrder: number }) =>
      apiPatch(`/api/meal-plans/${args.id}`, {
        date: args.date,
        mealType: args.mealType,
        sortOrder: args.sortOrder,
      }),
    onError: (err: Error) => {
      // Revert optimistic update
      queryClient.invalidateQueries({ queryKey: queryKeys.mealPlanEntries(weekParam) })
      setError(err.message || 'Failed to move entry')
    },
  })

  const copyWeekMutation = useMutation({
    mutationFn: (args: { sourceWeekStart: string; targetWeekStart: string }) =>
      apiPost<{ copiedCount: number }>('/api/meal-plans/copy-week', args),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mealPlanEntries(weekParam) })
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to copy week')
    },
  })

  const handleCopyPreviousWeek = () => {
    const prevMonday = new Date(weekStart)
    prevMonday.setDate(prevMonday.getDate() - 7)
    setError('')
    copyWeekMutation.mutate({
      sourceWeekStart: formatDateParam(prevMonday),
      targetWeekStart: weekParam,
    })
  }

  const [activeEntry, setActiveEntry] = useState<MealPlanEntry | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const entry = event.active.data.current?.entry as MealPlanEntry | undefined
    if (entry) setActiveEntry(entry)
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveEntry(null)
    const { active, over } = event
    if (!over) return

    const entry = active.data.current?.entry as MealPlanEntry | undefined
    if (!entry) return

    // droppableId format: "slot-{date}-{mealType}"
    const overId = String(over.id)
    if (!overId.startsWith('slot-')) return

    const parts = overId.split('-')
    // "slot-2026-03-08-breakfast" → date = "2026-03-08", mealType = last part
    const newMealType = parts[parts.length - 1] as MealType
    const newDate = parts.slice(1, parts.length - 1).join('-')

    const oldDate = entry.date.slice(0, 10)
    const oldMealType = entry.mealType

    // No change
    if (oldDate === newDate && oldMealType === newMealType) return

    // Count existing entries in target slot for sortOrder
    const targetEntries = entries.filter((e) => {
      return e.date.slice(0, 10) === newDate && e.mealType === newMealType
    })
    const newSortOrder = targetEntries.length

    // Optimistic update
    queryClient.setQueryData<MealPlanEntry[]>(
      queryKeys.mealPlanEntries(weekParam),
      (old) => {
        if (!old) return old
        return old.map((e) =>
          e.id === entry.id
            ? { ...e, date: newDate + 'T00:00:00.000Z', mealType: newMealType, sortOrder: newSortOrder }
            : e
        )
      }
    )

    moveMutation.mutate({
      id: entry.id,
      date: newDate,
      mealType: newMealType,
      sortOrder: newSortOrder,
    })
  }, [entries, weekParam, queryClient, moveMutation])

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

  // Scroll today's column into view when week changes
  useEffect(() => {
    if (!isMobile && todayColumnRef.current && gridRef.current) {
      const grid = gridRef.current
      const col = todayColumnRef.current
      const scrollLeft = col.offsetLeft - grid.offsetLeft - (grid.clientWidth / 2) + (col.offsetWidth / 2)
      grid.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' })
    }
  // entriesLoading is intentional: the grid ref isn't mounted while loading,
  // so we re-run this effect once data arrives and the real grid renders.
  }, [weekParam, isMobile, entriesLoading])

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

  const totalMealsPlanned = entries.length

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
          <div style={styles.headerCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="skeleton" style={{ width: '160px', height: '1.75rem' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: radius.full }} />
                <div className="skeleton" style={{ width: '120px', height: '1rem' }} />
                <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: radius.full }} />
              </div>
            </div>
          </div>
          {isMobile ? (
            <div style={styles.mobileList}>
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} style={styles.mobileDay}>
                  <div style={styles.mobileDayHeader}>
                    <div className="skeleton" style={{ width: '80px', height: '1rem', background: 'rgba(255,255,255,0.3)' }} />
                    <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: radius.full, background: 'rgba(255,255,255,0.3)' }} />
                  </div>
                  <div style={styles.mobileMeals}>
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} style={styles.mealSlot}>
                        <div className="skeleton" style={{ width: '50px', height: '0.625rem', marginBottom: '0.5rem' }} />
                        <div className="skeleton" style={{ width: '80%', height: '2rem', borderRadius: radius.sm }} />
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
                  <div style={styles.dayHeader}>
                    <div className="skeleton" style={{ width: '24px', height: '0.6875rem', background: 'rgba(255,255,255,0.3)' }} />
                    <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: radius.full, background: 'rgba(255,255,255,0.3)' }} />
                  </div>
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} style={styles.mealSlot}>
                      <div className="skeleton" style={{ width: '50px', height: '0.625rem', marginBottom: '0.5rem' }} />
                      <div className="skeleton" style={{ width: '80%', height: '2rem', borderRadius: radius.sm }} />
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
        {/* Header card */}
        <div style={styles.headerCard}>
          <div style={styles.headerTop}>
            <div style={styles.headerLeft}>
              <h1 style={styles.title}>Meal Plan</h1>
              {totalMealsPlanned > 0 && (
                <span style={styles.mealCount}>
                  {totalMealsPlanned} meal{totalMealsPlanned !== 1 ? 's' : ''} planned
                </span>
              )}
            </div>
            <div style={styles.headerActions}>
              <button
                onClick={handleCopyPreviousWeek}
                className="btn-secondary"
                style={styles.groceryButton}
                disabled={copyWeekMutation.isPending}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                {copyWeekMutation.isPending ? 'Copying...' : 'Copy Previous Week'}
              </button>
              {weekRecipeIds.length > 0 && (
                <button
                  onClick={handleCreateGroceryList}
                  className="btn-secondary"
                  style={styles.groceryButton}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                  </svg>
                  Grocery List
                </button>
              )}
            </div>
          </div>
          <div style={styles.weekNavRow}>
            <button
              onClick={() => navigateWeek(-1)}
              style={styles.weekNavButton}
              aria-label="Previous week"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div style={styles.weekLabelGroup}>
              <span style={styles.weekLabel}>{formatWeekRange(weekStart)}</span>
              <span style={styles.yearLabel}>{weekStart.getFullYear()}</span>
            </div>
            <button
              onClick={() => navigateWeek(1)}
              style={styles.weekNavButton}
              aria-label="Next week"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 6 15 12 9 18" />
              </svg>
            </button>
            <button onClick={goToToday} style={styles.todayButton}>
              Today
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {isMobile ? (
            <div style={styles.mobileList}>
              {days.map((day, i) => {
                const isToday = isSameDay(day, today)
                return (
                  <div key={i} style={{
                    ...styles.mobileDay,
                    ...(isToday ? styles.mobileDayToday : {}),
                  }}>
                    <div style={{
                      ...styles.mobileDayHeader,
                      ...(isToday ? styles.mobileDayHeaderToday : {}),
                    }}>
                      <span style={styles.mobileDayName}>
                        {DAY_NAMES_FULL[i]}
                      </span>
                      <span style={{
                        ...styles.dayBadge,
                        ...(isToday ? styles.dayBadgeToday : {}),
                      }}>
                        {day.getDate()}
                      </span>
                    </div>
                    <div style={styles.mobileMeals}>
                      {MEAL_TYPES.map((mealType) => {
                        const slotEntries = getEntriesForSlot(day, mealType)
                        const mealColors = MEAL_TYPE_COLORS[mealType]
                        const droppableId = `slot-${formatDateParam(day)}-${mealType}`
                        return (
                          <DroppableMealSlot key={mealType} droppableId={droppableId} mealType={mealType}>
                            <div style={styles.mealSlotHeader}>
                              <span style={{
                                ...styles.mealDot,
                                background: mealColors.dot,
                              }} />
                              <span style={{
                                ...styles.mealSlotLabel,
                                color: mealColors.text,
                              }}>
                                {mealType}
                              </span>
                            </div>
                            <div style={styles.mealSlotContent}>
                              {slotEntries.map((entry) => (
                                <DraggableRecipeChip
                                  key={entry.id}
                                  entry={entry}
                                  onRemove={handleRemoveEntry}
                                />
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
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="12" y1="5" x2="12" y2="19" />
                                  <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                Add
                              </button>
                            </div>
                          </DroppableMealSlot>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div ref={gridRef} style={styles.calendarGrid}>
              {days.map((day, i) => {
                const isToday = isSameDay(day, today)
                return (
                  <div
                    key={i}
                    ref={isToday ? todayColumnRef : undefined}
                    style={{
                      ...styles.dayColumn,
                      ...(isToday ? styles.dayColumnToday : {}),
                    }}
                  >
                    <div style={{
                      ...styles.dayHeader,
                      ...(isToday ? styles.dayHeaderToday : {}),
                    }}>
                      <div style={{
                        ...styles.dayName,
                        ...(isToday ? { color: 'rgba(255,255,255,0.85)' } : {}),
                      }}>
                        {DAY_NAMES[i]}
                      </div>
                      <div style={{
                        ...styles.dayBadge,
                        ...(isToday ? styles.dayBadgeToday : {}),
                      }}>
                        {day.getDate()}
                      </div>
                    </div>
                    {MEAL_TYPES.map((mealType) => {
                      const slotEntries = getEntriesForSlot(day, mealType)
                      const mealColors = MEAL_TYPE_COLORS[mealType]
                      const droppableId = `slot-${formatDateParam(day)}-${mealType}`
                      return (
                        <DroppableMealSlot key={mealType} droppableId={droppableId} mealType={mealType}>
                          <div style={styles.mealSlotHeader}>
                            <span style={{
                              ...styles.mealDot,
                              background: mealColors.dot,
                            }} />
                            <span style={{
                              ...styles.mealSlotLabel,
                              color: mealColors.text,
                            }}>
                              {mealType}
                            </span>
                          </div>
                          <div style={styles.mealSlotContent}>
                            {slotEntries.map((entry) => (
                              <DraggableRecipeChip
                                key={entry.id}
                                entry={entry}
                                onRemove={handleRemoveEntry}
                              />
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
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                              Add
                            </button>
                          </div>
                        </DroppableMealSlot>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}

          <DragOverlay>
            {activeEntry && (
              <div style={{
                ...styles.recipeChip,
                boxShadow: '0 8px 24px rgba(184, 165, 150, 0.35)',
                background: colors.surface,
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: colors.primary,
                transform: 'scale(1.05)',
                cursor: 'grabbing',
              }}>
                <span style={styles.recipeChipLink}>
                  {activeEntry.recipe.title}
                </span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
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
          <div className="modal-card" style={styles.pickerModal}>
            <div style={styles.pickerHeader}>
              <div>
                <h2 style={styles.pickerTitle}>Add Recipe</h2>
                <p style={styles.pickerSubtitle}>
                  <span style={{
                    ...styles.pickerMealBadge,
                    background: MEAL_TYPE_COLORS[pickerOpen.mealType].bg,
                    color: MEAL_TYPE_COLORS[pickerOpen.mealType].text,
                    borderColor: MEAL_TYPE_COLORS[pickerOpen.mealType].dot,
                  }}>
                    {pickerOpen.mealType.charAt(0).toUpperCase() + pickerOpen.mealType.slice(1)}
                  </span>
                  <span style={styles.pickerDateText}>
                    {formatPickerDate(pickerOpen.date)}
                  </span>
                </p>
              </div>
              <button
                onClick={() => {
                  setPickerOpen(null)
                  setSearchQuery('')
                  setPickerTypeFilter(null)
                }}
                style={styles.pickerClose}
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div style={styles.pickerSearchWrapper}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.searchIcon}>
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.pickerSearch}
                autoFocus
              />
            </div>

            <div style={styles.pickerTypeFilters}>
              {PICKER_TYPE_FILTERS.map((t) => (
                <button
                  key={t.label}
                  onClick={() => setPickerTypeFilter(pickerTypeFilter === t.value ? null : t.value)}
                  className={`filter-chip${pickerTypeFilter === t.value ? ' active' : ''}`}
                  style={{ fontSize: '0.6875rem', padding: '0.25rem 0.625rem' }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div style={styles.pickerList}>
              {filteredRecipes.length === 0 ? (
                <div style={styles.pickerEmpty}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '0.75rem', opacity: 0.5 }}>
                    <path d="M15 11h.01M11 15h.01M16 16c-.5-1.5-2.8-2-4-2s-3.5.5-4 2" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>
                    {recipes.length === 0 ? 'No recipes yet. Create one first!' : 'No recipes match your filters.'}
                  </p>
                </div>
              ) : (
                filteredRecipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => handleAssignRecipe(recipe.id)}
                    className="picker-recipe"
                    style={styles.pickerRecipeItem}
                  >
                    <div style={styles.pickerRecipeLeft}>
                      <span style={styles.pickerRecipeTitle}>{recipe.title}</span>
                      <span style={styles.pickerRecipeMeta}>
                        {recipe.prepTime && `${recipe.prepTime}m prep`}
                        {recipe.prepTime && recipe.cookTime && ' · '}
                        {recipe.cookTime && `${recipe.cookTime}m cook`}
                      </span>
                    </div>
                    <span style={styles.pickerTypeBadge}>
                      {RECIPE_TYPE_LABELS[recipe.type] || recipe.type}
                    </span>
                  </button>
                ))
              )}
            </div>

            <div style={styles.pickerDivider} />
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Wizard
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                Chat with AI
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
    paddingTop: '5.5rem',
  },
  content: {
    padding: '1.5rem 1rem 2rem',
    maxWidth: '1100px',
    margin: '0 auto',
  },

  // Header card
  headerCard: {
    background: colors.surface,
    borderRadius: radius.lg,
    padding: '1.25rem 1.5rem',
    marginBottom: '1.5rem',
    boxShadow: shadows.sm,
    border: `1px solid ${colors.borderLight}`,
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.75rem',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: colors.text,
  },
  mealCount: {
    fontSize: '0.8125rem',
    color: colors.textMuted,
    fontWeight: 400,
  },
  groceryButton: {
    padding: '0.5rem 1rem',
    fontSize: '0.8125rem',
    minHeight: 'unset',
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  },

  // Week navigation
  weekNavRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
  },
  weekNavButton: {
    width: '36px',
    height: '36px',
    minHeight: '36px',
    borderRadius: radius.full,
    border: `1px solid ${colors.border}`,
    background: colors.surface,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.textSecondary,
    transition: 'all 150ms ease',
  },
  weekLabelGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '140px',
  },
  weekLabel: {
    fontSize: '1rem',
    fontWeight: 600,
    color: colors.text,
    letterSpacing: '-0.01em',
  },
  yearLabel: {
    fontSize: '0.6875rem',
    color: colors.textMuted,
    fontWeight: 400,
  },
  todayButton: {
    padding: '0.375rem 0.875rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    borderRadius: radius.full,
    border: 'none',
    background: colors.primary,
    color: 'white',
    cursor: 'pointer',
    minHeight: 'unset',
    letterSpacing: '0.02em',
    textTransform: 'uppercase' as const,
    transition: 'all 150ms ease',
  },

  // Desktop grid — Trello-style horizontal scroll
  calendarGrid: {
    display: 'flex',
    gap: '0.625rem',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    paddingBottom: '0.5rem',
    scrollbarWidth: 'thin',
    scrollbarColor: `${colors.border} transparent`,
    position: 'relative',
  },
  dayColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
    borderRadius: radius.md,
    transition: 'all 200ms ease',
    minWidth: '220px',
    width: '220px',
    flexShrink: 0,
  },
  dayColumnToday: {
    // subtle glow behind the whole column
  },
  dayHeader: {
    textAlign: 'center',
    padding: '0.625rem 0.25rem 0.75rem',
    borderRadius: radius.md,
    background: `linear-gradient(135deg, ${colors.accentWarm}, ${colors.warmBg})`,
    color: colors.text,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
  },
  dayHeaderToday: {
    background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryHover})`,
    color: 'white',
    boxShadow: '0 4px 14px rgba(208, 135, 112, 0.35)',
  },
  dayName: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: colors.textSecondary,
  },
  dayBadge: {
    width: '32px',
    height: '32px',
    borderRadius: radius.full,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.9375rem',
    fontWeight: 700,
    background: 'rgba(255,255,255,0.5)',
    color: colors.text,
  },
  dayBadgeToday: {
    background: 'rgba(255,255,255,0.25)',
    color: 'white',
  },

  // Meal slots
  mealSlot: {
    background: colors.surface,
    borderRadius: radius.md,
    padding: '0.625rem',
    minHeight: '72px',
    border: `1px solid ${colors.borderLight}`,
    display: 'flex',
    flexDirection: 'column',
  },
  mealSlotHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    marginBottom: '0.375rem',
  },
  mealDot: {
    width: '6px',
    height: '6px',
    borderRadius: radius.full,
    flexShrink: 0,
  },
  mealSlotLabel: {
    fontSize: '0.625rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  mealSlotContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    flex: 1,
  },

  // Recipe chips
  recipeChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.3125rem 0.5rem',
    borderRadius: radius.sm,
    background: colors.warmBg,
    transition: 'all 150ms ease',
  },
  recipeChipLink: {
    fontSize: '0.75rem',
    fontWeight: 500,
    color: colors.text,
    cursor: 'pointer',
    textDecoration: 'none',
    lineHeight: 1.4,
    flex: 1,
    minWidth: 0,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  recipeChipRemove: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    lineHeight: 1,
    flexShrink: 0,
    color: colors.textMuted,
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'unset',
    width: '20px',
    height: '20px',
    transition: 'all 150ms ease',
  },

  // Add button
  addButton: {
    fontSize: '0.6875rem',
    color: colors.textMuted,
    background: 'none',
    border: `1px dashed ${colors.border}`,
    borderRadius: radius.sm,
    cursor: 'pointer',
    fontWeight: 500,
    padding: '0.25rem 0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.25rem',
    marginTop: 'auto',
    minHeight: '28px',
    transition: 'all 150ms ease',
  },

  // Mobile layout
  mobileList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  mobileDay: {
    background: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    boxShadow: shadows.sm,
    border: `1px solid ${colors.borderLight}`,
    transition: 'all 200ms ease',
  },
  mobileDayToday: {
    boxShadow: '0 4px 20px rgba(208, 135, 112, 0.2)',
    borderColor: colors.primary,
  },
  mobileDayHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.875rem 1rem',
    background: `linear-gradient(135deg, ${colors.accentWarm}, ${colors.warmBg})`,
    color: colors.text,
  },
  mobileDayHeaderToday: {
    background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryHover})`,
    color: 'white',
  },
  mobileDayName: {
    fontSize: '0.9375rem',
    fontWeight: 600,
  },
  mobileMeals: {
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },

  // Picker modal
  pickerModal: {
    maxWidth: '440px',
    padding: '1.5rem',
  },
  pickerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  },
  pickerTitle: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 700,
    color: colors.text,
    letterSpacing: '-0.01em',
  },
  pickerSubtitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '0.375rem',
  },
  pickerMealBadge: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    padding: '0.125rem 0.5rem',
    borderRadius: radius.full,
    border: '1px solid',
    letterSpacing: '0.02em',
  },
  pickerDateText: {
    fontSize: '0.8125rem',
    color: colors.textSecondary,
  },
  pickerClose: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: colors.textMuted,
    padding: '0.375rem',
    lineHeight: 1,
    borderRadius: radius.sm,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'unset',
    transition: 'all 150ms ease',
  },
  pickerSearchWrapper: {
    position: 'relative',
    marginBottom: '0.75rem',
  },
  searchIcon: {
    position: 'absolute',
    left: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  },
  pickerSearch: {
    width: '100%',
    padding: '0.625rem 0.75rem 0.625rem 2.25rem',
    borderRadius: radius.full,
    border: `1px solid ${colors.border}`,
    fontSize: '0.875rem',
    boxSizing: 'border-box',
    background: colors.warmBg,
    color: colors.text,
    outline: 'none',
    transition: 'all 150ms ease',
  },
  pickerTypeFilters: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.375rem',
    marginBottom: '0.75rem',
  },
  pickerList: {
    overflow: 'auto',
    flex: 1,
    margin: '0 -0.25rem',
    padding: '0 0.25rem',
  },
  pickerEmpty: {
    textAlign: 'center',
    color: colors.textSecondary,
    padding: '2rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  pickerRecipeItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '0.75rem',
    borderRadius: radius.md,
    cursor: 'pointer',
    border: `1px solid ${colors.borderLight}`,
    marginBottom: '0.375rem',
    background: colors.surface,
    textAlign: 'left',
    transition: 'all 150ms ease',
    gap: '0.75rem',
  },
  pickerRecipeLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    flex: 1,
    minWidth: 0,
  },
  pickerRecipeTitle: {
    fontWeight: 600,
    fontSize: '0.875rem',
    color: colors.text,
    lineHeight: 1.3,
  },
  pickerRecipeMeta: {
    fontSize: '0.6875rem',
    color: colors.textMuted,
  },
  pickerTypeBadge: {
    fontSize: '0.625rem',
    fontWeight: 600,
    padding: '0.125rem 0.5rem',
    borderRadius: radius.full,
    background: colors.warmBg,
    color: colors.textSecondary,
    flexShrink: 0,
    letterSpacing: '0.02em',
    textTransform: 'uppercase' as const,
  },
  pickerDivider: {
    height: '1px',
    background: colors.borderLight,
    margin: '0.5rem 0',
  },
  pickerCreateRow: {
    display: 'flex',
    gap: '0.5rem',
  },
  pickerCreateButton: {
    flex: 1,
    padding: '0.625rem 0.75rem',
    borderRadius: radius.md,
    border: `1px dashed ${colors.border}`,
    background: colors.warmBg,
    color: colors.textSecondary,
    cursor: 'pointer',
    fontSize: '0.8125rem',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.375rem',
    minHeight: 'unset',
    transition: 'all 150ms ease',
  },
}
