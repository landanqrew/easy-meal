import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSession, signOut } from '../lib/auth';
import { colors } from '../lib/theme';
export default function NavBar() {
    const { data: session } = useSession();
    const location = useLocation();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    if (!session)
        return null;
    const isActive = (path) => {
        if (path === '/recipes') {
            return location.pathname === '/recipes' || location.pathname.startsWith('/recipes/') || location.pathname.startsWith('/recipe-lists');
        }
        if (path === '/discover') {
            return location.pathname === '/discover' || location.pathname.startsWith('/discover/');
        }
        return location.pathname.startsWith(path);
    };
    const handleSignOut = async () => {
        setMenuOpen(false);
        await signOut();
        navigate('/login');
    };
    const closeMenu = () => setMenuOpen(false);
    return (<>
      <nav style={styles.nav}>
        <div style={styles.navContainer}>
          <Link to="/" style={{ textDecoration: 'none', ...styles.logoContainer }}>
            <span style={styles.logoIcon}>🥘</span>
            <h1 style={styles.logo}>Easy Meal</h1>
          </Link>

          <div className="home-center-links">
            <Link to="/recipes" className={`home-nav-link${isActive('/recipes') ? ' active' : ''}`}>Recipes</Link>
            <Link to="/discover" className={`home-nav-link${isActive('/discover') ? ' active' : ''}`}>Discover</Link>
            <Link to="/meal-plan" className={`home-nav-link${isActive('/meal-plan') ? ' active' : ''}`}>Meal Plan</Link>
            <Link to="/grocery-lists" className={`home-nav-link${isActive('/grocery-lists') ? ' active' : ''}`}>Groceries</Link>
            <Link to="/household" className={`home-nav-link${isActive('/household') ? ' active' : ''}`}>Household</Link>
          </div>

          <div style={styles.rightActions}>
            <Link to="/profile" className="profile-pill">
              <div style={styles.avatar}>
                {(session.user.name || session.user.email || '?').charAt(0).toUpperCase()}
              </div>
              <span style={styles.profileName}>
                {session.user.name?.split(' ')[0] || session.user.email?.split('@')[0] || 'Profile'}
              </span>
            </Link>

            <button className="hamburger-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </nav>

      <div className={`mobile-menu-overlay${menuOpen ? ' open' : ''}`}>
        <Link to="/recipes" className={isActive('/recipes') ? 'active' : ''} onClick={closeMenu}>Recipes</Link>
        <Link to="/discover" className={isActive('/discover') ? 'active' : ''} onClick={closeMenu}>Discover</Link>
        <Link to="/meal-plan" className={isActive('/meal-plan') ? 'active' : ''} onClick={closeMenu}>Meal Plan</Link>
        <Link to="/grocery-lists" className={isActive('/grocery-lists') ? 'active' : ''} onClick={closeMenu}>Groceries</Link>
        <Link to="/household" className={isActive('/household') ? 'active' : ''} onClick={closeMenu}>Household</Link>
        <Link to="/profile" className={isActive('/profile') ? 'active' : ''} onClick={closeMenu}>Profile</Link>
        <button onClick={handleSignOut}>Sign Out</button>
      </div>
    </>);
}
const styles = {
    nav: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'rgba(250, 245, 233, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(232, 223, 211, 0.6)',
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
};
