import { Router } from 'express';
import fetch from 'node-fetch';
import { supabase } from '../services/supabase.js';
import rateLimit from 'express-rate-limit';

const router = Router();

const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: { error: 'Too many search requests. Please wait a moment.' },
});

// ─── POST /api/search ──────────────────────────────────────────────────────────
// Accepts a natural language query, fetches vault, asks Gemini to filter + rank
router.post('/', searchLimiter, async (req, res) => {
  const { query } = req.body;

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'Search query is required.' });
  }
  if (query.length > 300) {
    return res.status(400).json({ error: 'Query too long (max 300 characters).' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Search service not configured.' });
  }

  try {
    // Fetch entire vault
    const { data: items, error } = await supabase
      .from('collection_items')
      .select('id, unique_id, title, item_type, country, year_issued, era, denomination, description, is_unique_serial, is_error, image_front_url');

    if (error) throw error;
    if (!items || items.length === 0) {
      return res.json({ results: [], message: 'The vault is currently empty.' });
    }

    // Build compact item list for Gemini
    const itemList = items.map(i =>
      `ID:${i.unique_id}|TYPE:${i.item_type}|TITLE:${i.title}|COUNTRY:${i.country}|YEAR:${i.year_issued || 'ND'}|ERA:${i.era || ''}|DENOM:${i.denomination}|ERROR:${i.is_error ? 'yes' : 'no'}|SERIAL:${i.is_unique_serial ? 'yes' : 'no'}`
    ).join('\n');

    const prompt = `You are a numismatic search engine for a vault of rare coins and currency notes.

A user searched for: "${query}"

Here are all items in the vault:
${itemList}

Your job:
1. Find ALL items that match the user's query (by country, era, type, denomination, year, or special attributes like error/serial).
2. Return ONLY a JSON array of matching unique_ids, ordered by relevance (best match first).
3. If nothing matches, return an empty array [].
4. Return ONLY the JSON array — no explanation, no markdown, no extra text.

Example response: ["N00001","C00003","N00007"]`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 500 },
        }),
      }
    );

    const geminiData = await geminiRes.json();
    const raw = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '[]';

    // Parse the returned unique_ids safely
    let matchedIds = [];
    try {
      const cleaned = raw.replace(/```json|```/g, '').trim();
      matchedIds = JSON.parse(cleaned);
      if (!Array.isArray(matchedIds)) matchedIds = [];
    } catch {
      matchedIds = [];
    }

    // Map back to full item objects preserving Gemini's ranking order
    const idMap = {};
    items.forEach(i => { idMap[i.unique_id] = i; });
    const results = matchedIds
      .filter(id => idMap[id])
      .map(id => idMap[id]);

    return res.json({ results, total: results.length, query });

  } catch (err) {
    console.error('Search error:', err);
    return res.status(500).json({ error: 'Search failed. Please try again.' });
  }
});

export default router;
