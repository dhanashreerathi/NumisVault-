import { Router } from 'express';
import { supabase } from '../services/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ─── Fetch Notifications ──────────────────────────────────────────────────────
// Query params: ?history=true
router.get('/', requireAuth, async (req, res) => {
  const isHistory = req.query.history === 'true';
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', req.user.id)
    .maybeSingle();

  const role = profile?.role || 'user';

  let query = supabase
    .from('item_inquiries')
    .select('*, profiles(full_name, email, phone), collection_items(title, description, unique_id)')
    .order('created_at', { ascending: false });

  if (role === 'admin') {
    query = isHistory
      ? query.in('status', ['viewed', 'archived'])
      : query.eq('status', 'pending');
  } else {
    query = isHistory
      ? query.eq('status', 'archived')
      : query.eq('status', 'viewed');
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const unreadCount = !isHistory ? (data?.length || 0) : 0;
  return res.json({ data: data || [], unreadCount, role });
});

// ─── Acknowledge Inquiry (admin) ──────────────────────────────────────────────
router.patch('/:id/acknowledge', requireAuth, async (req, res) => {
  const { error } = await supabase
    .from('item_inquiries')
    .update({ status: 'viewed' })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ message: 'Inquiry acknowledged.' });
});

// ─── Dismiss Inquiry (user) ───────────────────────────────────────────────────
router.patch('/:id/dismiss', requireAuth, async (req, res) => {
  const { error } = await supabase
    .from('item_inquiries')
    .update({ status: 'archived' })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ message: 'Inquiry dismissed.' });
});

// ─── Contact Owner / Send Inquiry ─────────────────────────────────────────────
router.post('/inquire', requireAuth, async (req, res) => {
  const { item_id } = req.body;

  if (!item_id) return res.status(400).json({ error: 'item_id is required.' });

  const { error } = await supabase
    .from('item_inquiries')
    .insert([{ user_id: req.user.id, item_id, status: 'pending' }]);

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'duplicate' });
    }
    return res.status(500).json({ error: 'Failed to send inquiry.' });
  }

  return res.json({ message: 'Request sent to admin.' });
});

export default router;
