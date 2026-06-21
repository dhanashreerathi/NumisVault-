import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { chatApi } from '../../services/api';

export default function ChatWidget() {
  const { user, token } = useAuth();
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState('');
  const [messages, setMessages] = useState([
    { role: 'model', text: "Hi! I'm NumisBot 🪙 — ask me about items in the vault, or anything about coins and currency notes!" }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    if (!user) {
      setMessages(prev => [...prev, { role: 'user', text }, { role: 'model', text: 'Please log in to chat with NumisBot.' }]);
      setInput('');
      return;
    }

    const newMessages = [...messages, { role: 'user', text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Send last 10 turns as history (excluding the welcome message)
      const history = newMessages.slice(1, -1).map(m => ({ role: m.role, text: m.text }));
      const res = await chatApi.send({ message: text, history }, token);
      setMessages(prev => [...prev, { role: 'model', text: res.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: err.message || "Sorry, I couldn't process that. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Floating bubble button */}
      <button
        onClick={() => setOpen(p => !p)}
        aria-label="Open chat assistant"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--accent-gold)',
          color: 'var(--bg-dark)',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(251,191,36,0.4)',
          zIndex: 1500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {open ? '✕' : '💬'}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed',
          bottom: '92px',
          right: '24px',
          width: '340px',
          maxWidth: 'calc(100vw - 32px)',
          height: '440px',
          maxHeight: 'calc(100vh - 140px)',
          background: 'rgba(15, 23, 42, 0.98)',
          border: '1px solid var(--glass-border)',
          borderRadius: '14px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1500,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <span style={{ fontSize: '20px' }}>🪙</span>
            <div>
              <div style={{ fontWeight: 'bold', color: 'var(--accent-gold)', fontSize: '14px' }}>NumisBot</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Your numismatic assistant</div>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                background: m.role === 'user' ? 'var(--accent-gold)' : 'rgba(255,255,255,0.06)',
                color: m.role === 'user' ? 'var(--bg-dark)' : 'var(--text-light)',
                padding: '8px 12px',
                borderRadius: '10px',
                fontSize: '13px',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {m.text}
              </div>
            ))}
            {loading && (
              <div style={{
                alignSelf: 'flex-start',
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--text-muted)',
                padding: '8px 12px',
                borderRadius: '10px',
                fontSize: '13px',
              }}>
                NumisBot is typing...
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{
            display: 'flex',
            gap: '8px',
            padding: '10px',
            borderTop: '1px solid var(--glass-border)',
          }}>
            <input
              className="auth-input"
              style={{ marginBottom: 0, fontSize: '13px', padding: '10px 12px' }}
              placeholder={user ? "Ask about coins, notes, history..." : "Log in to chat"}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!user}
              maxLength={500}
            />
            <button
              onClick={send}
              disabled={!user || loading || !input.trim()}
              style={{
                background: 'var(--accent-gold)',
                color: 'var(--bg-dark)',
                border: 'none',
                borderRadius: '8px',
                padding: '0 16px',
                fontWeight: 'bold',
                cursor: (!user || loading || !input.trim()) ? 'not-allowed' : 'pointer',
                opacity: (!user || loading || !input.trim()) ? 0.5 : 1,
                fontSize: '13px',
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
