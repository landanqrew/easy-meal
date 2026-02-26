import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '../lib/auth'
import { colors, shadows, radius } from '../lib/theme'
import { StarDisplay } from './Discover'
import { apiFetch, apiPost, apiDelete, queryKeys } from '../lib/api'
import type { Ingredient, Checkin } from '@easy-meal/shared'

type PublicRecipe = {
  id: string
  title: string
  description: string | null
  servings: number
  prepTime: number | null
  cookTime: number | null
  cuisine: string | null
  instructions: { stepNumber: number; text: string }[]
  source: string
  createdAt: string
  createdBy: { id: string; name: string } | null
  ingredients: Ingredient[]
  ratings: {
    avgEnjoymentRating: number
    avgInstructionRating: number
    checkinCount: number
  }
  recentCheckins: Checkin[]
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <span style={{ display: 'inline-flex', gap: '0.125rem', cursor: 'pointer' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => onChange(star)}
          style={{
            fontSize: '1.5rem',
            color: star <= value ? colors.warning : colors.border,
            transition: 'color 0.15s',
          }}
        >
          &#9733;
        </span>
      ))}
    </span>
  )
}

export default function PublicRecipeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: session, isPending } = useSession()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [copying, setCopying] = useState(false)
  const [copyResult, setCopyResult] = useState<{ id: string; title: string } | null>(null)

  // Check-in form state
  const [enjoymentRating, setEnjoymentRating] = useState(0)
  const [instructionRating, setInstructionRating] = useState(0)
  const [checkinNotes, setCheckinNotes] = useState('')
  const [submittingCheckin, setSubmittingCheckin] = useState(false)

  useEffect(() => {
    if (!isPending && !session) {
      navigate('/login')
    }
  }, [session, isPending, navigate])

  const { data: recipe, isLoading, error: queryError } = useQuery({
    queryKey: queryKeys.publicRecipe(id!),
    queryFn: () => apiFetch<PublicRecipe>(`/api/discover/recipes/${id}`),
    enabled: !!session && !!id,
  })

  const handleCopy = async () => {
    setCopying(true)
    try {
      const data = await apiPost<{ id: string; title: string }>(`/api/discover/recipes/${id}/copy`, {})
      setCopyResult(data)
    } catch (err: any) {
      setError(err.message || 'Failed to copy recipe')
    } finally {
      setCopying(false)
    }
  }

  const handleCheckin = async () => {
    if (enjoymentRating < 1 || instructionRating < 1) {
      setError('Please select both ratings')
      return
    }
    setSubmittingCheckin(true)
    setError('')
    try {
      await apiPost('/api/checkins', {
        recipeId: id,
        notes: checkinNotes || undefined,
        enjoymentRating,
        instructionRating,
      })
      setEnjoymentRating(0)
      setInstructionRating(0)
      setCheckinNotes('')
      queryClient.invalidateQueries({ queryKey: queryKeys.publicRecipe(id!) })
    } catch (err: any) {
      setError(err.message || 'Failed to submit check-in')
    } finally {
      setSubmittingCheckin(false)
    }
  }

  const handleDeleteCheckin = async (checkinId: string) => {
    try {
      await apiDelete(`/api/checkins/${checkinId}`)
      queryClient.invalidateQueries({ queryKey: queryKeys.publicRecipe(id!) })
    } catch {}
  }

  if (isPending || isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div className="skeleton" style={{ width: '60px', height: '0.875rem', marginBottom: '1.5rem' }} />
          <div className="skeleton" style={{ width: '65%', height: '1.75rem', marginBottom: '0.75rem' }} />
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div className="skeleton" style={{ width: '80px', height: '0.875rem' }} />
            <div className="skeleton" style={{ width: '80px', height: '0.875rem' }} />
          </div>
          <div className="skeleton" style={{ width: '100%', height: '1rem', marginBottom: '0.5rem' }} />
          <div className="skeleton" style={{ width: '90%', height: '1rem', marginBottom: '1.5rem' }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: '1rem', padding: '0.5rem 0' }}>
              <div className="skeleton" style={{ width: '80px', height: '0.875rem' }} />
              <div className="skeleton" style={{ width: '60%', height: '0.875rem' }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p>{error || queryError?.message || 'Recipe not found'}</p>
          <Link to="/discover">Back to Discover</Link>
        </div>
      </div>
    )
  }

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0)

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <Link to="/discover" className="back-link">
            ← Back to Discover
          </Link>
          {copyResult ? (
            <Link
              to={`/recipes/${copyResult.id}`}
              className="btn-primary"
              style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', textDecoration: 'none' }}
            >
              View My Copy
            </Link>
          ) : (
            <button
              onClick={handleCopy}
              className="btn-primary"
              style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              disabled={copying}
            >
              {copying ? 'Copying...' : 'Add to My Recipes'}
            </button>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        <h1 style={styles.title}>{recipe.title}</h1>

        {/* Meta row */}
        <div style={styles.meta}>
          {recipe.prepTime && <span>🕐 {recipe.prepTime}m prep</span>}
          {recipe.cookTime && <span>🍳 {recipe.cookTime}m cook</span>}
          {totalTime > 0 && <span>⏱ {totalTime}m total</span>}
          <span>🍽 {recipe.servings} servings</span>
          {recipe.cuisine && <span>🌍 {recipe.cuisine}</span>}
        </div>

        {/* Ratings summary */}
        {recipe.ratings.checkinCount > 0 && (
          <div style={styles.ratingsCard}>
            <div style={styles.ratingRow}>
              <span style={styles.ratingLabel}>Enjoyment</span>
              <StarDisplay rating={recipe.ratings.avgEnjoymentRating} />
              <span style={styles.ratingValue}>{recipe.ratings.avgEnjoymentRating.toFixed(1)}</span>
            </div>
            <div style={styles.ratingRow}>
              <span style={styles.ratingLabel}>Instructions</span>
              <StarDisplay rating={recipe.ratings.avgInstructionRating} />
              <span style={styles.ratingValue}>{recipe.ratings.avgInstructionRating.toFixed(1)}</span>
            </div>
            <span style={styles.checkinCount}>
              {recipe.ratings.checkinCount} check-in{recipe.ratings.checkinCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {recipe.description && <p style={styles.description}>{recipe.description}</p>}

        {/* Creator */}
        {recipe.createdBy && (
          <p style={styles.creatorText}>
            Shared by <strong>{recipe.createdBy.name}</strong>
          </p>
        )}

        {/* Ingredients */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Ingredients</h2>
          <ul style={styles.ingredientList}>
            {recipe.ingredients.map((ing) => (
              <li key={ing.id} style={styles.ingredientItem}>
                <span style={styles.ingredientQty}>
                  {ing.quantity} {ing.unit}
                </span>
                <span style={styles.ingredientName}>
                  {ing.name}
                  {ing.preparation && (
                    <span style={styles.ingredientPrep}>, {ing.preparation}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Instructions */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Instructions</h2>
          <ol style={styles.instructionList}>
            {recipe.instructions.map((step) => (
              <li key={step.stepNumber} style={styles.instructionItem}>
                <span style={styles.stepNumber}>{step.stepNumber}</span>
                <span style={styles.stepText}>{step.text}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Check-in form */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Check In</h2>
          <div style={styles.checkinForm}>
            <div style={styles.checkinRatingRow}>
              <label style={styles.checkinLabel}>Enjoyment</label>
              <StarInput value={enjoymentRating} onChange={setEnjoymentRating} />
            </div>
            <div style={styles.checkinRatingRow}>
              <label style={styles.checkinLabel}>Instructions</label>
              <StarInput value={instructionRating} onChange={setInstructionRating} />
            </div>
            <textarea
              className="edit-textarea"
              placeholder="Notes (optional)"
              rows={3}
              value={checkinNotes}
              onChange={(e) => setCheckinNotes(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
            <button
              onClick={handleCheckin}
              className="btn-primary"
              style={{ fontSize: '0.875rem', padding: '0.625rem 1.25rem', marginTop: '0.5rem' }}
              disabled={submittingCheckin}
            >
              {submittingCheckin ? 'Submitting...' : 'Submit Check-In'}
            </button>
          </div>
        </section>

        {/* Recent check-ins */}
        {recipe.recentCheckins.length > 0 && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Recent Check-Ins</h2>
            {recipe.recentCheckins.map((ch) => (
              <div key={ch.id} style={styles.checkinItem}>
                <div style={styles.checkinHeader}>
                  <strong>{ch.userName || 'Anonymous'}</strong>
                  <span style={styles.checkinDate}>
                    {new Date(ch.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div style={styles.checkinRatings}>
                  <span>Enjoyment: <StarDisplay rating={ch.enjoymentRating} /></span>
                  <span>Instructions: <StarDisplay rating={ch.instructionRating} /></span>
                </div>
                {ch.notes && <p style={styles.checkinNotes}>{ch.notes}</p>}
                {session && ch.userName === session.user.name && (
                  <button
                    onClick={() => handleDeleteCheckin(ch.id)}
                    style={styles.deleteCheckinBtn}
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </section>
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
    padding: '2rem',
    borderRadius: radius.lg,
    boxShadow: shadows.md,
    border: `1px solid ${colors.borderLight}`,
    maxWidth: '700px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  title: {
    margin: 0,
    fontSize: '1.75rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    marginBottom: '0.75rem',
  },
  meta: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '1rem',
    fontSize: '0.875rem',
    color: colors.textSecondary,
    marginBottom: '1rem',
  },
  ratingsCard: {
    background: colors.warmBg,
    padding: '1rem 1.25rem',
    borderRadius: radius.md,
    marginBottom: '1.25rem',
    display: 'flex',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
    gap: '1rem',
  },
  ratingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  ratingLabel: {
    fontSize: '0.8125rem',
    color: colors.textSecondary,
    fontWeight: 600,
  },
  ratingValue: {
    fontSize: '0.8125rem',
    color: colors.text,
    fontWeight: 600,
  },
  checkinCount: {
    fontSize: '0.75rem',
    color: colors.textMuted,
    marginLeft: 'auto',
  },
  description: {
    color: colors.text,
    lineHeight: 1.6,
    marginBottom: '1rem',
    fontSize: '1.0625rem',
  },
  creatorText: {
    fontSize: '0.875rem',
    color: colors.textSecondary,
    marginBottom: '1.5rem',
  },
  section: {
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontSize: '1.125rem',
    fontWeight: 700,
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: `1px solid ${colors.border}`,
  },
  ingredientList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  ingredientItem: {
    display: 'flex',
    gap: '1rem',
    padding: '0.5rem 0',
    borderBottom: `1px solid ${colors.borderLight}`,
  },
  ingredientQty: {
    minWidth: '80px',
    color: colors.textSecondary,
    fontSize: '0.875rem',
  },
  ingredientName: {
    fontWeight: 500,
  },
  ingredientPrep: {
    fontWeight: 400,
    color: colors.textSecondary,
  },
  instructionList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  instructionItem: {
    display: 'flex',
    gap: '1rem',
    padding: '1rem 0',
    borderBottom: `1px solid ${colors.borderLight}`,
  },
  stepNumber: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: colors.primary,
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.875rem',
    fontWeight: 600,
    flexShrink: 0,
  },
  stepText: {
    lineHeight: 1.6,
    paddingTop: '0.25rem',
  },
  checkinForm: {
    background: colors.warmBg,
    padding: '1.25rem',
    borderRadius: radius.md,
  },
  checkinRatingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '0.75rem',
  },
  checkinLabel: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: colors.text,
    minWidth: '90px',
  },
  checkinItem: {
    padding: '1rem 0',
    borderBottom: `1px solid ${colors.borderLight}`,
  },
  checkinHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
  },
  checkinDate: {
    color: colors.textMuted,
    fontSize: '0.75rem',
  },
  checkinRatings: {
    display: 'flex',
    gap: '1.5rem',
    fontSize: '0.8125rem',
    color: colors.textSecondary,
    marginBottom: '0.5rem',
  },
  checkinNotes: {
    fontSize: '0.875rem',
    color: colors.text,
    lineHeight: 1.5,
    margin: '0.5rem 0 0',
  },
  deleteCheckinBtn: {
    background: 'none',
    border: 'none',
    color: colors.danger,
    cursor: 'pointer',
    fontSize: '0.75rem',
    padding: '0.25rem 0',
    marginTop: '0.25rem',
  },
}
