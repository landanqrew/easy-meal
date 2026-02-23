import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../lib/auth';
import { colors, radius } from '../lib/theme';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export default function GroceryLists() {
    const navigate = useNavigate();
    const { data: session, isPending } = useSession();
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('active');
    useEffect(() => {
        if (!isPending && !session) {
            navigate('/login');
        }
    }, [session, isPending, navigate]);
    useEffect(() => {
        if (session) {
            fetchLists();
        }
    }, [session]);
    const fetchLists = async () => {
        try {
            const res = await fetch(`${API_URL}/api/grocery-lists`, {
                credentials: 'include',
            });
            const data = await res.json();
            if (res.ok) {
                setLists(data.data);
            }
            else {
                setError(data.error || 'Failed to load grocery lists');
            }
        }
        catch {
            setError('Failed to load grocery lists');
        }
        finally {
            setLoading(false);
        }
    };
    const filteredLists = lists.filter((list) => {
        if (filter === 'all')
            return true;
        return list.status === filter;
    });
    const activeLists = lists.filter((l) => l.status === 'active');
    const completedLists = lists.filter((l) => l.status === 'completed');
    if (isPending || loading) {
        return (<div style={styles.container}>
        <div style={styles.header}>
          <div>
            <div className="skeleton" style={{ width: '160px', height: '1.75rem', marginBottom: '0.5rem' }}/>
            <div className="skeleton" style={{ width: '140px', height: '0.875rem' }}/>
          </div>
          <div className="skeleton" style={{ width: '100px', height: '40px', borderRadius: radius.sm }}/>
        </div>
        <div style={styles.filterSection}>
          {Array.from({ length: 3 }).map((_, i) => (<div key={i} className="skeleton" style={{ width: '70px', height: '32px', borderRadius: '9999px' }}/>))}
        </div>
        <div style={styles.listGrid}>
          {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="skeleton-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div className="skeleton" style={{ width: '55%', height: '1rem' }}/>
                <div className="skeleton" style={{ width: '60px', height: '1.25rem', borderRadius: radius.full }}/>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div className="skeleton" style={{ width: '80px', height: '0.8125rem' }}/>
                <div className="skeleton" style={{ width: '70px', height: '0.8125rem' }}/>
              </div>
            </div>))}
        </div>
      </div>);
    }
    return (<div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Grocery Lists</h1>
          <p style={styles.subtitle}>
            {activeLists.length} active, {completedLists.length} completed
          </p>
        </div>
        <Link to="/grocery-lists/create" className="btn-primary" style={styles.createButton}>
          + New List
        </Link>
      </div>

      {error && <div className="error-message" style={{ maxWidth: '900px', margin: '0 auto 1rem' }}>{error}</div>}

      <div style={styles.filterSection}>
        <button onClick={() => setFilter('active')} className={`filter-chip${filter === 'active' ? ' active' : ''}`}>
          Active
        </button>
        <button onClick={() => setFilter('completed')} className={`filter-chip${filter === 'completed' ? ' active' : ''}`}>
          Completed
        </button>
        <button onClick={() => setFilter('all')} className={`filter-chip${filter === 'all' ? ' active' : ''}`}>
          All
        </button>
      </div>

      {filteredLists.length === 0 ? (<div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🛒</div>
          <p style={styles.emptyText}>
            {filter === 'active'
                ? 'No active grocery lists'
                : filter === 'completed'
                    ? 'No completed grocery lists'
                    : 'No grocery lists yet'}
          </p>
          {filter !== 'completed' && (<Link to="/grocery-lists/create" className="btn-primary" style={{ textDecoration: 'none', marginTop: '1rem', display: 'inline-block' }}>
              Create your first list
            </Link>)}
        </div>) : (<div style={styles.listGrid}>
          {filteredLists.map((list) => (<Link key={list.id} to={`/grocery-lists/${list.id}`} className="list-card">
              <div style={styles.listHeader}>
                <h3 style={styles.listName}>{list.name}</h3>
                <span style={{
                    ...styles.statusBadge,
                    ...(list.status === 'completed' ? styles.statusCompleted : {}),
                }}>
                  {list.status === 'completed' ? '✓ Done' : 'Active'}
                </span>
              </div>
              <div style={styles.listMeta}>
                <span>{new Date(list.createdAt).toLocaleDateString()}</span>
                {list.createdBy && <span>by {list.createdBy.name}</span>}
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
        maxWidth: '900px',
        margin: '0 auto 1.5rem',
    },
    title: {
        margin: 0,
        fontSize: '1.75rem',
        fontWeight: 700,
        color: colors.text,
        letterSpacing: '-0.02em',
    },
    subtitle: {
        margin: '0.25rem 0 0',
        color: colors.textSecondary,
        fontSize: '0.875rem',
    },
    createButton: {
        padding: '0.75rem 1.25rem',
        textDecoration: 'none',
        fontSize: '0.9375rem',
    },
    filterSection: {
        display: 'flex',
        gap: '0.5rem',
        maxWidth: '900px',
        margin: '0 auto 1.5rem',
    },
    emptyState: {
        textAlign: 'center',
        padding: '4rem 2rem',
        maxWidth: '900px',
        margin: '0 auto',
    },
    emptyIcon: {
        fontSize: '3rem',
        marginBottom: '1rem',
    },
    emptyText: {
        color: colors.textSecondary,
        fontSize: '1.0625rem',
        margin: 0,
    },
    listGrid: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        maxWidth: '900px',
        margin: '0 auto',
    },
    listHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.5rem',
    },
    listName: {
        margin: 0,
        fontSize: '1rem',
        fontWeight: 600,
        color: colors.text,
    },
    statusBadge: {
        padding: '0.25rem 0.625rem',
        borderRadius: radius.full,
        fontSize: '0.6875rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
        background: colors.accentWarm,
        color: colors.warning,
    },
    statusCompleted: {
        background: colors.successBg,
        color: colors.successText,
    },
    listMeta: {
        display: 'flex',
        gap: '0.75rem',
        fontSize: '0.8125rem',
        color: colors.textSecondary,
    },
};
