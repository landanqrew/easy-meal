import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../lib/auth'

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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function HouseholdPage() {
  const navigate = useNavigate()
  const { data: session, isPending } = useSession()
  const [household, setHousehold] = useState<Household | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [householdName, setHouseholdName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isPending && !session) {
      navigate('/login')
    }
  }, [session, isPending, navigate])

  useEffect(() => {
    if (session) {
      fetchHousehold()
    }
  }, [session])

  const fetchHousehold = async () => {
    try {
      const res = await fetch(`${API_URL}/api/households/me`, {
        credentials: 'include',
      })
      const data = await res.json()
      setHousehold(data.data)
    } catch {
      setError('Failed to load household')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch(`${API_URL}/api/households`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: householdName }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create household')
      } else {
        setMessage('Household created!')
        setShowCreateForm(false)
        setHouseholdName('')
        fetchHousehold()
      }
    } catch {
      setError('Failed to create household')
    } finally {
      setSubmitting(false)
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch(`${API_URL}/api/households/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ inviteCode }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to join household')
      } else {
        setMessage('Joined household!')
        setShowJoinForm(false)
        setInviteCode('')
        fetchHousehold()
      }
    } catch {
      setError('Failed to join household')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this household?')) return

    setError('')
    try {
      const res = await fetch(`${API_URL}/api/households/leave`, {
        method: 'POST',
        credentials: 'include',
      })

      if (res.ok) {
        setMessage('Left household')
        setHousehold(null)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to leave household')
      }
    } catch {
      setError('Failed to leave household')
    }
  }

  const handleRegenerateCode = async () => {
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/households/regenerate-code`, {
        method: 'POST',
        credentials: 'include',
      })

      const data = await res.json()
      if (res.ok) {
        setHousehold((prev) =>
          prev ? { ...prev, inviteCode: data.data.inviteCode } : null
        )
        setMessage('Invite code regenerated')
      } else {
        setError(data.error || 'Failed to regenerate code')
      }
    } catch {
      setError('Failed to regenerate code')
    }
  }

  const copyInviteCode = () => {
    if (household?.inviteCode) {
      navigator.clipboard.writeText(household.inviteCode)
      setMessage('Invite code copied!')
      setTimeout(() => setMessage(''), 2000)
    }
  }

  if (isPending || loading) {
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
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', borderBottom: '1px solid #E8DDD4' }}>
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
          <button onClick={() => navigate('/')} style={styles.backButton}>
            Back
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}
        {message && <div style={styles.success}>{message}</div>}

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
                  <button onClick={copyInviteCode} style={styles.smallButton}>
                    Copy
                  </button>
                  <button onClick={handleRegenerateCode} style={styles.smallButton}>
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
                  <li key={member.id} style={styles.memberItem}>
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

            <button onClick={handleLeave} style={styles.leaveButton}>
              Leave Household
            </button>
          </div>
        ) : (
          // Show create/join options
          <div>
            <p style={styles.description}>
              Create a household to share recipes with family members, or join an
              existing one with an invite code.
            </p>

            {!showCreateForm && !showJoinForm && (
              <div style={styles.options}>
                <button
                  onClick={() => setShowCreateForm(true)}
                  style={styles.optionButton}
                >
                  Create Household
                </button>
                <button
                  onClick={() => setShowJoinForm(true)}
                  style={styles.optionButtonSecondary}
                >
                  Join with Code
                </button>
              </div>
            )}

            {showCreateForm && (
              <form onSubmit={handleCreate} style={styles.form}>
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
                    style={styles.cancelButton}
                  >
                    Cancel
                  </button>
                  <button type="submit" style={styles.submitButton} disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            )}

            {showJoinForm && (
              <form onSubmit={handleJoin} style={styles.form}>
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
                    style={styles.cancelButton}
                  >
                    Cancel
                  </button>
                  <button type="submit" style={styles.submitButton} disabled={submitting}>
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
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
  },
  container: {
    minHeight: '100vh',
    background: '#FDF8F4',
    padding: '2rem 1rem',
  },
  card: {
    background: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#2D2420',
  },
  backButton: {
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: '1px solid #E8DDD4',
    background: 'white',
    cursor: 'pointer',
  },
  error: {
    background: '#FDECEA',
    color: '#C44536',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontSize: '0.875rem',
  },
  success: {
    background: '#EDF5EC',
    color: '#5B8C5A',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontSize: '0.875rem',
  },
  section: {
    marginBottom: '1.5rem',
  },
  householdName: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#2D2420',
  },
  memberCount: {
    color: '#7A6B60',
    marginTop: '0.25rem',
  },
  sectionTitle: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#2D2420',
    marginBottom: '0.5rem',
  },
  inviteCodeBox: {
    background: '#FAF6F2',
    padding: '1rem',
    borderRadius: '8px',
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
    color: '#2D2420',
  },
  inviteActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  smallButton: {
    padding: '0.375rem 0.75rem',
    borderRadius: '4px',
    border: '1px solid #E8DDD4',
    background: 'white',
    cursor: 'pointer',
    fontSize: '0.75rem',
  },
  hint: {
    fontSize: '0.75rem',
    color: '#7A6B60',
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
    borderBottom: '1px solid #E8DDD4',
  },
  memberAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: '#E07A5F',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
  },
  memberName: {
    fontWeight: 500,
    color: '#2D2420',
  },
  memberEmail: {
    fontSize: '0.75rem',
    color: '#7A6B60',
  },
  leaveButton: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid #C44536',
    background: 'white',
    color: '#C44536',
    cursor: 'pointer',
    marginTop: '1rem',
  },
  description: {
    color: '#7A6B60',
    marginBottom: '1.5rem',
    lineHeight: 1.6,
  },
  options: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  optionButton: {
    padding: '1rem',
    borderRadius: '8px',
    border: 'none',
    background: '#E07A5F',
    color: 'white',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  optionButtonSecondary: {
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #E8DDD4',
    background: 'white',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  form: {
    background: '#FAF6F2',
    padding: '1.5rem',
    borderRadius: '8px',
  },
  formTitle: {
    margin: '0 0 1rem 0',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#2D2420',
  },
  field: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: 500,
    marginBottom: '0.25rem',
    color: '#2D2420',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid #E8DDD4',
    fontSize: '1rem',
    boxSizing: 'border-box',
  },
  formActions: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: '1px solid #E8DDD4',
    background: 'white',
    cursor: 'pointer',
  },
  submitButton: {
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: 'none',
    background: '#E07A5F',
    color: 'white',
    cursor: 'pointer',
  },
}
