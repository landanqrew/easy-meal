import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../lib/auth'
import { colors, shadows, radius } from '../lib/theme'
import { apiFetch, apiPost, queryKeys } from '../lib/api'
import { useQuery, useQueryClient } from '@tanstack/react-query'

type HouseholdMember = {
  id: string
  name: string
  email: string
  image: string | null
}

type Household = {
  id: string
  name: string
  inviteCode: string
  createdAt: string
  members: HouseholdMember[]
}

export default function HouseholdPage() {
  const navigate = useNavigate()
  const { data: session, isPending } = useSession()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [householdName, setHouseholdName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data: household = null, isLoading, error: queryError } = useQuery({
    queryKey: queryKeys.household,
    queryFn: () => apiFetch<Household | null>('/api/households/me'),
    enabled: !!session,
  })

  useEffect(() => {
    if (!isPending && !session) {
      navigate('/login')
    }
  }, [session, isPending, navigate])

  useEffect(() => {
    if (queryError) {
      setError((queryError as Error).message || 'Failed to load household')
    }
  }, [queryError])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await apiPost('/api/households', { name: householdName })
      setMessage('Household created!')
      setShowCreateForm(false)
      setHouseholdName('')
      queryClient.invalidateQueries({ queryKey: queryKeys.household })
    } catch (err) {
      setError((err as Error).message || 'Failed to create household')
    } finally {
      setSubmitting(false)
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await apiPost('/api/households/join', { inviteCode })
      setMessage('Joined household!')
      setShowJoinForm(false)
      setInviteCode('')
      queryClient.invalidateQueries({ queryKey: queryKeys.household })
    } catch (err) {
      setError((err as Error).message || 'Failed to join household')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this household?')) return

    setError('')
    try {
      await apiPost('/api/households/leave', {})
      setMessage('Left household')
      queryClient.invalidateQueries({ queryKey: queryKeys.household })
    } catch (err) {
      setError((err as Error).message || 'Failed to leave household')
    }
  }

  const handleRegenerateCode = async () => {
    setError('')
    try {
      await apiPost('/api/households/regenerate-code', {})
      setMessage('Invite code regenerated')
      queryClient.invalidateQueries({ queryKey: queryKeys.household })
    } catch (err) {
      setError((err as Error).message || 'Failed to regenerate code')
    }
  }

  const copyInviteCode = () => {
    if (household?.inviteCode) {
      navigator.clipboard.writeText(household.inviteCode)
      setMessage('Invite code copied!')
      setTimeout(() => setMessage(''), 2000)
    }
  }

  if (isPending || isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div className="skeleton" style={{ width: '110px', height: '1.5rem' }} />
            <div className="skeleton" style={{ width: '55px', height: '36px', borderRadius: '6px' }} />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="skeleton" style={{ width: '50%', height: '1.25rem', marginBottom: '0.25rem' }} />
            <div className="skeleton" style={{ width: '80px', height: '0.875rem' }} />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="skeleton" style={{ width: '80px', height: '0.875rem', marginBottom: '0.5rem' }} />
            <div className="skeleton" style={{ width: '100%', height: '56px', borderRadius: '8px' }} />
          </div>
          <div>
            <div className="skeleton" style={{ width: '70px', height: '0.875rem', marginBottom: '0.5rem' }} />
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', borderBottom: `1px solid ${colors.border}` }}>
                <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                <div>
                  <div className="skeleton" style={{ width: '100px', height: '0.9375rem', marginBottom: '0.25rem' }} />
                  <div className="skeleton" style={{ width: '140px', height: '0.75rem' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Household</h1>
          <button onClick={() => navigate('/')} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
            Back
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        {household ? (
          // Show household details
          <div>
            <div style={styles.section}>
              <h2 style={styles.householdName}>{household.name}</h2>
              <p style={styles.memberCount}>
                {household.members.length} member
                {household.members.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Invite Code</h3>
              <div style={styles.inviteCodeBox}>
                <code style={styles.inviteCode}>{household.inviteCode}</code>
                <div style={styles.inviteActions}>
                  <button onClick={copyInviteCode} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}>
                    Copy
                  </button>
                  <button onClick={handleRegenerateCode} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}>
                    Regenerate
                  </button>
                </div>
              </div>
              <p style={styles.hint}>
                Share this code with family members to let them join your household.
              </p>
            </div>

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Members</h3>
              <ul style={styles.memberList}>
                {household.members.map((member) => (
                  <li key={member.id} className="member-item" style={styles.memberItem}>
                    <div style={styles.memberAvatar}>
                      {member.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <div style={styles.memberName}>{member.name}</div>
                      <div style={styles.memberEmail}>{member.email}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <button onClick={handleLeave} className="btn-danger-outline" style={{ width: '100%', padding: '0.75rem', marginTop: '1rem' }}>
              Leave Household
            </button>
          </div>
        ) : (
          // Show create/join options
          <div>
            <p style={styles.description}>
              {'\uD83C\uDFE0'} Create a household to share recipes with family members, or join an
              existing one with an invite code.
            </p>

            {!showCreateForm && !showJoinForm && (
              <div style={styles.options}>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="btn-primary"
                  style={{ padding: '1rem', fontSize: '1rem', width: '100%' }}
                >
                  Create Household
                </button>
                <button
                  onClick={() => setShowJoinForm(true)}
                  className="btn-secondary"
                  style={{ padding: '1rem', fontSize: '1rem', width: '100%' }}
                >
                  Join with Code
                </button>
              </div>
            )}

            {showCreateForm && (
              <form onSubmit={handleCreate} className="form-entrance" style={styles.form}>
                <h3 style={styles.formTitle}>Create Household</h3>
                <div style={styles.field}>
                  <label style={styles.label}>Household Name</label>
                  <input
                    type="text"
                    value={householdName}
                    onChange={(e) => setHouseholdName(e.target.value)}
                    placeholder="e.g., Smith Family"
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formActions}>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="btn-secondary"
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem' }} disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            )}

            {showJoinForm && (
              <form onSubmit={handleJoin} className="form-entrance" style={styles.form}>
                <h3 style={styles.formTitle}>Join Household</h3>
                <div style={styles.field}>
                  <label style={styles.label}>Invite Code</label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="e.g., ABC12345"
                    style={{ ...styles.input, textTransform: 'uppercase', letterSpacing: '2px' }}
                    required
                  />
                </div>
                <div style={styles.formActions}>
                  <button
                    type="button"
                    onClick={() => setShowJoinForm(false)}
                    className="btn-secondary"
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem' }} disabled={submitting}>
                    {submitting ? 'Joining...' : 'Join'}
                  </button>
                </div>
              </form>
            )}
          </div>
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
    maxWidth: '500px',
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
    color: colors.text,
  },
  section: {
    marginBottom: '1.5rem',
  },
  householdName: {
    margin: 0,
    fontSize: '1.375rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: colors.text,
  },
  memberCount: {
    color: colors.textSecondary,
    marginTop: '0.25rem',
  },
  sectionTitle: {
    fontSize: '1.125rem',
    fontWeight: 700,
    color: colors.text,
    marginBottom: '0.5rem',
  },
  inviteCodeBox: {
    background: colors.warmBg,
    padding: '1rem',
    borderRadius: radius.md,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  inviteCode: {
    fontSize: '1.25rem',
    fontWeight: 600,
    letterSpacing: '3px',
    color: colors.text,
  },
  inviteActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  hint: {
    fontSize: '0.75rem',
    color: colors.textSecondary,
    marginTop: '0.5rem',
  },
  memberList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  memberItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 0',
    borderBottom: `1px solid ${colors.border}`,
  },
  memberAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: colors.primaryLight,
    color: colors.primary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
  },
  memberName: {
    fontWeight: 500,
    color: colors.text,
  },
  memberEmail: {
    fontSize: '0.75rem',
    color: colors.textSecondary,
  },
  description: {
    color: colors.textSecondary,
    marginBottom: '1.5rem',
    lineHeight: 1.6,
  },
  options: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  form: {
    background: colors.warmBg,
    padding: '1.5rem',
    borderRadius: radius.md,
  },
  formTitle: {
    margin: '0 0 1rem 0',
    fontSize: '1rem',
    fontWeight: 600,
    color: colors.text,
  },
  field: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: 500,
    marginBottom: '0.25rem',
    color: colors.text,
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    fontSize: '1rem',
    boxSizing: 'border-box',
  },
  formActions: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'flex-end',
  },
}
