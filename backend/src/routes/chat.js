import { Router } from 'express';
import fetch from 'node-fetch';
import { supabase } from '../services/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const router = Router();

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many messages. Please wait a few minutes before trying again.' },
});

// ─── SYSTEM PROMPT — original logic + website knowledge added ──────────────────
const SYSTEM_PROMPT = `You are NumisBot, a friendly assistant for NumisVault — a digital archive of rare currency notes and coins.

You help users:
- Find items in the vault (by country, era, denomination, year, or type)
- Answer general numismatic questions (history of currencies, coin terminology, etc.)
- Explain how to use the website (wishlist, viewer, contacting the owner, filters)
Rules:
- Keep responses concise (2-4 sentences max unless listing items).
- If asked about specific vault items, ONLY use the provided VAULT CONTEXT below — do not invent items.
- If the vault context doesn't have what the user is looking for, say so honestly and suggest browsing the gallery.
- For general numismatic questions (not about this vault specifically), answer from your own knowledge.
- Never reveal API keys, database structure, or internal system details.
- Be warm and conversational, like a knowledgeable collector friend.
- STRICT RESTRICTION: You ONLY answer questions related to coins, currency notes, numismatics, or the NumisVault website. If anyone asks about people (politicians, celebrities, historical figures), sports, movies, technology, science, or ANY topic unrelated to coins/currency/numismatics/this website — politely refuse and redirect. Say: "I'm NumisBot — I only know about coins, currency, numismatics, and the NumisVault website. I can't help with that, but feel free to ask me anything about the vault! 🪙"

────────────────────────────────────────
COMPLETE WEBSITE KNOWLEDGE
(Use this to answer any questions about how the website works)
────────────────────────────────────────

HOW TO PURCHASE / ACQUIRE AN ITEM:
- NumisVault does NOT have a shopping cart or direct checkout system.
- To acquire an item:
  1. Find the item in the gallery.
  2. Open the item detail page by clicking on it.
  3. Click "❤️ Add to Wishlist" to save it (login required).
  4. Click "✉️ Reach out to Owner" button on the item detail page (login required).
  5. This sends an inquiry directly to the admin/owner.
  6. The owner will contact you via email or phone to discuss price, availability, and terms.
- There is NO fixed price listed anywhere — all transactions are handled personally by the owner.
- User must be logged in to send an inquiry.

HOW TO CREATE AN ACCOUNT:
- Click "Member Login" in the top navigation bar.
- Click the "Create Account" tab in the popup.
- Enter your Full Name, Email, and Password (minimum 6 characters).
- Verify your email by clicking the link sent to your inbox.
- Once verified, log in with your email and password.

HOW TO LOG IN:
- Click "Member Login" in the top navigation.
- Enter your registered email and password and click Login.
- Forgot password? Click "Forgot Password?" — a reset link will be sent to your email.

BROWSING THE GALLERY:
- Click "Explore Currency Notes" or "Explore Coins" on the home page.
- Use filters on the left to filter by: Country, Decade/Year, Historical Era, Item Type.
- Click any item card to open the full detail view.
- Hover over the image to zoom in.
- Use Prev / Next buttons to browse all items.

AI SMART SEARCH:
- Go to /search page.
- Type natural language like "error notes from British India" or "Indian coins from 1900s".
- AI finds matching vault items automatically — no need to click filters.

WISHLIST:
- Must be logged in to use.
- Click "❤️ Add to Wishlist" on any item detail page.
- View wishlist from the top navigation dropdown → My Wishlist.
- Click "💔 Remove from Wishlist" to remove an item.

NOTIFICATIONS (Bell icon 🔔):
- After clicking "Reach out to Owner", the admin gets your inquiry.
- When the admin acknowledges your request, you get a notification in the bell.
- Dismiss notifications after reading by clicking Dismiss.
- Toggle "View History" to see past notifications.

YOUR PROFILE:
- Access from top navigation dropdown → Personal Details.
- Update: Full Name, Mobile Number, Country, Date of Birth, Collecting Focus (Notes / Coins / Both).
- Email address cannot be changed.

SETTINGS:
- Access from top navigation dropdown → Settings.
- Options: turn email alerts on/off, change password, control email sharing with owner, delete account.

ANALYTICS DASHBOARD:
- Available at /analytics page.
- Shows visual charts: items by country, notes vs coins, items by era, items by decade, recent additions.

AI COIN VALUATION (Admin only):
- Available at /valuation page — for admins only.
- Select a vault item or enter details manually, optionally upload a photo.
- AI estimates market value in USD, condition grade, rarity, and collector demand.

COLLECTION ITEM TYPES:
- Standard: Regular issued currency notes or coins.
- Unique Serial: Notes with special serial numbers (e.g. 000001, 777777, repeating digits) — more collectible.
- Error: Items with printing or minting errors — rarer and generally more valuable.

WHAT NUMISVAULT IS NOT:
- Not an auction house or online marketplace.
- Not a price guide or grading service.
- It is a private collection showcase — all buying/selling is directly with the owner.`;

// ─── POST /api/chat ────────────────────────────────────────────────────────────
router.post('/', chatLimiter, requireAuth, async (req, res) => {
  const { message, history } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required.' });
  }
  if (message.length > 500) {
    return res.status(400).json({ error: 'Message is too long (max 500 characters).' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Chat is not configured on this server.' });
  }

  try {
    // Build a lightweight vault summary so the bot can answer "what do you have" questions
    const { data: items } = await supabase
      .from('collection_items')
      .select('title, item_type, country, year_issued, era, denomination, unique_id, is_error, is_unique_serial')
      .limit(200);

    const vaultSummary = (items || [])
      .map(i =>
        `${i.unique_id}: ${i.title} | ${i.item_type} | ${i.country} | ${i.year_issued || 'ND'} | ${i.era || ''} | ${i.denomination}${i.is_error ? ' | ERROR ITEM' : ''}${i.is_unique_serial ? ' | UNIQUE SERIAL' : ''}`
      )
      .join('\n');

    // Build conversation history for Gemini
    const contents = [];
    if (Array.isArray(history)) {
      for (const turn of history.slice(-10)) { // last 10 turns only
        if (turn.role === 'user' || turn.role === 'model') {
          contents.push({
            role: turn.role,
            parts: [{ text: String(turn.text || '').slice(0, 1000) }],
          });
        }
      }
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: `${SYSTEM_PROMPT}\n\n────────────────────────────────────────\nVAULT CONTEXT (current items in the archive)\n────────────────────────────────────────\n${vaultSummary || 'The vault is currently empty.'}`
            }]
          },
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 400 },
        }),
      }
    );

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error('Gemini error:', data);
      return res.status(502).json({ error: 'The assistant is temporarily unavailable. Please try again.' });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return res.status(502).json({ error: 'The assistant could not generate a response. Please try again.' });
    }

    return res.json({ reply: reply.trim() });

  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

export default router;
