import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function AuthModal() {
  const navigate  = useNavigate();
  const { signIn } = useAuth();
  const { showToast } = useApp();

  const [open, setOpen]         = useState(false);
  const [tab, setTab]           = useState('login');
  const [intended, setIntended] = useState(null);

  // Form state
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPw, setConfirmPw]     = useState('');
  const [showPw, setShowPw]           = useState(false);
  const [showCpw, setShowCpw]         = useState(false);

  // Validation & messages
  const [emailErr, setEmailErr]       = useState('');
  const [passErr, setPassErr]         = useState('');
  const [confirmErr, setConfirmErr]   = useState('');
  const [message, setMessage]         = useState({ text: '', type: '' });
  const [loading, setLoading]         = useState(false);
  const [showResend, setShowResend]   = useState(false);
  const [resendCount, setResendCount] = useState(0);

  // Listen for open events from Navbar / ProtectedRoute / gallery
  useEffect(() => {
    const handler = (e) => {
      const { tab: t = 'login', intended: dest = null, message: msg = null } = e.detail || {};
      setTab(t);
      setIntended(dest);
      if (msg) setMessage({ text: msg, type: 'gold' });
      setOpen(true);
    };
    window.addEventListener('nv:openAuth', handler);
    return () => window.removeEventListener('nv:openAuth', handler);
  }, []);

  // Keyboard: Enter submits
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Enter' && open) { e.preventDefault(); handleSubmit(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, email, password, name, confirmPw, tab]); // eslint-disable-line

  const close = () => {
    setOpen(false);
    wipe();
  };

  const wipe = () => {
    setName(''); setEmail(''); setPassword(''); setConfirmPw('');
    setEmailErr(''); setPassErr(''); setConfirmErr('');
    setMessage({ text: '', type: '' });
    setShowResend(false);
    setShowPw(false); setShowCpw(false);
  };

  const switchTab = (t) => {
    setTab(t);
    wipe();
  };

  // Real-time validation
  const validateEmail = (val) => {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    setEmailErr(val.length > 0 && !ok ? 'Please enter a valid email address.' : '');
  };
  const validatePassword = (val) => {
    if (tab === 'signup' && val.length > 0 && val.length < 6) {
      setPassErr('Password must be at least 6 characters.');
    } else setPassErr('');
  };
  const validateConfirm = (val) => {
    if (tab === 'signup' && val.length > 0 && val !== password) {
      setConfirmErr('Passwords do not match.');
    } else setConfirmErr('');
  };

  const handleSubmit = async () => {
    if (!email || !password || (tab === 'signup' && (!name || !confirmPw))) {
      setMessage({ text: 'Please fill in all required fields.', type: 'error' });
      return;
    }
    if (emailErr || passErr || confirmErr) {
      setMessage({ text: 'Please fix the errors above before continuing.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: 'Processing...', type: 'info' });

    try {
      if (tab === 'signup') {
        await authApi.signUp({ email, password, full_name: name });
        setMessage({ text: 'Registration successful! Please check your email to verify your account.', type: 'success' });
        setTimeout(() => {
          switchTab('login');
          setMessage({ text: 'Please log in after verifying your email.', type: 'info' });
        }, 4000);
      } else {
        await signIn(email, password);
        close();
        if (intended) {
          navigate(intended);
          setIntended(null);
        }
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg === 'email_not_confirmed') {
        setMessage({ text: 'Please verify your email address before logging in.', type: 'error' });
        setShowResend(true);
      } else {
        setMessage({ text: msg || 'Invalid email or password.', type: 'error' });
        setShowResend(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setMessage({ text: 'Please enter your registered email address first to reset your password.', type: 'error' });
      return;
    }
    setMessage({ text: 'Sending reset link...', type: 'info' });
    try {
      await authApi.resetPassword({ email, redirectTo: window.location.origin });
      setMessage({ text: 'Password reset link sent! Please check your inbox.', type: 'success' });
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleResend = async () => {
    const storageKey = `resend_count_${email}`;
    const count = parseInt(localStorage.getItem(storageKey) || '0');
    if (count >= 2) {
      setMessage({ text: 'Maximum resend attempts reached. Please check your spam folder or contact support.', type: 'error' });
      setShowResend(false);
      return;
    }
    setMessage({ text: 'Resending verification link...', type: 'info' });
    try {
      await authApi.resendVerification({ email, redirectTo: window.location.origin });
      const next = count + 1;
      localStorage.setItem(storageKey, next.toString());
      setMessage({ text: `New verification link sent! (Attempt ${next}/2)`, type: 'success' });
      setShowResend(false);
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const msgColor = {
    success: '#10b981', error: '#ef4444', info: 'var(--text-light)', gold: 'var(--accent-gold)'
  }[message.type] || 'transparent';

  if (!open) return null;

  return (
    <div className="modal-overlay active" onClick={close}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={close}>&times;</button>

        <div className="modal-tabs">
          <button className={`tab-btn${tab === 'login' ? ' active' : ''}`} onClick={() => switchTab('login')}>Sign In</button>
          <button className={`tab-btn${tab === 'signup' ? ' active' : ''}`} onClick={() => switchTab('signup')}>Create Account</button>
        </div>

        {message.text && (
          <div className="auth-message" style={{ color: msgColor }}>{message.text}</div>
        )}

        {tab === 'signup' && (
          <input
            className="auth-input"
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        )}

        <input
          className={`auth-input${emailErr ? ' input-error' : ''}`}
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={e => { setEmail(e.target.value); validateEmail(e.target.value); }}
        />
        {emailErr && <span className="inline-error">{emailErr}</span>}

        <div className="password-container">
          <input
            className={`auth-input${passErr ? ' input-error' : ''}`}
            type={showPw ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={e => { setPassword(e.target.value); validatePassword(e.target.value); }}
            style={{ marginBottom: 0, paddingRight: 48 }}
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
        {passErr && <span className="inline-error" style={{ marginTop: '-5px' }}>{passErr}</span>}

        {tab === 'login' && (
          <div style={{ textAlign: 'right', width: '100%', marginTop: '-2px', marginBottom: '15px' }}>
            <span
              onClick={sendPasswordReset}
              style={{ fontSize: '12px', color: 'var(--accent-gold)', cursor: 'pointer' }}
            >Forgot Password?</span>
          </div>
        )}

        {showResend && (
          <div style={{ textAlign: 'center', width: '100%', marginBottom: '12px' }}>
            <span
              onClick={handleResend}
              style={{ fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }}
            >Didn't get the email? Resend verification</span>
          </div>
        )}

        {tab === 'signup' && (
          <>
            <div className="password-container">
              <input
                className={`auth-input${confirmErr ? ' input-error' : ''}`}
                type={showCpw ? 'text' : 'password'}
                placeholder="Confirm Password"
                value={confirmPw}
                onChange={e => { setConfirmPw(e.target.value); validateConfirm(e.target.value); }}
                style={{ marginBottom: 0, paddingRight: 48 }}
              />
              <button
                className="toggle-password"
                onMouseDown={() => setShowCpw(true)}
                onMouseUp={() => setShowCpw(false)}
                onMouseLeave={() => setShowCpw(false)}
                onTouchStart={() => setShowCpw(true)}
                onTouchEnd={() => setShowCpw(false)}
              >{showCpw ? '🔒' : '👁️'}</button>
            </div>
            {confirmErr && <span className="inline-error" style={{ marginTop: '-5px' }}>{confirmErr}</span>}
          </>
        )}

        <button className="auth-submit-btn" onClick={handleSubmit} disabled={loading}>
          {tab === 'login' ? 'Login' : 'Create Account'}
        </button>

        <div className="auth-switch-text">
          {tab === 'login'
            ? <>New here? <span onClick={() => switchTab('signup')}>Create an account first</span></>
            : <>Already have an account? <span onClick={() => switchTab('login')}>Sign in here</span></>
          }
        </div>
      </div>
    </div>
  );
}
