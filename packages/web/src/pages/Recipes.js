import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../lib/auth';
import { colors, radius } from '../lib/theme';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const RECIPE_TYPE_LABELS = {
    full_meal: 'Full Meal',
    entree: 'Entree',
    side: 'Side',
    dessert: 'Dessert',
    appetizer: 'Appetizer',
    snack: 'Snack',
    drink: 'Drink',
    other: 'Other',
};
const RECIPE_TYPE_FILTERS = [
    { value: null, label: 'All Types' },
    { value: 'full_meal', label: 'Full Meal' },
    { value: 'entree', label: 'Entree' },
    { value: 'side', label: 'Side' },
    { value: 'dessert', label: 'Dessert' },
    { value: 'appetizer', label: 'Appetizer' },
    { value: 'snack', label: 'Snack' },
    { value: 'drink', label: 'Drink' },
    { value: 'other', label: 'Other' },
];
export default function Recipes() {
    const navigate = useNavigate();
    const { data: session, isPending } = useSession();
    const [recipes, setRecipes] = useState([]);
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterTag, setFilterTag] = useState(null);
    const [filterType, setFilterType] = useState(null);
    useEffect(() => {
        if (!isPending && !session) {
            navigate('/login');
        }
    }, [session, isPending, navigate]);
    useEffect(() => {
        if (session) {
            fetchRecipes();
            fetchTags();
        }
    }, [session]);
    const fetchRecipes = async () => {
        try {
            const res = await fetch(`${API_URL}/api/recipes`, { credentials: 'include' });
            const data = await res.json();
            if (res.ok) {
                setRecipes(data.data);
            }
            else {
                setError(data.error || 'Failed to load recipes');
            }
        }
        catch {
            setError('Failed to load recipes');
        }
        finally {
            setLoading(false);
        }
    };
    const fetchTags = async () => {
        try {
            const res = await fetch(`${API_URL}/api/tags`, { credentials: 'include' });
            const data = await res.json();
            if (res.ok) {
                setTags(data.data);
            }
        }
        catch { }
    };
    const filteredRecipes = recipes
        .filter((r) => !filterTag || r.tags.some((t) => t.id === filterTag))
        .filter((r) => !filterType || r.type === filterType);
    if (isPending || loading) {
        return (<div style={styles.container}>
        <div style={styles.header}>
          <div>
            <div className="skeleton" style={{ width: '120px', height: '1.5rem', marginBottom: '0.5rem' }}/>
            <div className="skeleton" style={{ width: '180px', height: '0.875rem' }}/>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div className="skeleton" style={{ width: '70px', height: '36px', borderRadius: radius.sm }}/>
            <div className="skeleton" style={{ width: '70px', height: '36px', borderRadius: radius.sm }}/>
          </div>
        </div>
        <div style={styles.recipeGrid}>
          {Array.from({ length: 6 }).map((_, i) => (<div key={i} className="skeleton-card">
              <div className="skeleton" style={{ width: '70%', height: '1.125rem', marginBottom: '0.5rem' }}/>
              <div className="skeleton" style={{ width: '100%', height: '0.875rem', marginBottom: '0.375rem' }}/>
              <div className="skeleton" style={{ width: '85%', height: '0.875rem', marginBottom: '0.75rem' }}/>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div className="skeleton" style={{ width: '60px', height: '0.75rem' }}/>
                <div className="skeleton" style={{ width: '60px', height: '0.75rem' }}/>
              </div>
              <div className="skeleton" style={{ width: '100%', height: '1px', marginBottom: '0.75rem' }}/>
              <div className="skeleton" style={{ width: '40%', height: '0.75rem' }}/>
            </div>))}
        </div>
      </div>);
    }
    return (<div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Recipes</h1>
          <p style={styles.subtitle}>
            {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} in your household
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/recipe-lists" className="btn-secondary" style={{ textDecoration: 'none', fontSize: '0.8125rem', padding: '0.625rem 1rem' }}>
            My Lists
          </Link>
          <Link to="/recipes/create" className="btn-primary" style={{ textDecoration: 'none', fontSize: '0.8125rem', padding: '0.625rem 1rem' }}>
            Wizard
          </Link>
          <Link to="/recipes/chat" className="btn-secondary" style={{ textDecoration: 'none', fontSize: '0.8125rem', padding: '0.625rem 1rem' }}>
            Chat
          </Link>
          <Link to="/recipes/import" className="btn-secondary" style={{ textDecoration: 'none', fontSize: '0.8125rem', padding: '0.625rem 1rem' }}>
            Import
          </Link>
        </div>
      </div>

      {error && <div className="error-message" style={{ maxWidth: '900px', margin: '0 auto 1rem' }}>{error}</div>}

      <div style={styles.filterSection}>
        <span style={styles.filterLabel}>Type:</span>
        {RECIPE_TYPE_FILTERS.map((t) => (<button key={t.label} onClick={() => setFilterType(filterType === t.value ? null : t.value)} className={`filter-chip${filterType === t.value ? ' active' : ''}`}>
            {t.label}
          </button>))}
      </div>

      {tags.length > 0 && (<div style={styles.filterSection}>
          <span style={styles.filterLabel}>Tag:</span>
          <button onClick={() => setFilterTag(null)} className={`filter-chip${filterTag === null ? ' active' : ''}`}>
            All
          </button>
          {tags.map((tag) => (<button key={tag.id} onClick={() => setFilterTag(filterTag === tag.id ? null : tag.id)} className={`filter-chip${filterTag === tag.id ? ' active' : ''}`}>
              {tag.name}
            </button>))}
        </div>)}

      {filteredRecipes.length === 0 ? (<div style={styles.emptyState}>
          <p style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>📝</p>
          <p>No recipes yet</p>
          <Link to="/recipes/create" className="btn-primary" style={{ display: 'inline-block', marginTop: '1rem', padding: '0.75rem 1.5rem', textDecoration: 'none' }}>
            Create your first recipe
          </Link>
        </div>) : (<div style={styles.recipeGrid}>
          {filteredRecipes.map((recipe) => (<Link key={recipe.id} to={`/recipes/${recipe.id}`} className="recipe-card">
              <h3 style={styles.recipeTitle}>{recipe.title}</h3>
              {recipe.description && (<p style={styles.recipeDescription}>
                  {recipe.description.slice(0, 100)}
                  {recipe.description.length > 100 ? '...' : ''}
                </p>)}
              <div style={styles.recipeMeta}>
                {recipe.prepTime && <span>🕐 {recipe.prepTime}m prep</span>}
                {recipe.cookTime && <span>🍳 {recipe.cookTime}m cook</span>}
                <span>🍽 {recipe.servings} servings</span>
              </div>
              {recipe.tags.length > 0 && (<div style={styles.recipeTags}>
                  {recipe.tags.map((tag) => (<span key={tag.id} style={styles.recipeTag}>
                      {tag.name}
                    </span>))}
                </div>)}
              <div style={styles.recipeFooter}>
                <span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {recipe.source === 'ai_generated' ? '✨ AI' : recipe.source === 'imported' ? '📄 Imported' : recipe.source === 'community' ? '🌍 Community' : '✏️ Manual'}
                  <span style={{ padding: '0.125rem 0.375rem', borderRadius: radius.full, background: colors.warmBg, fontSize: '0.625rem' }}>
                    {RECIPE_TYPE_LABELS[recipe.type] || recipe.type}
                  </span>
                </span>
                {recipe.createdBy && (<span>by {recipe.createdBy.name}</span>)}
              </div>
            </Link>))}
        </div>)}
    </div>);
}
const styles = {
    container: {
        minHeight: '100vh',
        background: colors.bg,
        padding: '2rem 1rem',
        paddingTop: '4.5rem',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1.5rem',
        maxWidth: '900px',
        margin: '0 auto 1.5rem',
    },
    title: {
        margin: 0,
        fontSize: '1.75rem',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        color: colors.text,
    },
    subtitle: {
        margin: '0.25rem 0 0',
        color: colors.textSecondary,
        fontSize: '0.875rem',
    },
    filterSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        maxWidth: '900px',
        margin: '0 auto 1.5rem',
        flexWrap: 'wrap',
    },
    filterLabel: {
        fontSize: '0.875rem',
        color: colors.textSecondary,
    },
    emptyState: {
        textAlign: 'center',
        padding: '4rem 2rem',
        color: colors.textSecondary,
    },
    recipeGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1rem',
        maxWidth: '900px',
        margin: '0 auto',
    },
    recipeTitle: {
        margin: 0,
        fontSize: '1.125rem',
        fontWeight: 600,
        marginBottom: '0.5rem',
    },
    recipeDescription: {
        margin: 0,
        fontSize: '0.875rem',
        color: colors.textSecondary,
        lineHeight: 1.5,
        marginBottom: '0.75rem',
        flex: 1,
    },
    recipeMeta: {
        display: 'flex',
        gap: '0.75rem',
        fontSize: '0.75rem',
        color: colors.textSecondary,
        marginBottom: '0.75rem',
    },
    recipeTags: {
        display: 'flex',
        gap: '0.375rem',
        flexWrap: 'wrap',
        marginBottom: '0.75rem',
    },
    recipeTag: {
        padding: '0.25rem 0.5rem',
        borderRadius: radius.full,
        background: colors.warmBg,
        fontSize: '0.6875rem',
        textTransform: 'capitalize',
    },
    recipeFooter: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.75rem',
        color: colors.textMuted,
        borderTop: `1px solid ${colors.border}`,
        paddingTop: '0.75rem',
    },
};
