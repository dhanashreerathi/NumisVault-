import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchApi } from '../services/api';
import { useApp } from '../context/AppContext';

const SUGGESTIONS = [
  'Show me error notes from British India',
  'Indian coins from the 1900s',
  'Unique serial number notes',
  'Pre-war European currency',
  'Coins from the 1800s',
  'Post independence Indian notes',
  'German currency from World War era',
  'Rare coins worth collecting',
];

export default function SmartSearchPage() {
  const navigate = useNavigate();
  const { getDecade } = useApp();

  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [searched, setSearched] = useState('');

  const search = async (q) => {
    const text = (q || query).trim();
    if (!text) return;

    setLoading(true);
    setError('');
    setResults(null);
    setSearched(text);

    try {
      const res = await searchApi.query({ query: text });
      setResults(res.results || []);
    } catch (err) {
      setError(err.message || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') search();
  };

  return (
    <div style={{ width: '100%', maxWidth: 1100 }}>
      {/* Header */}
      <div className="page-header">
        <div className="header-buttons">
          <button className="btn-back" onClick={() => navigate('/')}>🏠 Home</button>
        </div>
        <h2 className="page-title">🔍 AI Smart Search</h2>
      </div>

      {/* Search box */}
      <div style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '14px',
        padding: '28px',
        marginBottom: '24px',
        backdropFilter: 'blur(12px)',
      }}>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Describe what you are looking for in plain English — the AI will find matching items from the vault.
        </p>

        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            className="search-input"
            style={{ fontSize: '15px', padding: '14px 16px', flex: 1 }}
            placeholder='e.g. "Show me error notes from British India"'
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading}
          />
          <button
            className="btn-save"
            style={{ width: 'auto', padding: '0 28px', margin: 0 }}
            onClick={() => search()}
            disabled={loading || !query.trim()}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Suggestions */}
        <div style={{ marginTop: '14px' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Try these:</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => { setQuery(s); search(s); }}
                disabled={loading}
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-muted)',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  transition: '0.2s',
                }}
                onMouseEnter={e => { e.target.style.borderColor = 'var(--accent-gold)'; e.target.style.color = 'var(--accent-gold)'; }}
                onMouseLeave={e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.color = 'var(--text-muted)'; }}
              >{s}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🤖</div>
          <p style={{ fontSize: '14px' }}>AI is searching the vault...</p>
          <p style={{ fontSize: '12px', marginTop: '6px', color: 'var(--accent-gold)' }}>"{searched}"</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ textAlign: 'center', padding: '30px', color: '#ef4444' }}>
          <p>{error}</p>
        </div>
      )}

      {/* Results */}
      {results !== null && !loading && (
        <div>
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-light)' }}>
              {results.length === 0
                ? 'No matching items found'
                : `${results.length} item${results.length !== 1 ? 's' : ''} found`}
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--accent-gold)' }}>for "{searched}"</span>
          </div>

          {results.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '50px',
              background: 'var(--glass-bg)', borderRadius: '12px',
              border: '1px solid var(--glass-border)',
            }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                No items in the vault match your search. Try different keywords.
              </p>
            </div>
          ) : (
            <div className="gallery-grid">
              {results.map(item => {
                const decade = getDecade(item.year_issued);
                const shapeClass = item.item_type === 'coin' ? 'shape-coin' : 'shape-note';
                return (
                  <div
                    key={item.id}
                    className="gallery-item"
                    onClick={() => navigate(`/viewer?item=${item.unique_id}`)}
                  >
                    {item.image_front_url && item.image_front_url !== 'EMPTY'
                      ? <img className={shapeClass} src={item.image_front_url} alt={item.title}
                          onError={e => { e.target.onerror = null; e.target.outerHTML = '<div class="no-preview-box">No preview</div>'; }} />
                      : <div className="no-preview-box">No preview</div>
                    }
                    <h4>{item.title}</h4>
                    <p>{item.country} • {decade}</p>
                    {(item.is_error || item.is_unique_serial) && (
                      <div style={{ marginTop: '6px', display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {item.is_error && <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '10px', background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: '1px solid #ef4444' }}>Error</span>}
                        {item.is_unique_serial && <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '10px', background: 'rgba(251,191,36,0.15)', color: 'var(--accent-gold)', border: '1px solid var(--accent-gold)' }}>Unique Serial</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
