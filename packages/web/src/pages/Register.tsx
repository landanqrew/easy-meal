import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signUp, signIn } from '../lib/auth'
import { colors, radius } from '../lib/theme'

export default function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signUp.email({ name, email, password })
      console.log('SignUp result:', result)
      if (result.error) {
        setError(result.error.message || 'Registration failed')
      } else {
        navigate('/')
      }
    } catch (err: any) {
      console.error('SignUp error:', err)
      setError(err?.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    try {
      await signIn.social({ provider: 'google', callbackURL: '/' })
    } catch (err) {
      setError('Google sign in failed')
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <span style={{ fontSize: '2rem' }}>🥘</span>
        </div>
        <h1 style={styles.title}>Create Account</h1>
        <p style={styles.subtitle}>Start your meal planning journey</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              minLength={8}
              required
            />
            <span style={styles.hint}>At least 8 characters</span>
          </div>

          <button type="submit" className="btn-primary" style={styles.submitBtn} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <div style={styles.dividerLine} />
        </div>

        <button onClick={handleGoogleSignIn} className="btn-secondary" style={styles.googleBtn}>
          Continue with Google
        </button>

        <p style={styles.footer}>
          Already have an account? <Link to="/login" style={{ color: colors.primary, fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: colors.bg,
    padding: '1rem',
  },
  card: {
    background: 'white',
    padding: '2.5rem 2rem',
    borderRadius: radius.lg,
    boxShadow: '0 4px 16px rgba(184, 165, 150, 0.15), 0 1px 3px rgba(184, 165, 150, 0.1)',
    border: `1px solid ${colors.borderLight}`,
    width: '100%',
    maxWidth: '420px',
  },
  logoRow: {
    textAlign: 'center',
    marginBottom: '0.75rem',
  },
  title: {
    margin: 0,
    fontSize: '1.75rem',
    fontWeight: 700,
    color: colors.text,
    letterSpacing: '-0.02em',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: '0.375rem',
    marginBottom: '1.75rem',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: colors.text,
  },
  input: {
    padding: '0.75rem',
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    fontSize: '1rem',
    background: 'white',
  },
  hint: {
    fontSize: '0.75rem',
    color: colors.textMuted,
  },
  submitBtn: {
    width: '100%',
    padding: '0.875rem',
    fontSize: '1rem',
    marginTop: '0.5rem',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '1.5rem 0',
    gap: '0.75rem',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: colors.borderLight,
  },
  dividerText: {
    color: colors.textMuted,
    fontSize: '0.8125rem',
    fontWeight: 500,
  },
  googleBtn: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '1rem',
  },
  footer: {
    textAlign: 'center',
    marginTop: '1.5rem',
    color: colors.textSecondary,
    fontSize: '0.875rem',
  },
}
