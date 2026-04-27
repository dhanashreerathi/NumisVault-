import { Router } from 'express';
import { supabase, supabaseAdmin } from '../services/supabase.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// ─── Get All Users (admin only) ───────────────────────────────────────────────
router.get('/users', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.rpc('get_admin_user_list');

  if (error) return res.status(500).json({ error: 'Failed to load user data.' });
  return res.json({ data });
});

// ─── Ban / Unban User ─────────────────────────────────────────────────────────
router.patch('/users/:userId/ban', requireAdmin, async (req, res) => {
  const { userId } = req.params;
  const { is_banned } = req.body;

  if (typeof is_banned !== 'boolean') {
    return res.status(400).json({ error: 'is_banned must be a boolean.' });
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ is_banned })
    .eq('id', userId)
    .select();

  if (error || !data || data.length === 0) {
    return res.status(500).json({ error: 'Failed to update status. Check admin permissions.' });
  }

  return res.json({ message: `User successfully ${is_banned ? 'banned' : 'unbanned'}.`, data });
});

// ─── Add New Vault Item ───────────────────────────────────────────────────────
router.post('/vault', requireAdmin, async (req, res) => {
  const {
    unique_id, item_type, title, denomination, country,
    year_issued, era, serial_number, description,
    image_front_url, image_back_url, is_unique_serial, is_error
  } = req.body;

  if (!title || !denomination || !country) {
    return res.status(400).json({ error: 'Title, Denomination, and Country are required.' });
  }

  const { error } = await supabase.from('collection_items').insert([{
    unique_id, item_type, title, denomination, country,
    year_issued, era, serial_number: serial_number || 'N/A', description,
    image_front_url, image_back_url, is_unique_serial, is_error
  }]);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ message: `${title} has been added to the Vault.` });
});

export default router;
