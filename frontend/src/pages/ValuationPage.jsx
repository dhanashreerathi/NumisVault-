import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { valuationApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

const RARITY_COLOR = {
  'Common': '#94a3b8', 'Uncommon': '#60a5fa', 'Scarce': '#34d399',
  'Rare': '#fbbf24', 'Very Rare': '#f59e0b', 'Extremely Rare': '#ef4444',
};
const DEMAND_COLOR = {
  'Low': '#94a3b8', 'Moderate': '#60a5fa', 'High': '#34d399', 'Very High': '#fbbf24',
};
const CONFIDENCE_COLOR = { 'Low': '#ef4444', 'Medium': '#fbbf24', 'High': '#10b981' };

export default function ValuationPage() {
  const navigate  = useNavigate();
  const { token } = useAuth();
  const { collectionData } = useApp();

  const [mode, setMode]         = useState('select'); // 'select' | 'manual'
  const [selectedId, setSelectedId] = useState('');
  const [imageFile, setImageFile]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState('');

  // Manual form fields
  const [form, setForm] = useState({
    title: '', item_type: 'coin', country: '', year_issued: '',
    era: '', denomination: '', serial_number: '', is_error: false,
    is_unique_serial: false, description: '',
  });

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const getItemData = () => {
    if (mode === 'select' && selectedId) {
      const item = collectionData.find(i => i.unique_id === selectedId || i.id === selectedId);
      if (!item) return null;
      return {
        title: item.title, item_type: item.itemType, country: item.country,
        year_issued: item.year, era: item.era, denomination: item.denom,
        serial_number: item.serial, is_error: item.type === 'error',
        is_unique_serial: item.type === 'serial', description: item.desc,
      };
    }
    return form;
  };

  const handleEstimate = async () => {
    const itemData = getItemData();
    if (!itemData || !itemData.title || !itemData.country) {
      setError('Please fill in at least the title and country.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const payload = { ...itemData };

      // Convert image to base64 if provided
      if (imageFile) {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });
        payload.image_base64 = base64;
        payload.image_mime = imageFile.type;
      }

      const res = await valuationApi.estimate(payload, token);
      setResult(res);
    } catch (err) {
      setError(err.message || 'Valuation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const v = result?.valuation;

  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <div className="page-header">
        <div className="header-buttons">
          <button className="btn-back" onClick={() => navigate('/')}>🏠 Home</button>
        </div>
        <h2 className="page-title">🪙 AI Valuation Estimator</h2>
      </div>

      {/* Mode selector */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {[['select', '📋 Select from Vault'], ['manual', '✏️ Enter Manually']].map(([m, label]) => (
          <button
            key={m}
            className={`type-option${mode === m ? ' active' : ''}`}
            onClick={() => { setMode(m); setResult(null); setError(''); }}
            style={{ flex: 1 }}
          >{label}</button>
        ))}
      </div>

      {/* Input Panel */}
      <div style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '14px',
        padding: '24px',
        backdropFilter: 'blur(12px)',
        marginBottom: '20px',
      }}>

        {mode === 'select' ? (
          <div>
            <label className="form-label">Select Item from Vault</label>
            <select
              className="profile-input dropdown-select"
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
            >
              <option value="">— Choose a vault item —</option>
              {collectionData.map(item => (
                <option key={item.id} value={item.unique_id}>
                  {item.unique_id} — {item.title} ({item.country}, {item.year})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Title *</label>
              <input className="profile-input" placeholder="e.g. 1897 Victoria Quarter Anna" value={form.title} onChange={e => setField('title', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="profile-input dropdown-select" value={form.item_type} onChange={e => setField('item_type', e.target.value)}>
                <option value="coin">Coin</option>
                <option value="note">Currency Note</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Country *</label>
              <input className="profile-input" placeholder="e.g. India" value={form.country} onChange={e => setField('country', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Year Issued</label>
              <input className="profile-input" placeholder="e.g. 1897" value={form.year_issued} onChange={e => setField('year_issued', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Era</label>
              <input className="profile-input" placeholder="e.g. British Colonial" value={form.era} onChange={e => setField('era', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Denomination</label>
              <input className="profile-input" placeholder="e.g. 1/4 Anna" value={form.denomination} onChange={e => setField('denomination', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Serial Number</label>
              <input className="profile-input" placeholder="Leave blank if N/A" value={form.serial_number} onChange={e => setField('serial_number', e.target.value)} />
            </div>
            <div className="form-group" style={{ display: 'flex', gap: '20px', alignItems: 'center', gridColumn: 'span 2' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" checked={form.is_error} onChange={e => setField('is_error', e.target.checked)} style={{ accentColor: 'var(--accent-gold)', width: 16, height: 16 }} />
                Error Item
              </label>
              <label style={{ fontSize: '13px', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" checked={form.is_unique_serial} onChange={e => setField('is_unique_serial', e.target.checked)} style={{ accentColor: 'var(--accent-gold)', width: 16, height: 16 }} />
                Unique Serial
              </label>
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Additional Notes</label>
              <textarea className="profile-input" rows={2} placeholder="Condition notes, provenance, grade..." value={form.description} onChange={e => setField('description', e.target.value)} />
            </div>
          </div>
        )}

        {/* Image upload */}
        <div style={{ marginTop: '16px' }}>
          <label className="form-label">Upload Image (optional — improves accuracy)</label>
          <input
            type="file" accept="image/*"
            className="profile-input"
            style={{ padding: '10px' }}
            onChange={e => setImageFile(e.target.files[0] || null)}
          />
          {imageFile && <p style={{ fontSize: '11px', color: 'var(--accent-gold)', marginTop: '4px' }}>✅ {imageFile.name} selected — AI will assess condition from image</p>}
        </div>

        {error && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '12px' }}>{error}</p>}

        <button
          className="btn-save"
          style={{ marginTop: '20px' }}
          onClick={handleEstimate}
          disabled={loading || (mode === 'select' && !selectedId)}
        >
          {loading ? '🤖 AI is analyzing...' : '✨ Get AI Valuation Estimate'}
        </button>
      </div>

      {/* Results */}
      {v && (
        <div style={{
          background: 'var(--glass-bg)',
          border: '1px solid var(--accent-gold)',
          borderRadius: '14px',
          padding: '28px',
          backdropFilter: 'blur(12px)',
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: 'var(--accent-gold)', fontSize: '18px' }}>
            📋 Valuation Report — {result.item?.title}
          </h3>

          {/* Price estimate — hero */}
          <div style={{
            background: 'rgba(251,191,36,0.08)',
            border: '2px solid var(--accent-gold)',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            marginBottom: '20px',
          }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Estimated Market Value</div>
            <div style={{ fontSize: '42px', fontWeight: '900', color: 'var(--accent-gold)' }}>
              ${v.low_estimate} — ${v.high_estimate}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{v.currency} · Market estimate</div>
          </div>

          {/* Key stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Condition', value: v.condition, color: 'var(--accent-gold)' },
              { label: 'Rarity', value: v.rarity, color: RARITY_COLOR[v.rarity] || 'var(--accent-gold)' },
              { label: 'Collector Demand', value: v.collector_demand, color: DEMAND_COLOR[v.collector_demand] || '#94a3b8' },
              { label: 'Confidence', value: v.confidence, color: CONFIDENCE_COLOR[v.confidence] || '#94a3b8' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '12px', textAlign: 'center', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>{label}</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Key value factors */}
          {v.key_value_factors?.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Key Value Factors</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {v.key_value_factors.map((f, i) => (
                  <span key={i} style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: 'var(--text-light)' }}>
                    ✦ {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Condition notes */}
          {v.condition_notes && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Condition Assessment</div>
              <p style={{ fontSize: '13px', color: 'var(--text-light)', lineHeight: 1.6, margin: 0, background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid var(--accent-gold)' }}>{v.condition_notes}</p>
            </div>
          )}

          {/* Confidence reason */}
          {v.confidence_reason && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Confidence Note</div>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>{v.confidence_reason}</p>
            </div>
          )}

          {/* Appraiser notes */}
          {v.appraisal_notes && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Appraiser Commentary</div>
              <p style={{ fontSize: '13px', color: 'var(--text-light)', margin: 0, lineHeight: 1.7, fontStyle: 'italic' }}>"{v.appraisal_notes}"</p>
            </div>
          )}

          {/* Disclaimer */}
          <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(239,68,68,0.06)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>⚠️ {v.disclaimer}</p>
          </div>
        </div>
      )}
    </div>
  );
}
