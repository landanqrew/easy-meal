import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useSession } from '../lib/auth'
import { colors, shadows, radius } from '../lib/theme'
import type { GeneratedRecipe } from '@easy-meal/shared'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatRecipe() {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: session, isPending } = useSession()
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "What are you in the mood to eat? Describe anything — a craving, an ingredient you have on hand, or a vibe like \"something cozy and warm.\"" },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isPending && !session) {
      navigate('/login')
    }
  }, [session, isPending, navigate])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    const userMessage: ChatMessage = { role: 'user', content: trimmed }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)
    setError('')

    try {
      // Only send user/assistant messages (skip the initial greeting for the API)
      const apiMessages = updatedMessages.filter((_, i) => i > 0)

      const res = await fetch(`${API_URL}/api/chat/recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ messages: apiMessages }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        return
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.data.message,
      }
      setMessages((prev) => [...prev, assistantMessage])

      if (data.data.recipe) {
        setRecipe(data.data.recipe)
      }
    } catch {
      setError('Failed to send message')
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleSave = async () => {
    if (!recipe) return
    setError('')
    setSaving(true)

    try {
      const res = await fetch(`${API_URL}/api/recipes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: recipe.title,
          description: recipe.description,
          servings: recipe.servings,
          prepTime: recipe.prepTime,
          cookTime: recipe.cookTime,
          cuisine: recipe.cuisine,
          instructions: recipe.instructions,
          ingredients: recipe.ingredients,
          source: 'ai_generated',
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to save recipe')
      } else {
        navigate(returnTo || `/recipes/${data.data.id}`)
      }
    } catch {
      setError('Failed to save recipe')
    } finally {
      setSaving(false)
    }
  }

  const handleTryAgain = () => {
    setRecipe(null)
    const retryMessage: ChatMessage = {
      role: 'user',
      content: "That's not quite what I had in mind. Can you try a different recipe?",
    }
    setMessages((prev) => [...prev, retryMessage])
    setLoading(true)
    setError('')

    const apiMessages = [...messages, retryMessage].filter((_, i) => i > 0)

    fetch(`${API_URL}/api/chat/recipe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ messages: apiMessages }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setMessages((prev) => [...prev, { role: 'assistant', content: data.data.message }])
          if (data.data.recipe) setRecipe(data.data.recipe)
        }
      })
      .catch(() => setError('Failed to send message'))
      .finally(() => setLoading(false))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (isPending) {
    return (
      <div style={styles.page}>
        <div className="chat-container">
          <div style={styles.header}>
            <div className="skeleton" style={{ width: '60px', height: '0.875rem' }} />
            <div className="skeleton" style={{ width: '100px', height: '1.125rem' }} />
            <div style={{ width: '48px' }} />
          </div>
          <div className="chat-messages">
            <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
              <div className="skeleton" style={{ width: '260px', height: '52px', borderRadius: '16px' }} />
            </div>
            <div style={{ alignSelf: 'flex-end', maxWidth: '85%' }}>
              <div className="skeleton" style={{ width: '180px', height: '42px', borderRadius: '16px' }} />
            </div>
          </div>
          <div className="chat-input-area">
            <div className="skeleton" style={{ flex: 1, height: '44px', borderRadius: '24px' }} />
            <div className="skeleton" style={{ width: '44px', height: '44px', borderRadius: '50%' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div className="chat-container">
        {/* Header */}
        <div style={styles.header}>
          <Link to={returnTo || '/recipes'} className="back-link">← Back</Link>
          <h1 style={styles.title}>Chat Recipe</h1>
          <div style={{ width: '48px' }} />
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-bubble ${msg.role === 'user' ? 'user' : 'assistant'}`}>
              {msg.content}
            </div>
          ))}

          {loading && (
            <div className="typing-indicator">
              <span /><span /><span />
            </div>
          )}

          {/* Recipe preview card */}
          {recipe && !loading && (
            <div style={styles.recipeCard}>
              <h3 style={styles.recipeName}>{recipe.title}</h3>
              <div style={styles.recipeMeta}>
                <span>{recipe.prepTime}m prep</span>
                <span>{recipe.cookTime}m cook</span>
                <span>{recipe.servings} servings</span>
                {recipe.cuisine && <span>{recipe.cuisine}</span>}
              </div>
              <p style={styles.recipeDesc}>{recipe.description}</p>

              <details style={styles.details}>
                <summary style={styles.detailsSummary}>
                  Ingredients ({recipe.ingredients.length})
                </summary>
                <ul style={styles.ingredientList}>
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i}>
                      {ing.quantity} {ing.unit} {ing.name}
                      {ing.preparation && `, ${ing.preparation}`}
                    </li>
                  ))}
                </ul>
              </details>

              <details style={styles.details}>
                <summary style={styles.detailsSummary}>
                  Instructions ({recipe.instructions.length} steps)
                </summary>
                <ol style={styles.instructionList}>
                  {recipe.instructions.map((step) => (
                    <li key={step.stepNumber} style={styles.instructionItem}>
                      {step.text}
                    </li>
                  ))}
                </ol>
              </details>

              <div style={styles.recipeActions}>
                <button onClick={handleTryAgain} className="btn-secondary" style={{ flex: 1 }}>
                  Try Different
                </button>
                <button onClick={handleSave} className="btn-primary" style={{ flex: 1, background: colors.success }} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Recipe'}
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {error && <div className="error-message" style={{ marginBottom: '0.5rem' }}>{error}</div>}

        {/* Input area */}
        {!recipe && (
          <div className="chat-input-area">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you're craving..."
              disabled={loading}
              autoFocus
            />
            <button onClick={handleSend} disabled={loading || !input.trim()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        )}

        {/* Post-save input to continue chatting */}
        {recipe && (
          <div className="chat-input-area">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask for modifications or a different recipe..."
              disabled={loading}
            />
            <button
              onClick={() => {
                setRecipe(null)
                handleSend()
              }}
              disabled={loading || !input.trim()}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: colors.bg,
    paddingTop: '3.5rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '0.75rem',
    borderBottom: `1px solid ${colors.border}`,
  },
  title: {
    margin: 0,
    fontSize: '1.125rem',
    fontWeight: 600,
    color: colors.text,
  },
  recipeCard: {
    background: 'white',
    borderRadius: radius.lg,
    padding: '1.25rem',
    boxShadow: shadows.md,
    border: `1px solid ${colors.border}`,
    alignSelf: 'stretch',
  },
  recipeName: {
    margin: '0 0 0.5rem',
    fontSize: '1.375rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: colors.text,
  },
  recipeMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
    fontSize: '0.8125rem',
    color: colors.textSecondary,
    marginBottom: '0.75rem',
  },
  recipeDesc: {
    color: colors.text,
    lineHeight: 1.5,
    fontSize: '0.9375rem',
    marginBottom: '1rem',
  },
  details: {
    marginBottom: '0.5rem',
  },
  detailsSummary: {
    cursor: 'pointer',
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    padding: '0.5rem 0',
    borderTop: `1px solid ${colors.borderLight}`,
  },
  ingredientList: {
    listStyle: 'disc',
    paddingLeft: '1.25rem',
    margin: '0.5rem 0',
    fontSize: '0.875rem',
    lineHeight: 1.6,
  },
  instructionList: {
    paddingLeft: '1.25rem',
    margin: '0.5rem 0',
    fontSize: '0.875rem',
  },
  instructionItem: {
    marginBottom: '0.5rem',
    lineHeight: 1.5,
  },
  recipeActions: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: `1px solid ${colors.borderLight}`,
  },
}
