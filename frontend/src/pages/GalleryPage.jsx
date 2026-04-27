import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function GalleryPage() {
  const navigate = useNavigate();
  const { collectionData, countries, currentVaultMode, setCurrentVaultMode, getDecade } = useApp();

  const [filterType,    setFilterType]    = useState('All');
  const [filterCountry, setFilterCountry] = useState('All Countries');
  const [filterDecade,  setFilterDecade]  = useState('All');
  const [filterEra,     setFilterEra]     = useState('All');
  const [countrySearch, setCountrySearch] = useState('');
  const [mobileFilters, setMobileFilters] = useState(false);

  // Items for current vault mode
  const vaultItems = useMemo(
    () => collectionData.filter(i => i.itemType === currentVaultMode),
    [collectionData, currentVaultMode]
  );

  // Derived filter options
  const decades = useMemo(() => {
    const set = [...new Set(vaultItems.map(i => getDecade(i.year)))].filter(d => d !== 'Other').sort();
    return set;
  }, [vaultItems]);

  const eras = useMemo(() => {
    return [...new Set(vaultItems.map(i => i.era || 'Unknown Era'))].sort();
  }, [vaultItems]);

  // Apply all filters
  const filtered = useMemo(() => {
    let data = vaultItems;
    if (filterType !== 'All')             data = data.filter(i => i.type === filterType);
    if (filterCountry !== 'All Countries') data = data.filter(i => i.country === filterCountry);
    if (filterDecade !== 'All')           data = data.filter(i => getDecade(i.year) === filterDecade);
    if (filterEra !== 'All')              data = data.filter(i => i.era === filterEra);
    return data;
  }, [vaultItems, filterType, filterCountry, filterDecade, filterEra]);

  // Filtered countries in sidebar
  const visibleCountries = useMemo(() => {
    const q = countrySearch.toLowerCase();
    return countries.filter(c => c.toLowerCase().includes(q));
  }, [countries, countrySearch]);

  const clearAll = () => {
    setFilterType('All');
    setFilterCountry('All Countries');
    setFilterDecade('All');
    setFilterEra('All');
    setCountrySearch('');
  };

  const openViewer = (item) => {
    navigate(`/viewer?item=${item.unique_id}`);
  };

  const typeOptions = currentVaultMode === 'note'
    ? [
        { id: 'All',      label: 'All Notes' },
        { id: 'serial',   label: 'Unique Serials' },
        { id: 'standard', label: 'Standard Country Issues' },
        { id: 'error',    label: 'Errors' },
      ]
    : [
        { id: 'All',      label: 'All Coins' },
        { id: 'standard', label: 'Standard Country Issues' },
        { id: 'error',    label: 'Errors' },
      ];

  return (
    <div>
      <div className="page-header">
        <div className="header-buttons">
          <button className="btn-back" onClick={() => navigate('/')}>🏠 Home</button>
          <button className="btn-back" onClick={() => navigate('/')}>← Back</button>
        </div>
        <h2 className="page-title">
          {currentVaultMode === 'note' ? 'Currency Gallery' : 'Coin Gallery'}
        </h2>
      </div>

      {/* Category Bar */}
      <div className="top-category-bar">
        {typeOptions.map(opt => (
          <div
            key={opt.id}
            className={`type-option${filterType === opt.id ? ' active' : ''}`}
            onClick={() => setFilterType(opt.id)}
          >
            {opt.label}
          </div>
        ))}
      </div>

      <div className="gallery-wrapper">
        {/* Mobile filter toggle */}
        <button
          className="mobile-filter-btn"
          onClick={() => setMobileFilters(p => !p)}
          style={mobileFilters ? { background: 'var(--accent-gold)', color: 'var(--bg-dark)' } : {}}
        >
          {mobileFilters ? '✖ Hide Filters' : '⚙️ Show Filters'}
        </button>

        {/* Filter Pane */}
        <aside className={`filter-pane${mobileFilters ? ' mobile-active' : ''}`}>
          <div className="filter-section">
            <button
              className="btn-action"
              style={{ width: '100%', padding: '10px', borderColor: '#ef4444', color: '#ef4444', fontWeight: 'bold', fontSize: '13px' }}
              onClick={clearAll}
            >🔄 Clear All Filters</button>
          </div>

          <div className="filter-section">
            <div className="filter-title">Filter by Country</div>
            <input
              className="search-input"
              placeholder="Search countries..."
              value={countrySearch}
              onChange={e => setCountrySearch(e.target.value)}
            />
            <div className="country-list-container">
              {visibleCountries.map(c => (
                <div
                  key={c}
                  className={`country-item${filterCountry === c ? ' active' : ''}`}
                  onClick={() => setFilterCountry(c)}
                >{c}</div>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <div className="filter-title">Year / Decade</div>
            <select
              className="dropdown-select profile-input"
              value={filterDecade}
              onChange={e => setFilterDecade(e.target.value)}
            >
              <option value="All">All Decades</option>
              {decades.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="filter-section" style={{ marginBottom: 0 }}>
            <div className="filter-title">Historical Era</div>
            <select
              className="dropdown-select profile-input"
              value={filterEra}
              onChange={e => setFilterEra(e.target.value)}
            >
              <option value="All">All Eras</option>
              {eras.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </aside>

        {/* Gallery Grid */}
        <div className="gallery-grid">
          {filtered.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '50px' }}>
              <h3 style={{ color: 'var(--accent-gold)' }}>No items found</h3>
              <p style={{ color: 'var(--text-muted)' }}>Try adjusting your filters on the left.</p>
            </div>
          ) : filtered.map(item => {
            const decade = getDecade(item.year);
            const shapeClass = item.itemType === 'coin' ? 'shape-coin' : 'shape-note';
            return (
              <div key={item.id} className="gallery-item" onClick={() => openViewer(item)}>
                {item.imgFront && item.imgFront !== 'EMPTY'
                  ? <img className={shapeClass} src={item.imgFront} alt={item.title}
                      onError={e => { e.target.onerror = null; e.target.outerHTML = '<div class="no-preview-box">No preview available</div>'; }} />
                  : <div className="no-preview-box">No preview available</div>
                }
                <h4>{item.title}</h4>
                <p>{item.country} • {decade}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
