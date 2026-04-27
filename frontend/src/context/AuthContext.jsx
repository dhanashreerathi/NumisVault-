import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, wishlistApi, notificationsApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [role, setRole]               = useState('user');
  const [token, setToken]             = useState(() => localStorage.getItem('nv_token') || null);
  const [wishlist, setWishlist]       = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sessionChecked, setSessionChecked] = useState(false);

  // ─── Restore session on mount ──────────────────────────────────────────────
  useEffect(() => {
    const restore = async () => {
      if (!token) { setSessionChecked(true); return; }
      try {
        const res = await authApi.getSession(token);
        setUser(res.user);
        setRole(res.role);
        await fetchWishlist(token);
        await fetchNotifications(token);
      } catch {
        // Token expired or invalid — clear it
        localStorage.removeItem('nv_token');
        setToken(null);
      } finally {
        setSessionChecked(true);
      }
    };
    restore();
  }, []); // eslint-disable-line

  // ─── Wishlist ──────────────────────────────────────────────────────────────
  const fetchWishlist = useCallback(async (t = token) => {
    if (!t) return;
    try {
      const res = await wishlistApi.get(t);
      setWishlist(res.data || []);
    } catch { /* silent */ }
  }, [token]);

  // ─── Notifications ─────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async (t = token, history = false) => {
    if (!t) return;
    try {
      const res = await notificationsApi.get(t, history);
      setNotifications(res.data || []);
      if (!history) setUnreadCount(res.unreadCount || 0);
    } catch { /* silent */ }
  }, [token]);

  // ─── Sign In ───────────────────────────────────────────────────────────────
  const signIn = async (email, password) => {
    const res = await authApi.signIn({ email, password });
    const t = res.session.access_token;
    localStorage.setItem('nv_token', t);
    setToken(t);
    setUser(res.user);
    setRole(res.role);
    await fetchWishlist(t);
    await fetchNotifications(t);
    return res;
  };

  // ─── Sign Out ──────────────────────────────────────────────────────────────
  const signOut = async () => {
    try { if (token) await authApi.signOut(token); } catch { /* best effort */ }
    localStorage.removeItem('nv_token');
    setToken(null);
    setUser(null);
    setRole('user');
    setWishlist([]);
    setNotifications([]);
    setUnreadCount(0);
  };

  // ─── Toggle Wishlist ───────────────────────────────────────────────────────
  const toggleWishlist = async (itemId) => {
    if (!token) throw new Error('login_required');
    const isWishlisted = wishlist.includes(itemId);
    if (isWishlisted) {
      setWishlist(prev => prev.filter(id => id !== itemId));
      await wishlistApi.remove(itemId, token);
    } else {
      setWishlist(prev => [...prev, itemId]);
      await wishlistApi.add(itemId, token);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, role, token, wishlist, notifications, unreadCount,
      sessionChecked,
      signIn, signOut,
      toggleWishlist,
      fetchWishlist,
      fetchNotifications,
      setNotifications,
      setUnreadCount,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
