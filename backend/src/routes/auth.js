import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { supabase, supabaseAdmin } from '../services/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts, please try again later.' },
});

// ─── Sign Up ──────────────────────────────────────────────────────────────────
router.post('/signup', authLimiter, async (req, res) => {
  const { email, password, full_name } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Email, password, and name are required.' });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name } },
  });

  if (error) return res.status(400).json({ error: error.message });
  return res.json({ message: 'Registration successful! Please verify your email.', data });
});

// ─── Sign In ──────────────────────────────────────────────────────────────────
router.post('/signin', authLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.toLowerCase().includes('email not confirmed')) {
      return res.status(400).json({ error: 'email_not_confirmed' });
    }
    return res.status(400).json({ error: 'Invalid email or password.' });
  }

  // Check ban status
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_banned')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profile?.is_banned) {
    await supabase.auth.signOut();
    return res.status(403).json({ error: 'This account has been suspended by the administrator.' });
  }

  return res.json({
    session: data.session,
    user: data.user,
    role: profile?.role || 'user',
  });
});

// ─── Sign Out ─────────────────────────────────────────────────────────────────
router.post('/signout', requireAuth, async (req, res) => {
  const { error } = await supabase.auth.signOut();
  if (error) console.warn('Sign out warning:', error.message);
  return res.json({ message: 'Signed out successfully.' });
});

// ─── Get Session / Current User ───────────────────────────────────────────────
router.get('/session', requireAuth, async (req, res) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_banned')
    .eq('id', req.user.id)
    .maybeSingle();

  if (profile?.is_banned) {
    return res.status(403).json({ error: 'Account suspended.' });
  }

  return res.json({ user: req.user, role: profile?.role || 'user' });
});

// ─── Password Reset Email ─────────────────────────────────────────────────────
router.post('/reset-password', authLimiter, async (req, res) => {
  const { email, redirectTo } = req.body;

  if (!email) return res.status(400).json({ error: 'Email is required.' });

  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) return res.status(400).json({ error: error.message });
  return res.json({ message: 'Password reset link sent! Please check your inbox.' });
});

// ─── Update Password (logged-in user) ────────────────────────────────────────
router.post('/update-password', requireAuth, async (req, res) => {
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  // Use the user's own token to update their password
  const userSupabase = supabase;
  const { error } = await userSupabase.auth.updateUser(
    { password },
    { accessToken: req.accessToken }
  );

  if (error) return res.status(400).json({ error: error.message });
  return res.json({ message: 'Password updated successfully!' });
});

// ─── Resend Verification Email ────────────────────────────────────────────────
router.post('/resend-verification', authLimiter, async (req, res) => {
  const { email, redirectTo } = req.body;

  if (!email) return res.status(400).json({ error: 'Email is required.' });

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    if (error.status === 429 || error.message.toLowerCase().includes('rate limit')) {
      return res.status(429).json({ error: 'Please wait a few minutes before requesting another link.' });
    }
    return res.status(400).json({ error: error.message });
  }

  return res.json({ message: 'Verification email resent successfully.' });
});

// ─── Delete Account ───────────────────────────────────────────────────────────
router.delete('/delete-account', requireAuth, async (req, res) => {
  const { error } = await supabase.rpc('delete_my_account');

  if (error) return res.status(500).json({ error: 'Failed to delete account. Please try again.' });
  return res.json({ message: 'Account deleted successfully.' });
});

export default router;
