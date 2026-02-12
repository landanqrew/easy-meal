import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signUp, signIn } from '../lib/auth'

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
        <h1 style={styles.title}>Create Account</h1>
        <p style={styles.subtitle}>Start your meal planning journey</p>

        {error && <div style={styles.error}>{error}</div>}

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

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerText}>or</span>
        </div>

        <button onClick={handleGoogleSignIn} style={styles.googleButton}>
          Continue with Google
        </button>

        <p style={styles.footer}>
          Already have an account? <Link to="/login">Sign in</Link>
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
    background: '#FDF8F4',
    padding: '1rem',
  },
  card: {
    background: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#2D2420',
  },
  subtitle: {
    color: '#7A6B60',
    marginTop: '0.5rem',
    marginBottom: '1.5rem',
  },
  error: {
    background: '#FDECEA',
    color: '#C44536',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontSize: '0.875rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
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
    fontSize: '0.75rem',
    color: '#A89888',
  },
  button: {
    padding: '0.75rem',
    borderRadius: '6px',
    border: 'none',
    background: '#E07A5F',
    color: 'white',
    fontSize: '1rem',
    fontWeight: 500,
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '1.5rem 0',
    gap: '1rem',
  },
  dividerText: {
    color: '#A89888',
    fontSize: '0.875rem',
    flex: 1,
    textAlign: 'center',
  },
  googleButton: {
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid #E8DDD4',
    background: 'white',
    fontSize: '1rem',
    cursor: 'pointer',
    width: '100%',
  },
  footer: {
    textAlign: 'center',
    marginTop: '1.5rem',
    color: '#7A6B60',
    fontSize: '0.875rem',
  },
}
