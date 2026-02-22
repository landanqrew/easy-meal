import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { useSession } from './lib/auth'
import { colors, radius, shadows } from './lib/theme'
import NavBar from './components/NavBar'
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
        <div style={styles.navContainer}>
          <Link to="/" style={{ textDecoration: 'none', ...styles.logoContainer }}>
            <span style={styles.logoIcon}>🥘</span>
            <h1 style={styles.logo}>Easy Meal</h1>
          </Link>

          {session && (
            <div className="home-center-links">
              <Link to="/recipes" className="home-nav-link">Recipes</Link>
              <Link to="/meal-plan" className="home-nav-link">Meal Plan</Link>
              <Link to="/grocery-lists" className="home-nav-link">Groceries</Link>
              <Link to="/household" className="home-nav-link">Household</Link>
            </div>
          )}

          <div style={styles.rightActions}>
            {session ? (
              <Link to="/profile" className="profile-pill">
                <div style={styles.avatar}>
                  {(session.user.name || session.user.email || '?').charAt(0).toUpperCase()}
                </div>
                <span style={styles.profileName}>
                  {session.user.name?.split(' ')[0] || session.user.email?.split('@')[0] || 'Profile'}
                </span>
              </Link>
            ) : (
              <>
                <Link to="/login" className="home-nav-link" style={{ fontWeight: 600 }}>
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary" style={{ padding: '0.625rem 1.25rem', borderRadius: '9999px', fontSize: '0.9375rem', textDecoration: 'none' }}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main style={styles.main}>
        <div style={styles.hero}>
          <div style={styles.heroText}>
            <div style={styles.pillBadge}>✨ AI-Powered Meal Planning</div>
            <h2 style={styles.headline}>
              Your Weekly Meals, <br />
              <span style={styles.headlineHighlight}>Sorted & Simple.</span>
            </h2>
            <p style={styles.subheadline}>
              Take the stress out of dinner time. Generate recipes with AI, 
              organize your family favorites, and create grocery lists automatically.
            </p>

            {session ? (
              <div style={styles.dashboardActions}>
                <p style={styles.welcomeText}>Welcome back, <strong>{session.user.name || 'Chef'}</strong>!</p>
                <div style={styles.btnGroup}>
                  <Link to="/recipes/create" className="btn-primary" style={styles.largeBtn}>
                    Recipe Wizard
                  </Link>
                  <Link to="/meal-plan" className="btn-secondary" style={styles.largeBtn}>
                    View Meal Plan
                  </Link>
                </div>
              </div>
            ) : (
              <div style={styles.ctaGroup}>
                <Link to="/register" className="btn-primary" style={styles.largeBtn}>
                  Start for Free
                </Link>
                <Link to="/login" className="btn-secondary" style={styles.largeBtn}>
                  I have an account
                </Link>
              </div>
            )}
          </div>
          
          <div style={styles.heroVisual}>
            <div style={styles.visualCircle1}>🥗</div>
            <div style={styles.visualCircle2}>🥐</div>
            <div style={styles.visualCircle3}>🥑</div>
            <div style={styles.visualCard}>
              <div style={{fontWeight: 700, marginBottom: '0.75rem', fontSize: '1rem', color: colors.text}}>This Week's Plan</div>
              <div style={styles.visualCardRow}><span style={styles.dot}></span> Tuscan Chicken</div>
              <div style={styles.visualCardRow}><span style={styles.dot}></span> Roasted Veggies</div>
              <div style={styles.visualCardRow}><span style={styles.dot}></span> Honey Glazed Salmon</div>
            </div>
          </div>
        </div>

        <div style={styles.featuresSection}>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🤖</div>
            <h3 style={styles.featureTitle}>AI Recipe Wizard</h3>
            <p style={styles.featureText}>Got random ingredients? Let our AI suggest the perfect recipe for your family.</p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>📅</div>
            <h3 style={styles.featureTitle}>Smart Meal Plans</h3>
            <p style={styles.featureText}>Plan your entire week in minutes and share it with your household effortlessly.</p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🛒</div>
            <h3 style={styles.featureTitle}>Auto Groceries</h3>
            <p style={styles.featureText}>Turn your meal plan into an organized grocery list with a single click.</p>
          </div>
        </div>
      </main>

      <footer style={styles.footer}>
        <p>© {new Date().getFullYear()} Easy Meal. Designed for enjoyable cooking.</p>
      </footer>
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

  return (
    <>
      <NavBar />
      {children}
    </>
  )
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
    background: colors.bg,
    backgroundImage: 'radial-gradient(circle at 15% 50%, rgba(208, 135, 112, 0.04), transparent 25%), radial-gradient(circle at 85% 30%, rgba(129, 163, 132, 0.04), transparent 25%)',
  },
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    background: 'rgba(250, 245, 233, 0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: `1px solid rgba(232, 223, 211, 0.6)`,
  },
  navContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 2rem',
    maxWidth: '1200px',
    margin: '0 auto',
    gap: '1rem',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  logoIcon: {
    fontSize: '1.75rem',
  },
  logo: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 700,
    color: colors.text,
    letterSpacing: '-0.02em',
  },
  rightActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: colors.primaryLight,
    color: colors.primary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.875rem',
  },
  profileName: {
    color: colors.text,
    fontSize: '0.875rem',
    fontWeight: 600,
    paddingRight: '0.25rem',
  },
  navLinkPrimary: {
    background: colors.primary,
    color: 'white',
    padding: '0.5rem 1.25rem',
    borderRadius: radius.full,
    textDecoration: 'none',
    fontSize: '0.9375rem',
    fontWeight: 500,
    boxShadow: shadows.sm,
    transition: 'all 0.2s',
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '7rem 2rem 6rem',
  },
  hero: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '4rem',
    marginTop: '3rem',
    flexWrap: 'wrap',
  },
  heroText: {
    flex: '1 1 500px',
    maxWidth: '600px',
  },
  pillBadge: {
    display: 'inline-block',
    padding: '0.5rem 1rem',
    background: colors.primaryLight,
    color: colors.primaryHover,
    borderRadius: radius.full,
    fontSize: '0.875rem',
    fontWeight: 600,
    marginBottom: '1.5rem',
  },
  headline: {
    fontSize: '3.5rem',
    fontWeight: 800,
    lineHeight: 1.1,
    marginBottom: '1.5rem',
    color: colors.text,
    letterSpacing: '-0.02em',
  },
  headlineHighlight: {
    color: colors.primary,
  },
  subheadline: {
    fontSize: '1.25rem',
    color: colors.textSecondary,
    marginBottom: '2.5rem',
    lineHeight: 1.6,
    maxWidth: '500px',
  },
  btnGroup: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  ctaGroup: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  largeBtn: {
    padding: '1rem 1.5rem',
    fontSize: '1.125rem',
    textDecoration: 'none',
    borderRadius: radius.md,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '160px',
  },
  dashboardActions: {
    background: 'white',
    padding: '2rem',
    borderRadius: radius.lg,
    boxShadow: shadows.sm,
    border: `1px solid ${colors.borderLight}`,
  },
  welcomeText: {
    fontSize: '1.125rem',
    marginBottom: '1.5rem',
    color: colors.text,
    margin: '0 0 1.25rem 0',
  },
  heroVisual: {
    flex: '1 1 400px',
    position: 'relative',
    minHeight: '400px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualCircle1: {
    position: 'absolute',
    top: '10%',
    right: '20%',
    width: '120px',
    height: '120px',
    background: colors.primaryLight,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '4rem',
    boxShadow: shadows.md,
    zIndex: 2,
    animation: 'float 6s ease-in-out infinite',
  },
  visualCircle2: {
    position: 'absolute',
    bottom: '15%',
    left: '10%',
    width: '90px',
    height: '90px',
    background: colors.accentWarm,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '3rem',
    boxShadow: shadows.md,
    zIndex: 2,
    animation: 'float 5s ease-in-out infinite alternate',
  },
  visualCircle3: {
    position: 'absolute',
    top: '40%',
    left: '5%',
    width: '70px',
    height: '70px',
    background: colors.successBg,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2.5rem',
    boxShadow: shadows.sm,
    zIndex: 1,
    animation: 'float 7s ease-in-out infinite 1s',
  },
  visualCard: {
    position: 'relative',
    background: 'white',
    padding: '1.5rem',
    borderRadius: radius.lg,
    boxShadow: shadows.lg,
    width: '240px',
    zIndex: 3,
    transform: 'rotate(2deg)',
    border: `1px solid ${colors.borderLight}`,
  },
  visualCardRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 0',
    borderBottom: `1px dashed ${colors.border}`,
    fontSize: '0.9375rem',
    color: colors.textSecondary,
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: colors.primary,
  },
  featuresSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
    marginTop: '6rem',
  },
  featureCard: {
    background: 'white',
    padding: '2rem',
    borderRadius: radius.lg,
    boxShadow: shadows.sm,
    border: `1px solid ${colors.borderLight}`,
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  featureIcon: {
    fontSize: '2.5rem',
    marginBottom: '1rem',
    display: 'inline-block',
    padding: '1rem',
    background: colors.warmBg,
    borderRadius: radius.md,
  },
  featureTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    marginBottom: '0.75rem',
    color: colors.text,
  },
  featureText: {
    color: colors.textSecondary,
    lineHeight: 1.6,
    margin: 0,
  },
  footer: {
    textAlign: 'center',
    padding: '2rem',
    color: colors.textMuted,
    fontSize: '0.875rem',
    marginTop: 'auto',
  },
}
