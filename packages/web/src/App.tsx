import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { useSession } from './lib/auth'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Household from './pages/Household'
import Recipes from './pages/Recipes'
import CreateRecipe from './pages/CreateRecipe'
import RecipeDetail from './pages/RecipeDetail'
import GroceryLists from './pages/GroceryLists'
import CreateGroceryList from './pages/CreateGroceryList'
import GroceryListDetail from './pages/GroceryListDetail'
import MealPlan from './pages/MealPlan'
import ChatRecipe from './pages/ChatRecipe'
import RecipeLists from './pages/RecipeLists'
import RecipeListDetail from './pages/RecipeListDetail'

function Home() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return <div style={styles.loading}>Loading...</div>
  }

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <h1 style={styles.logo}>Easy Meal</h1>
        <div style={styles.navLinks}>
          {session ? (
            <>
              <Link to="/recipes" style={styles.navLink}>
                Recipes
              </Link>
              <Link to="/meal-plan" style={styles.navLink}>
                Meal Plan
              </Link>
              <Link to="/grocery-lists" style={styles.navLink}>
                Groceries
              </Link>
              <Link to="/household" style={styles.navLink}>
                Household
              </Link>
              <Link to="/profile" style={styles.navLink}>
                {session.user.name || session.user.email}
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.navLink}>
                Sign In
              </Link>
              <Link to="/register" style={styles.navLinkPrimary}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      <main style={styles.main}>
        <h2 style={styles.headline}>Streamline Your Meal Prep</h2>
        <p style={styles.subheadline}>
          Generate recipes with AI, organize your favorites, and create grocery lists
          automatically.
        </p>

        {session ? (
          <div style={styles.dashboard}>
            <p style={styles.welcomeText}>Welcome back, {session.user.name}!</p>
            <div style={styles.actions}>
              <Link to="/recipes/create" className="btn-primary" style={{ textDecoration: 'none', fontSize: '1rem', padding: '0.75rem 1.5rem' }}>
                Recipe Wizard
              </Link>
              <Link to="/recipes/chat" className="btn-primary" style={{ textDecoration: 'none', fontSize: '1rem', padding: '0.75rem 1.5rem' }}>
                Chat with AI
              </Link>
            </div>
            <div style={{ ...styles.actions, marginTop: '0.75rem' }}>
              <Link to="/meal-plan" className="btn-secondary" style={{ textDecoration: 'none', fontSize: '1rem', padding: '0.75rem 1.5rem' }}>
                Meal Plan
              </Link>
              <Link to="/recipes" className="btn-secondary" style={{ textDecoration: 'none', fontSize: '1rem', padding: '0.75rem 1.5rem' }}>
                Browse Recipes
              </Link>
            </div>
          </div>
        ) : (
          <div style={styles.cta}>
            <Link to="/register" style={styles.ctaButton}>
              Start Free
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return <div style={styles.loading}>Loading...</div>
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/household"
          element={
            <ProtectedRoute>
              <Household />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recipes"
          element={
            <ProtectedRoute>
              <Recipes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recipes/create"
          element={
            <ProtectedRoute>
              <CreateRecipe />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recipes/chat"
          element={
            <ProtectedRoute>
              <ChatRecipe />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recipes/:id"
          element={
            <ProtectedRoute>
              <RecipeDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/grocery-lists"
          element={
            <ProtectedRoute>
              <GroceryLists />
            </ProtectedRoute>
          }
        />
        <Route
          path="/grocery-lists/create"
          element={
            <ProtectedRoute>
              <CreateGroceryList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/grocery-lists/:id"
          element={
            <ProtectedRoute>
              <GroceryListDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recipe-lists"
          element={
            <ProtectedRoute>
              <RecipeLists />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recipe-lists/:id"
          element={
            <ProtectedRoute>
              <RecipeListDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/meal-plan"
          element={
            <ProtectedRoute>
              <MealPlan />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

const styles: Record<string, React.CSSProperties> = {
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    fontFamily: 'system-ui, sans-serif',
  },
  container: {
    minHeight: '100vh',
    fontFamily: 'system-ui, sans-serif',
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    borderBottom: '1px solid #E8DDD4',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  logo: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#2D2420',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  navLink: {
    color: '#2D2420',
    textDecoration: 'none',
    fontSize: '0.875rem',
  },
  navLinkPrimary: {
    background: '#E07A5F',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    textDecoration: 'none',
    fontSize: '0.875rem',
  },
  main: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '4rem 2rem',
    textAlign: 'center',
  },
  headline: {
    fontSize: '2.5rem',
    fontWeight: 700,
    marginBottom: '1rem',
    color: '#2D2420',
  },
  subheadline: {
    fontSize: '1.25rem',
    color: '#7A6B60',
    marginBottom: '2rem',
    lineHeight: 1.6,
  },
  dashboard: {
    background: '#FAF6F2',
    padding: '2rem',
    borderRadius: '12px',
  },
  welcomeText: {
    fontSize: '1.125rem',
    marginBottom: '1.5rem',
    color: '#2D2420',
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
  },
  actionButton: {
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    border: 'none',
    background: '#E07A5F',
    color: 'white',
    fontSize: '1rem',
    cursor: 'pointer',
    textDecoration: 'none',
  },
  actionButtonSecondary: {
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    border: '1px solid #E8DDD4',
    background: 'white',
    color: '#2D2420',
    fontSize: '1rem',
    cursor: 'pointer',
    textDecoration: 'none',
  },
  cta: {
    marginTop: '2rem',
  },
  ctaButton: {
    display: 'inline-block',
    padding: '1rem 2rem',
    borderRadius: '8px',
    background: '#E07A5F',
    color: 'white',
    textDecoration: 'none',
    fontSize: '1.125rem',
    fontWeight: 500,
  },
}
