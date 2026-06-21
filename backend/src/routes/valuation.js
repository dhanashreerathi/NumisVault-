import { Router } from 'express';
import fetch from 'node-fetch';
import { requireAdmin } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const router = Router();

const valuationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { error: 'Valuation limit reached. Please try again in an hour.' },
});

// ─── POST /api/valuation ───────────────────────────────────────────────────────
// Admin only — sends item details + optional image to Gemini for valuation
router.post('/', valuationLimiter, requireAdmin, async (req, res) => {
  const { title, item_type, country, year_issued, era, denomination, serial_number, is_error, is_unique_serial, description, image_base64, image_mime } = req.body;

  if (!title || !country) {
    return res.status(400).json({ error: 'Title and country are required for valuation.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Valuation service not configured.' });
  }

  try {
    const itemDetails = `
Item Type: ${item_type || 'unknown'}
Title: ${title}
Country: ${country}
Year Issued: ${year_issued || 'Not Determined'}
Historical Era: ${era || 'Unknown'}
Denomination: ${denomination || 'Unknown'}
Serial Number: ${serial_number || 'N/A'}
Is Error Item: ${is_error ? 'YES — printing/minting error' : 'No'}
Is Unique Serial: ${is_unique_serial ? 'YES — special serial number' : 'No'}
Additional Notes: ${description || 'None'}
    `.trim();

    const prompt = `You are a professional numismatic appraiser with 30 years of experience valuing rare coins and currency notes worldwide.

Analyze the following item and provide a market valuation estimate:

${itemDetails}

${image_base64 ? 'I have also provided an image of this item for visual condition assessment.' : 'Note: No image provided — base valuation on provided details only.'}

Respond ONLY with a JSON object in this exact format (no markdown, no explanation):
{
  "condition": "Poor | Fair | Good | Very Good | Fine | Very Fine | Extremely Fine | Uncirculated | Gem Uncirculated",
  "condition_notes": "Brief explanation of visible condition indicators",
  "low_estimate": 50,
  "high_estimate": 150,
  "currency": "USD",
  "confidence": "Low | Medium | High",
  "confidence_reason": "Why this confidence level",
  "key_value_factors": ["factor 1", "factor 2", "factor 3"],
  "rarity": "Common | Uncommon | Scarce | Rare | Very Rare | Extremely Rare",
  "collector_demand": "Low | Moderate | High | Very High",
  "appraisal_notes": "2-3 sentences of professional commentary on this piece",
  "disclaimer": "This is an AI-generated estimate for reference only. Actual market value may vary. Consult a certified numismatist for official appraisal."
}`;

    // Build Gemini request — with or without image
    const userParts = [];
    if (image_base64 && image_mime) {
      userParts.push({ inline_data: { mime_type: image_mime, data: image_base64 } });
    }
    userParts.push({ text: prompt });

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: userParts }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 800 },
        }),
      }
    );

    const geminiData = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error('Gemini valuation error:', geminiData);
      return res.status(502).json({ error: 'Valuation service temporarily unavailable.' });
    }

    const raw = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    let valuation = null;
    try {
      const cleaned = raw.replace(/```json|```/g, '').trim();
      valuation = JSON.parse(cleaned);
    } catch {
      return res.status(502).json({ error: 'Could not parse valuation response. Please try again.' });
    }

    return res.json({ valuation, item: { title, country, year_issued, item_type } });

  } catch (err) {
    console.error('Valuation error:', err);
    return res.status(500).json({ error: 'Valuation failed. Please try again.' });
  }
});

export default router;
