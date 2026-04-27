import { Router } from 'express';
import { supabase } from '../services/supabase.js';

const router = Router();

// ─── Fetch All Collection Items ───────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('collection_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ data });
});

export default router;
