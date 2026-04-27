import { useApp } from '../../context/AppContext';

// ─── Toast ────────────────────────────────────────────────────────────────────
export function Toast({ message }) {
  return (
    <div className="vault-toast" style={{ opacity: 1 }}>
      {message}
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
export function ConfirmModal({ message, onConfirm }) {
  const { setConfirmModal } = useApp();

  const close = () => setConfirmModal(null);
  const confirm = () => { close(); onConfirm(); };

  return (
    <div
      className="modal-overlay active"
      style={{ zIndex: 10000 }}
    >
      <div style={{
        background: 'var(--bg-dark)',
        padding: '28px',
        borderRadius: '12px',
        border: '1px solid var(--glass-border)',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      }}>
        <p style={{ marginBottom: '24px', fontSize: '16px', fontWeight: 500 }}>{message}</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={close}
            style={{ padding: '8px 20px', borderRadius: '8px', border: '1px solid #475569', background: 'transparent', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
          >Cancel</button>
          <button
            onClick={confirm}
            style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
          >Confirm</button>
        </div>
      </div>
    </div>
  );
}

// ─── Alert Modal ──────────────────────────────────────────────────────────────
export function AlertModal({ title, message }) {
  const { setAlertModal } = useApp();

  return (
    <div className="modal-overlay active" style={{ zIndex: 10000 }}>
      <div style={{
        background: 'var(--glass-bg)',
        padding: '30px',
        borderRadius: '12px',
        border: '1px solid #ef4444',
        maxWidth: '450px',
        width: '90%',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
      }}>
        <h3 style={{ marginTop: 0, color: '#ef4444', fontSize: '20px', borderBottom: '1px solid rgba(239,68,68,0.3)', paddingBottom: '15px', marginBottom: '20px' }}>
          {title}
        </h3>
        <p style={{ marginBottom: '25px', fontSize: '14px', lineHeight: 1.6, color: 'var(--text-light)', whiteSpace: 'pre-wrap' }}>
          {message}
        </p>
        <button
          onClick={() => setAlertModal(null)}
          style={{ padding: '12px 24px', borderRadius: '6px', border: 'none', width: '100%', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}
        >Understood</button>
      </div>
    </div>
  );
}

export default Toast;
