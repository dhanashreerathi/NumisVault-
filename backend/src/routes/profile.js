import { Router } from 'express';
import { supabase } from '../services/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ─── Get Profile ──────────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, email, collecting_focus, phone_code, phone, country, dob')
    .eq('id', req.user.id)
    .maybeSingle();

  if (error) return res.status(500).json({ error: 'Error loading profile.' });
  return res.json({ data });
});

// ─── Update Profile ───────────────────────────────────────────────────────────
router.put('/', requireAuth, async (req, res) => {
  const { full_name, collecting_focus, phone_code, phone, country, dob } = req.body;

  if (!full_name) return res.status(400).json({ error: 'Name cannot be left blank.' });

  const { error } = await supabase
    .from('profiles')
    .update({ full_name, collecting_focus, phone_code: phone_code || null, phone: phone || null, country: country || null, dob: dob || null })
    .eq('id', req.user.id);

  if (error) return res.status(500).json({ error: 'Failed to save changes. Please try again.' });
  return res.json({ message: 'Profile updated successfully!' });
});

// ─── Get Settings ─────────────────────────────────────────────────────────────
router.get('/settings', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('email_alerts, share_email')
    .eq('id', req.user.id)
    .maybeSingle();

  if (error) return res.status(500).json({ error: 'Error loading settings.' });
  return res.json({ data });
});

// ─── Save Settings ────────────────────────────────────────────────────────────
router.put('/settings', requireAuth, async (req, res) => {
  const { email_alerts, share_email } = req.body;

  const { error } = await supabase
    .from('profiles')
    .update({ email_alerts, share_email })
    .eq('id', req.user.id);

  if (error) return res.status(500).json({ error: 'Failed to save preferences.' });
  return res.json({ message: 'Preferences saved successfully!' });
});

export default router;
