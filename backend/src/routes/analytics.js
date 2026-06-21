import { Router } from 'express';
import { supabase } from '../services/supabase.js';

const router = Router();

// ─── GET /api/analytics ────────────────────────────────────────────────────────
// Returns aggregated stats for the analytics dashboard
router.get('/', async (req, res) => {
  try {
    const { data: items, error } = await supabase
      .from('collection_items')
      .select('id, item_type, country, era, year_issued, is_unique_serial, is_error, created_at');

    if (error) throw error;
    if (!items || items.length === 0) {
      return res.json({ empty: true });
    }

    // ── By type ──────────────────────────────────────────────────────────────
    const byType = { note: 0, coin: 0 };
    items.forEach(i => { if (i.item_type === 'note') byType.note++; else byType.coin++; });

    // ── By country (top 10) ──────────────────────────────────────────────────
    const countryCount = {};
    items.forEach(i => {
      const c = i.country || 'Unknown';
      countryCount[c] = (countryCount[c] || 0) + 1;
    });
    const byCountry = Object.entries(countryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // ── By era ───────────────────────────────────────────────────────────────
    const eraCount = {};
    items.forEach(i => {
      const e = i.era || 'Unknown Era';
      eraCount[e] = (eraCount[e] || 0) + 1;
    });
    const byEra = Object.entries(eraCount)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    // ── By decade ────────────────────────────────────────────────────────────
    const decadeCount = {};
    items.forEach(i => {
      const y = String(i.year_issued || '').match(/\d{4}/);
      const decade = y ? `${Math.floor(parseInt(y[0]) / 10) * 10}s` : 'Unknown';
      decadeCount[decade] = (decadeCount[decade] || 0) + 1;
    });
    const byDecade = Object.entries(decadeCount)
      .filter(([d]) => d !== 'Unknown')
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));

    // ── Special items ────────────────────────────────────────────────────────
    const errorItems  = items.filter(i => i.is_error).length;
    const serialItems = items.filter(i => i.is_unique_serial).length;
    const standard    = items.length - errorItems - serialItems;

    const bySpecial = [
      { name: 'Standard', count: standard },
      { name: 'Unique Serial', count: serialItems },
      { name: 'Error', count: errorItems },
    ];

    // ── Recent additions (last 6 months, grouped by month) ──────────────────
    const monthCount = {};
    const now = new Date();
    items.forEach(i => {
      const d = new Date(i.created_at);
      const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
      if (diffMonths <= 5) {
        const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        monthCount[key] = (monthCount[key] || 0) + 1;
      }
    });
    const recentAdditions = Object.entries(monthCount)
      .map(([name, count]) => ({ name, count }));

    return res.json({
      total: items.length,
      byType,
      byCountry,
      byEra,
      byDecade,
      bySpecial,
      recentAdditions,
      errorItems,
      serialItems,
    });

  } catch (err) {
    console.error('Analytics error:', err);
    return res.status(500).json({ error: 'Failed to load analytics.' });
  }
});

export default router;
