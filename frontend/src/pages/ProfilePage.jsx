import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { profileApi } from '../services/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { countries } = useApp();

  const [name,       setName]       = useState('');
  const [email,      setEmail]      = useState('');
  const [phoneCode,  setPhoneCode]  = useState('');
  const [phone,      setPhone]      = useState('');
  const [country,    setCountry]    = useState('');
  const [focus,      setFocus]      = useState('Both');
  const [dobDay,     setDobDay]     = useState('');
  const [dobMonth,   setDobMonth]   = useState('');
  const [dobYear,    setDobYear]    = useState('');
  const [msg,        setMsg]        = useState({ text: '', type: '' });
  const [loading,    setLoading]    = useState(true);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 101 }, (_, i) => currentYear - i);
  const days  = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setMsg({ text: 'Loading details...', type: 'muted' });
      try {
        const res = await profileApi.get(token);
        const p = res.data;
        setName(p?.full_name || '');
        setEmail(p?.email || user.email || '');
        setPhoneCode(p?.phone_code || '');
        setPhone(p?.phone || '');
        setCountry(p?.country || '');
        setFocus(p?.collecting_focus || 'Both');
        if (p?.dob) {
          const [y, m, d] = p.dob.split('-');
          setDobYear(y); setDobMonth(m); setDobDay(d);
        }
        setMsg({ text: '', type: '' });
      } catch {
        setMsg({ text: 'Error loading profile.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, token]);

  const save = async () => {
    if (!name) { setMsg({ text: 'Name cannot be left blank.', type: 'error' }); return; }

    // Phone validation
    if (phone && !phoneCode) { setMsg({ text: 'Please enter a country code for your mobile number.', type: 'error' }); return; }
    if (phoneCode && !/^\+[1-9]\d{0,3}$/.test(phoneCode)) { setMsg({ text: 'Please enter a valid country code (e.g., +1, +91).', type: 'error' }); return; }
    if (phoneCode && !phone) { setMsg({ text: 'Please enter a mobile number to match your country code.', type: 'error' }); return; }
    if (phone && phone.length < 5) { setMsg({ text: 'Please enter a valid, complete mobile number.', type: 'error' }); return; }

    // DOB validation
    let finalDob = null;
    if (dobDay || dobMonth || dobYear) {
      if (!dobDay || !dobMonth || !dobYear) { setMsg({ text: 'Please complete your full Date of Birth or leave it entirely blank.', type: 'error' }); return; }
      const checkDate = new Date(dobYear, parseInt(dobMonth) - 1, dobDay);
      if (checkDate.getMonth() !== parseInt(dobMonth) - 1) { setMsg({ text: 'Please enter a valid date (e.g., February does not have 31 days).', type: 'error' }); return; }
      const today = new Date();
      const minAgeDate = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());
      if (checkDate > today) { setMsg({ text: 'Date of Birth cannot be a future date.', type: 'error' }); return; }
      if (checkDate > minAgeDate) { setMsg({ text: 'You must be at least 5 years old to update this profile.', type: 'error' }); return; }
      finalDob = `${dobYear}-${dobMonth}-${dobDay}`;
    }

    setMsg({ text: 'Saving changes...', type: 'muted' });
    try {
      await profileApi.update({ full_name: name, collecting_focus: focus, phone_code: phoneCode || null, phone: phone || null, country: country || null, dob: finalDob }, token);
      setMsg({ text: 'Profile updated successfully!', type: 'success' });
      setTimeout(() => setMsg({ text: '', type: '' }), 3000);
    } catch (err) {
      setMsg({ text: err.message || 'Failed to save changes.', type: 'error' });
    }
  };

  const msgColor = { success: '#10b981', error: '#ef4444', muted: 'var(--text-muted)' }[msg.type] || 'transparent';

  return (
    <div>
      <div className="page-header">
        <div className="header-buttons">
          <button className="btn-back" onClick={() => navigate('/')}>🏠 Home</button>
        </div>
        <h2 className="page-title">Personal Details</h2>
      </div>

      <div className="profile-wrapper">
        <div className="profile-card">

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="profile-input" type="text" placeholder="e.g. Full Name" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address (Locked)</label>
            <input className="profile-input" type="email" value={email} disabled />
          </div>

          <div className="form-group">
            <label className="form-label">Mobile Number (Optional)</label>
            <div className="phone-input-group">
              <input
                className="profile-input phone-code"
                type="tel"
                placeholder="+Code"
                maxLength={5}
                value={phoneCode}
                onChange={e => {
                  const v = e.target.value.replace(/[^0-9]/g, '');
                  setPhoneCode(v ? '+' + v : '');
                }}
              />
              <input
                className="profile-input"
                type="tel"
                placeholder="Mobile Number"
                maxLength={15}
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Country</label>
            <select className="profile-input dropdown-select" value={country} onChange={e => setCountry(e.target.value)}>
              <option value="">Select your country</option>
              {countries.filter(c => c !== 'All Countries').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Date of Birth (Optional)</label>
            <div className="dob-input-group">
              <select className="profile-input dropdown-select dob-part" value={dobDay} onChange={e => setDobDay(e.target.value)}>
                <option value="">Day</option>
                {days.map(d => <option key={d} value={d}>{parseInt(d)}</option>)}
              </select>
              <select className="profile-input dropdown-select dob-part" value={dobMonth} onChange={e => setDobMonth(e.target.value)}>
                <option value="">Month</option>
                {MONTHS.map((m, i) => <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>)}
              </select>
              <select className="profile-input dropdown-select dob-part" value={dobYear} onChange={e => setDobYear(e.target.value)}>
                <option value="">Year</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Primary Collecting Focus</label>
            <select className="profile-input dropdown-select" value={focus} onChange={e => setFocus(e.target.value)} style={{ background: 'rgba(0,0,0,0.3)' }}>
              <option value="Both">Notes &amp; Coins</option>
              <option value="Notes">Currency Notes Only</option>
              <option value="Coins">Coins Only</option>
            </select>
          </div>

          <button className="btn-save" onClick={save}>Save Changes</button>

          {msg.text && (
            <div style={{ fontSize: '13px', marginTop: '10px', textAlign: 'center', color: msgColor }}>
              {msg.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
