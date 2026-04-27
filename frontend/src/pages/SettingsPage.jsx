import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { profileApi, authApi } from '../services/api';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, token, signOut } = useAuth();
  const { showConfirm, showToast } = useApp();

  const [alerts,    setAlerts]    = useState(false);
  const [shareEmail,setShareEmail]= useState(true);
  const [newPw,     setNewPw]     = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [prefMsg,   setPrefMsg]   = useState({ text: '', type: '' });
  const [pwMsg,     setPwMsg]     = useState({ text: '', type: '' });

  // Detect password recovery flow (from reset email link)
  useEffect(() => {
    const state = window.history.state?.usr;
    if (state?.passwordRecovery) {
      setPwMsg({ text: 'Welcome back! Please enter a new password below.', type: 'gold' });
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const res = await profileApi.getSettings(token);
        setAlerts(res.data?.email_alerts ?? false);
        setShareEmail(res.data?.share_email ?? true);
      } catch { /* silent */ }
    };
    load();
  }, [user, token]);

  const savePrefs = async () => {
    setPrefMsg({ text: 'Saving preferences...', type: 'muted' });
    try {
      await profileApi.saveSettings({ email_alerts: alerts, share_email: shareEmail }, token);
      setPrefMsg({ text: 'Preferences saved successfully!', type: 'success' });
      setTimeout(() => setPrefMsg({ text: '', type: '' }), 3000);
    } catch {
      setPrefMsg({ text: 'Failed to save preferences.', type: 'error' });
    }
  };

  const updatePassword = async () => {
    if (!newPw || newPw.length < 6) {
      setPwMsg({ text: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }
    setPwMsg({ text: 'Updating...', type: 'muted' });
    try {
      await authApi.updatePassword({ password: newPw }, token);
      setPwMsg({ text: 'Password updated successfully!', type: 'success' });
      setNewPw('');
      setTimeout(() => setPwMsg({ text: '', type: '' }), 3000);
    } catch (err) {
      setPwMsg({ text: err.message, type: 'error' });
    }
  };

  const deleteAccount = () => {
    showConfirm(
      'DANGER: Are you absolutely sure you want to permanently delete your account? All your wishlist data and profile details will be destroyed.',
      async () => {
        try {
          await authApi.deleteAccount(token);
          showToast('Your account has been successfully deleted.');
          await signOut();
          navigate('/');
        } catch {
          showToast('Failed to delete account. Please try again or contact support.');
        }
      }
    );
  };

  const msgColor = (type) => ({ success: '#10b981', error: '#ef4444', muted: 'var(--text-muted)', gold: 'var(--accent-gold)' }[type] || 'transparent');

  return (
    <div>
      <div className="page-header">
        <div className="header-buttons">
          <button className="btn-back" onClick={() => navigate('/')}>🏠 Home</button>
        </div>
        <h2 className="page-title">Account Settings</h2>
      </div>

      <div className="profile-wrapper">
        <div className="profile-card">

          {/* ── Privacy & Notifications ───────────────────────── */}
          <h3 style={{ color: 'var(--accent-gold)', marginTop: 0 }}>Privacy &amp; Notifications</h3>

          <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-light)' }}>Receive New Addition Alerts</span>
            <input
              type="checkbox"
              checked={alerts}
              onChange={e => setAlerts(e.target.checked)}
              style={{ accentColor: 'var(--accent-gold)', width: 18, height: 18 }}
            />
          </div>

          <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <span style={{ fontSize: '14px', color: 'var(--text-light)' }}>Share email when reaching out to owners</span>
            <input
              type="checkbox"
              checked={shareEmail}
              onChange={e => setShareEmail(e.target.checked)}
              style={{ accentColor: 'var(--accent-gold)', width: 18, height: 18 }}
            />
          </div>

          <button className="btn-save" onClick={savePrefs}>Save Preferences</button>
          {prefMsg.text && (
            <div style={{ fontSize: '13px', marginTop: 10, textAlign: 'center', color: msgColor(prefMsg.type) }}>
              {prefMsg.text}
            </div>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '30px 0' }} />

          {/* ── Change Password ──────────────────────────────── */}
          <h3 style={{ color: 'var(--accent-gold)', marginTop: 0 }}>Change Password</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 20 }}>
            Update the password for your current session.
          </p>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <div className="password-container" style={{ marginBottom: 0 }}>
              <input
                className="profile-input"
                type={showPw ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                style={{ paddingRight: 48 }}
              />
              <button
                className="toggle-password"
                onMouseDown={() => setShowPw(true)}
                onMouseUp={() => setShowPw(false)}
                onMouseLeave={() => setShowPw(false)}
                onTouchStart={() => setShowPw(true)}
                onTouchEnd={() => setShowPw(false)}
              >{showPw ? '🔒' : '👁️'}</button>
            </div>
          </div>

          <button
            className="btn-save"
            style={{ background: 'transparent', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)' }}
            onClick={updatePassword}
          >Update Password</button>

          {pwMsg.text && (
            <div style={{ fontSize: '13px', marginTop: 10, textAlign: 'center', color: msgColor(pwMsg.type) }}>
              {pwMsg.text}
            </div>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '30px 0' }} />

          {/* ── Danger Zone ──────────────────────────────────── */}
          <h3 style={{ color: '#ef4444', marginTop: 0 }}>Danger Zone</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 20 }}>
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
          <button
            className="btn-save"
            style={{ background: '#ef4444', color: 'white' }}
            onClick={deleteAccount}
          >Delete My Account</button>

        </div>
      </div>
    </div>
  );
}
