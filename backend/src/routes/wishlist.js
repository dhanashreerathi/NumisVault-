import { Router } from 'express';
import { supabase } from '../services/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ─── Get Wishlist ─────────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('user_wishlist')
    .select('item_id')
    .eq('user_id', req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ data: data.map(w => w.item_id) });
});

// ─── Add to Wishlist ──────────────────────────────────────────────────────────
router.post('/:itemId', requireAuth, async (req, res) => {
  const { itemId } = req.params;

  const { error } = await supabase
    .from('user_wishlist')
    .insert([{ user_id: req.user.id, item_id: itemId }]);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ message: 'Added to wishlist.' });
});

// ─── Remove from Wishlist ─────────────────────────────────────────────────────
router.delete('/:itemId', requireAuth, async (req, res) => {
  const { itemId } = req.params;

  const { error } = await supabase
    .from('user_wishlist')
    .delete()
    .match({ user_id: req.user.id, item_id: itemId });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ message: 'Removed from wishlist.' });
});

export default router;
