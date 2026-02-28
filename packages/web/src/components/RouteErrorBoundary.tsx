import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { colors, radius, shadows } from '../lib/theme'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('RouteErrorBoundary caught:', error, info.componentStack)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.icon}>⚠️</div>
          <h2 style={styles.title}>Something went wrong</h2>
          <p style={styles.message}>
            This page ran into an unexpected error. You can try reloading it or head back home.
          </p>
          {this.state.error && (
            <pre style={styles.detail}>{this.state.error.message}</pre>
          )}
          <div style={styles.actions}>
            <button onClick={this.handleRetry} className="btn-primary" style={styles.btn}>
              Try Again
            </button>
            <a href="/" className="btn-secondary" style={styles.btn}>
              Go Home
            </a>
          </div>
        </div>
      </div>
    )
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    padding: '2rem',
  },
  card: {
    background: 'white',
    borderRadius: radius.lg,
    boxShadow: shadows.md,
    border: `1px solid ${colors.borderLight}`,
    padding: '3rem',
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center' as const,
  },
  icon: {
    fontSize: '3rem',
    marginBottom: '1rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: colors.text,
    marginBottom: '0.75rem',
  },
  message: {
    color: colors.textSecondary,
    lineHeight: 1.6,
    marginBottom: '1.5rem',
  },
  detail: {
    background: colors.warmBg,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    padding: '0.75rem 1rem',
    fontSize: '0.8125rem',
    color: colors.danger,
    textAlign: 'left' as const,
    overflowX: 'auto' as const,
    marginBottom: '1.5rem',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
  },
  actions: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'center',
  },
  btn: {
    padding: '0.75rem 1.5rem',
    borderRadius: radius.md,
    fontSize: '0.9375rem',
    textDecoration: 'none',
    cursor: 'pointer',
  },
}
