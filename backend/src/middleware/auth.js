import { supabase } from '../services/supabase.js';

/**
 * Validates the Bearer token sent from the React frontend.
 * Attaches req.user and req.supabaseClient (with the user's token set) on success.
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required.' });
  }

  const token = authHeader.split(' ')[1];

  // Verify the token with Supabase
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }

  req.user = user;
  req.accessToken = token;
  next();
}

/**
 * Like requireAuth but also checks that the user's profile has role = 'admin'.
 */
export async function requireAdmin(req, res, next) {
  await requireAuth(req, res, async () => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, is_banned')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error || !profile) {
      return res.status(403).json({ error: 'Could not verify admin role.' });
    }
    if (profile.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: Admin only.' });
    }

    req.userRole = 'admin';
    next();
  });
}
