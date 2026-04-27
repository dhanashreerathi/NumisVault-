import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { adminApi, aiApi } from '../services/api';

// ─── User Details Modal ───────────────────────────────────────────────────────
function UserModal({ user: u, onClose }) {
  if (!u) return null;
  const joinDate = new Date(u.created_at).toLocaleDateString();
  const phone    = u.phone ? `${u.phone_code || ''} ${u.phone}` : null;

  return (
    <div className="modal-overlay active" style={{ zIndex: 3000 }} onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 400, minHeight: 'auto' }} onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h2 style={{ color: 'var(--accent-gold)', marginTop: 0, borderBottom: '1px solid var(--glass-border)', paddingBottom: 10 }}>
          Collector Details
        </h2>
        <div style={{ textAlign: 'left', fontSize: 14, lineHeight: 1.6, color: 'var(--text-light)', marginTop: 20 }}>
          {[
            ['Name',           u.full_name || 'N/A'],
            ['Email',          u.email],
            ['Role',           u.role],
          ].map(([label, val]) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <strong>{label}:</strong>{' '}
              <span style={{ color: 'white', textTransform: label === 'Role' ? 'capitalize' : 'none' }}>{val}</span>
            </div>
          ))}

          <hr style={{ border: 0, borderTop: '1px solid var(--glass-border)', margin: '20px 0' }} />

          {[
            ['Phone',           phone || <span style={{ color: 'var(--text-muted)' }}>Not provided</span>],
            ['Country',        u.country || <span style={{ color: 'var(--text-muted)' }}>Not provided</span>],
            ['Date of Birth',  u.dob     || <span style={{ color: 'var(--text-muted)' }}>Not provided</span>],
            ['Focus',          u.collecting_focus || <span style={{ color: 'var(--text-muted)' }}>Not specified</span>],
          ].map(([label, val]) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <strong>{label}:</strong>{' '}
              <span style={{ color: 'white' }}>{val}</span>
            </div>
          ))}

          <hr style={{ border: 0, borderTop: '1px solid var(--glass-border)', margin: '20px 0' }} />
          <div style={{ marginBottom: 12 }}><strong>Account Created:</strong> <span style={{ color: 'white' }}>{joinDate}</span></div>
        </div>
      </div>
    </div>
  );
}

// ─── User Management Tab ──────────────────────────────────────────────────────
function UsersTab({ token }) {
  const { showConfirm, showToast } = useApp();
  const [allUsers,     setAllUsers]     = useState([]);
  const [search,       setSearch]       = useState('');
  const [loading,      setLoading]      = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers(token);
      setAllUsers(res.data || []);
    } catch {
      showToast('Failed to load user data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const filtered = allUsers.filter(u =>
    (u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
     u.email?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleBan = (userId, targetStatus) => {
    const action = targetStatus ? 'ban' : 'unban';
    showConfirm(`Are you sure you want to ${action} this user?`, async () => {
      try {
        await adminApi.banUser(userId, { is_banned: targetStatus }, token);
        showToast(`User successfully ${action}ned.`);
        load();
      } catch {
        showToast('Failed to update status. Please check your Admin permissions.');
      }
    });
  };

  return (
    <div className="admin-panel">
      <h3 style={{ marginTop: 0, color: 'var(--accent-gold)' }}>User Management</h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>View registered collectors and manage account access.</p>

      <div style={{ marginBottom: 15 }}>
        <input
          className="search-input"
          placeholder="🔍 Search users by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 400 }}
        />
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center' }}>Loading users...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No matching users found.</td></tr>
            ) : filtered.map(u => {
              let statusEl;
              if (u.is_banned) {
                statusEl = <span className="status-badge status-banned">Banned</span>;
              } else if (u.is_verified === false) {
                statusEl = <span className="status-badge" style={{ background: 'rgba(251,191,36,0.2)', color: 'var(--accent-gold)', border: '1px solid var(--accent-gold)' }}>Unverified</span>;
              } else {
                statusEl = <span className="status-badge status-active">Active</span>;
              }

              return (
                <tr key={u.id}>
                  <td
                    style={{ fontWeight: 'bold', color: 'var(--accent-gold)', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => setSelectedUser(u)}
                    title="Click to view full details"
                  >{u.full_name || 'N/A'}</td>
                  <td>{u.email}</td>
                  <td style={{ textTransform: 'capitalize' }}>{u.role}</td>
                  <td>{statusEl}</td>
                  <td>
                    {u.role !== 'admin'
                      ? u.is_banned
                        ? <button className="btn-action" onClick={() => handleBan(u.id, false)}>Unban</button>
                        : <button className="btn-action btn-ban" onClick={() => handleBan(u.id, true)}>Block</button>
                      : <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Admin Protected</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedUser && <UserModal user={selectedUser} onClose={() => setSelectedUser(null)} />}
    </div>
  );
}

// ─── Vault Upload Tab ─────────────────────────────────────────────────────────
function VaultTab({ token }) {
  const { showAlert, fetchCollection, generateUniqueID } = useApp();

  const [itemType,   setItemType]   = useState('note');
  const [title,      setTitle]      = useState('');
  const [denom,      setDenom]      = useState('');
  const [country,    setCountry]    = useState('');
  const [year,       setYear]       = useState('');
  const [era,        setEra]        = useState('');
  const [serial,     setSerial]     = useState('');
  const [desc,       setDesc]       = useState('');
  const [imgFront,   setImgFront]   = useState('');
  const [imgBack,    setImgBack]    = useState('');
  const [isSerial,   setIsSerial]   = useState(false);
  const [isError,    setIsError]    = useState(false);
  const [frontFile,  setFrontFile]  = useState(null);
  const [backFile,   setBackFile]   = useState(null);
  const [addMsg,     setAddMsg]     = useState({ text: '', type: '' });
  const [aiMsg,      setAiMsg]      = useState({ text: '', type: '' });
  const [aiLoading,  setAiLoading]  = useState(false);

  const msgColor = (type) => ({ success: '#10b981', error: '#ef4444', muted: 'var(--text-muted)', gold: 'var(--accent-gold)' }[type] || 'transparent');

  const extractWithAI = async () => {
    if (!frontFile) {
      setAiMsg({ text: 'Please select at least a Front (Obverse) image.', type: 'error' });
      return;
    }
    setAiLoading(true);
    setAiMsg({ text: 'Uploading to Cloudflare R2 & Analyzing with Gemini AI... (This takes a few seconds)', type: 'gold' });

    const formData = new FormData();
    formData.append('front_image', frontFile);
    if (backFile) formData.append('back_image', backFile);

    try {
      const { ok, data: result } = await aiApi.extract(formData, token);

      if (result.frontUrl) setImgFront(result.frontUrl);
      if (result.backUrl && result.backUrl !== 'EMPTY') setImgBack(result.backUrl);

      if (!ok || !result.success) {
        if (result.isAIFailure) {
          showAlert('⚠️ AI Analysis Failed', `Reason: ${result.reason}\n\nGood news: Your images were securely uploaded to the vault! You can manually type the historical details below and hit Save.`);
          setAiMsg({ text: 'Images uploaded successfully. Please fill the fields manually.', type: 'muted' });
        } else {
          throw new Error(result.error || result.message || 'Failed to process image.');
        }
        return;
      }

      if (result.aiData) {
        if (result.aiData.title)        setTitle(result.aiData.title);
        if (result.aiData.denomination) setDenom(result.aiData.denomination);
        if (result.aiData.country)      setCountry(result.aiData.country);
        if (result.aiData.year)         setYear(result.aiData.year);
        if (result.aiData.era)          setEra(result.aiData.era);
        if (result.aiData.description)  setDesc(result.aiData.description);
        if (result.aiData.serial_number && result.aiData.serial_number !== 'Unknown') {
          setSerial(result.aiData.serial_number);
        }
      }
      setAiMsg({ text: '✅ Analysis Complete! Please review the fields below before uploading to the Vault.', type: 'success' });
    } catch (err) {
      setAiMsg({ text: `Error: ${err.message}`, type: 'error' });
    } finally {
      setAiLoading(false);
    }
  };

  const clearForm = () => {
    setTitle(''); setDenom(''); setCountry(''); setYear(''); setEra('');
    setSerial(''); setDesc(''); setImgFront(''); setImgBack('');
    setIsSerial(false); setIsError(false);
    setFrontFile(null); setBackFile(null);
    setAiMsg({ text: '', type: '' });
  };

  const submit = async () => {
    if (!title || !denom || !country) {
      setAddMsg({ text: 'Title, Denomination, and Country are required fields.', type: 'error' });
      return;
    }
    setAddMsg({ text: 'Uploading to Vault...', type: 'muted' });
    const unique_id = generateUniqueID(itemType);
    try {
      const res = await adminApi.addVaultItem({
        unique_id, item_type: itemType, title, denomination: denom,
        country, year_issued: year, era, serial_number: serial || 'N/A',
        description: desc, image_front_url: imgFront, image_back_url: imgBack,
        is_unique_serial: isSerial, is_error: isError,
      }, token);
      setAddMsg({ text: res.message || `Success! ${title} has been added to the Vault.`, type: 'success' });
      await fetchCollection();
      clearForm();
      setTimeout(() => setAddMsg({ text: '', type: '' }), 4000);
    } catch (err) {
      setAddMsg({ text: `Upload failed: ${err.message}`, type: 'error' });
    }
  };

  return (
    <div className="admin-panel">
      <h3 style={{ marginTop: 0, color: 'var(--accent-gold)' }}>Add New Item to Vault</h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
        Upload a new currency note or coin directly to the database.
      </p>

      {addMsg.text && (
        <div style={{ fontSize: 13, marginBottom: 15, textAlign: 'center', color: msgColor(addMsg.type) }}>
          {addMsg.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>

        {/* Title */}
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label className="form-label">Item Title</label>
          <input className="profile-input" type="text" placeholder="e.g. 1928 $2 Red Seal Note" value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        {/* Type */}
        <div className="form-group">
          <label className="form-label">Item Type</label>
          <select className="profile-input dropdown-select" value={itemType} onChange={e => setItemType(e.target.value)}>
            <option value="note">Currency Note</option>
            <option value="coin">Coin</option>
          </select>
        </div>

        {/* Denomination */}
        <div className="form-group">
          <label className="form-label">Denomination</label>
          <input className="profile-input" type="text" placeholder="e.g. 2 Dollars" value={denom} onChange={e => setDenom(e.target.value)} />
        </div>

        {/* Country */}
        <div className="form-group">
          <label className="form-label">Country</label>
          <input className="profile-input" type="text" placeholder="e.g. United States" value={country} onChange={e => setCountry(e.target.value)} />
        </div>

        {/* Year */}
        <div className="form-group">
          <label className="form-label">Year Issued</label>
          <input className="profile-input" type="text" placeholder="e.g. 1928" value={year} onChange={e => setYear(e.target.value)} />
        </div>

        {/* Era */}
        <div className="form-group">
          <label className="form-label">Historical Era</label>
          <input className="profile-input" type="text" placeholder="e.g. Pre-War" value={era} onChange={e => setEra(e.target.value)} />
        </div>

        {/* Serial */}
        <div className="form-group">
          <label className="form-label">Serial Number</label>
          <input className="profile-input" type="text" placeholder="Leave blank if N/A" value={serial} onChange={e => setSerial(e.target.value)} />
        </div>

        {/* Description */}
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label className="form-label">Description / Historical Notes</label>
          <textarea className="profile-input" rows={3} placeholder="Enter the historical context or grade details here..." value={desc} onChange={e => setDesc(e.target.value)} />
        </div>

        {/* AI Upload Zone */}
        <div className="form-group" style={{ gridColumn: 'span 2', background: 'rgba(251,191,36,0.05)', padding: 15, borderRadius: 8, border: '1px dashed var(--accent-gold)' }}>
          <label className="form-label" style={{ color: 'var(--accent-gold)' }}>✨ AI Auto-Extract &amp; R2 Upload</label>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 0, marginBottom: 15 }}>
            Upload your images here. The AI will securely upload them to your Vault and attempt to identify the historical details automatically.
          </p>

          <div style={{ display: 'flex', gap: 15, marginBottom: 15, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 5, display: 'block' }}>Obverse (Front) *</label>
              <input
                type="file"
                accept="image/*"
                className="profile-input"
                style={{ padding: 8 }}
                onChange={e => setFrontFile(e.target.files[0] || null)}
              />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 5, display: 'block' }}>Reverse (Back)</label>
              <input
                type="file"
                accept="image/*"
                className="profile-input"
                style={{ padding: 8 }}
                onChange={e => setBackFile(e.target.files[0] || null)}
              />
            </div>
          </div>

          <button
            id="btn-ai-extract"
            className="btn-save"
            style={{ background: 'var(--bg-dark)', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)', marginTop: 0, opacity: aiLoading ? 0.5 : 1 }}
            onClick={extractWithAI}
            disabled={aiLoading}
          >Analyze Images &amp; Auto-Fill Form</button>

          {aiMsg.text && (
            <div style={{ fontSize: 13, marginTop: 10, textAlign: 'center', color: msgColor(aiMsg.type) }}>
              {aiMsg.text}
            </div>
          )}
        </div>

        {/* Checkboxes */}
        <div className="form-group" style={{ display: 'flex', gap: 20, gridColumn: 'span 2' }}>
          <label style={{ fontSize: 13, color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={isSerial} onChange={e => setIsSerial(e.target.checked)} style={{ accentColor: 'var(--accent-gold)', width: 16, height: 16 }} />
            Unique Serial
          </label>
          <label style={{ fontSize: 13, color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={isError} onChange={e => setIsError(e.target.checked)} style={{ accentColor: 'var(--accent-gold)', width: 16, height: 16 }} />
            Error Note/Coin
          </label>
        </div>
      </div>

      <button className="btn-save" style={{ marginTop: 20 }} onClick={submit}>Upload to Vault</button>
    </div>
  );
}

// ─── AdminPage ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div>
      <div className="page-header">
        <div className="header-buttons">
          <button className="btn-back" onClick={() => navigate('/')}>🏠 Home</button>
        </div>
        <h2 className="page-title">Admin Control Center</h2>
      </div>

      <div className="top-category-bar" style={{ marginBottom: 25, position: 'relative', top: 0 }}>
        <div className={`type-option${activeTab === 'users' ? ' active' : ''}`} onClick={() => setActiveTab('users')}>
          👥 User Management
        </div>
        <div className={`type-option${activeTab === 'add' ? ' active' : ''}`} onClick={() => setActiveTab('add')}>
          ➕ Add Item to Vault
        </div>
      </div>

      <div className="admin-grid">
        {activeTab === 'users' ? <UsersTab token={token} /> : <VaultTab token={token} />}
      </div>
    </div>
  );
}
