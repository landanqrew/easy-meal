import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession, signOut } from '../lib/auth'
import type { DietaryRestriction } from '@easy-meal/shared'

const DIETARY_OPTIONS: DietaryRestriction[] = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'nut-free',
  'keto',
  'low-sodium',
  'halal',
  'kosher',
]

export default function Profile() {
  const navigate = useNavigate()
  const { data: session, isPending } = useSession()
  const [name, setName] = useState('')
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!isPending && !session) {
      navigate('/login')
    }
    if (session?.user) {
      setName(session.user.name || '')
      // Parse dietary restrictions from JSON string
      try {
        const restrictions = JSON.parse(
          (session.user as any).dietaryRestrictions || '[]'
        )
        setDietaryRestrictions(Array.isArray(restrictions) ? restrictions : [])
      } catch {
        setDietaryRestrictions([])
      }
    }
  }, [session, isPending, navigate])

  const handleToggleRestriction = (restriction: string) => {
    setDietaryRestrictions((prev) =>
      prev.includes(restriction)
        ? prev.filter((r) => r !== restriction)
        : [...prev, restriction]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/users/me`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name,
            dietaryRestrictions,
          }),
        }
      )

      if (res.ok) {
        setMessage('Profile updated successfully')
      } else {
        const data = await res.json()
        setMessage(data.error || 'Failed to update profile')
      }
    } catch {
      setMessage('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  if (isPending) {
    return <div style={styles.loading}>Loading...</div>
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Profile</h1>
          <button onClick={handleSignOut} style={styles.signOutButton}>
            Sign Out
          </button>
        </div>

        {message && (
          <div
            style={{
              ...styles.message,
              background: message.includes('success') ? '#EDF5EC' : '#FDECEA',
              color: message.includes('success') ? '#5B8C5A' : '#C44536',
            }}
          >
            {message}
          </div>
        )}

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Account</h2>

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={session?.user?.email || ''}
              disabled
              style={{ ...styles.input, background: '#FAF6F2' }}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Dietary Restrictions</h2>
          <p style={styles.hint}>
            Select any dietary restrictions. These will be applied to AI-generated
            recipes.
          </p>

          <div style={styles.chips}>
            {DIETARY_OPTIONS.map((restriction) => (
              <button
                key={restriction}
                onClick={() => handleToggleRestriction(restriction)}
                style={{
                  ...styles.chip,
                  ...(dietaryRestrictions.includes(restriction)
                    ? styles.chipSelected
                    : {}),
                }}
              >
                {restriction}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleSave} style={styles.saveButton} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#FDF8F4',
    padding: '2rem 1rem',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
  },
  card: {
    background: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    maxWidth: '600px',
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
  signOutButton: {
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: '1px solid #E8DDD4',
    background: 'white',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  message: {
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontSize: '0.875rem',
  },
  section: {
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    marginBottom: '1rem',
    color: '#2D2420',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    marginBottom: '1rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#2D2420',
  },
  input: {
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid #E8DDD4',
    fontSize: '1rem',
  },
  hint: {
    fontSize: '0.875rem',
    color: '#7A6B60',
    marginBottom: '1rem',
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  chip: {
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    border: '1px solid #E8DDD4',
    background: 'white',
    cursor: 'pointer',
    fontSize: '0.875rem',
    textTransform: 'capitalize',
  },
  chipSelected: {
    background: '#E07A5F',
    color: 'white',
    borderColor: '#E07A5F',
  },
  saveButton: {
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    border: 'none',
    background: '#E07A5F',
    color: 'white',
    fontSize: '1rem',
    fontWeight: 500,
    cursor: 'pointer',
    width: '100%',
  },
}
