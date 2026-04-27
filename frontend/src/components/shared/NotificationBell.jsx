import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { notificationsApi } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function NotificationBell() {
  const { token, notifications, unreadCount, fetchNotifications, role } = useAuth();
  const { showToast } = useApp();
  const [open, setOpen]           = useState(false);
  const [isHistory, setIsHistory] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleView = () => {
    const next = !isHistory;
    setIsHistory(next);
    fetchNotifications(token, next);
  };

  const acknowledge = async (id) => {
    await notificationsApi.acknowledge(id, token);
    fetchNotifications(token, isHistory);
  };

  const dismiss = async (id) => {
    await notificationsApi.dismiss(id, token);
    fetchNotifications(token, isHistory);
  };

  const userRole = role;

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <div
        style={{ cursor: 'pointer', position: 'relative', fontSize: '20px', marginRight: '4px' }}
        onClick={() => setOpen(p => !p)}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount}</span>
        )}
      </div>

      <div
        className={`profile-dropdown-content${open ? ' active' : ''}`}
        style={{ width: '300px', right: '-10px', padding: '15px', maxHeight: '400px', overflowY: 'auto', cursor: 'default' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', marginBottom: '10px' }}>
          <h4 style={{ margin: 0, color: 'var(--accent-gold)' }}>Notifications</h4>
          <span
            style={{ fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={toggleView}
          >
            {isHistory ? 'View Active' : 'View History'}
          </span>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>
          {!notifications || notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
              No {isHistory ? 'historical' : 'new'} notifications.
            </div>
          ) : notifications.map(n => {
            const item = n.collection_items || { title: 'Deleted Item', unique_id: 'N/A' };
            const user = n.profiles || { full_name: 'Unknown User', email: 'N/A' };

            if (userRole === 'admin') {
              if (isHistory) return (
                <div key={n.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', marginBottom: '10px', borderLeft: '3px solid #64748b', opacity: 0.7 }}>
                  <strong style={{ color: '#94a3b8' }}>{user.full_name}</strong> asked about:<br />
                  <span style={{ color: '#94a3b8' }}>{item.title}</span> (ID: {item.unique_id})<br />
                  <div style={{ fontSize: '11px', marginTop: '5px', color: '#64748b' }}>Status: Handled</div>
                </div>
              );
              return (
                <div key={n.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '6px', marginBottom: '10px', borderLeft: '3px solid var(--accent-gold)' }}>
                  <strong style={{ color: 'white' }}>{user.full_name}</strong> is interested in:<br />
                  <span style={{ color: 'var(--accent-gold)' }}>{item.title}</span> (ID: {item.unique_id})<br />
                  <div style={{ fontSize: '11px', marginTop: '5px', color: '#aaa' }}>
                    Email: {user.email}<br />
                    Phone: {user.phone || 'Not provided'}
                  </div>
                  <button
                    onClick={() => acknowledge(n.id)}
                    style={{ marginTop: '8px', width: '100%', padding: '5px', background: 'var(--accent-gold)', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                  >Acknowledge & Notify User</button>
                </div>
              );
            } else {
              if (isHistory) return (
                <div key={n.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', marginBottom: '10px', borderLeft: '3px solid #64748b', opacity: 0.7 }}>
                  <strong style={{ color: '#94a3b8' }}>Past Inquiry</strong><br />
                  You asked about <span style={{ color: '#94a3b8' }}>{item.title}</span>.<br />
                  <div style={{ fontSize: '11px', marginTop: '5px', color: '#64748b' }}>Status: Dismissed</div>
                </div>
              );
              return (
                <div key={n.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '6px', marginBottom: '10px', borderLeft: '3px solid #10b981' }}>
                  <strong style={{ color: '#10b981' }}>Request Viewed!</strong><br />
                  The owner has viewed your request for <span style={{ color: 'white' }}>{item.title}</span> and will reach out soon.
                  <button
                    onClick={() => dismiss(n.id)}
                    style={{ marginTop: '8px', width: '100%', padding: '5px', background: 'transparent', color: '#aaa', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer' }}
                  >Dismiss</button>
                </div>
              );
            }
          })}
        </div>
      </div>
    </div>
  );
}
