import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import fetch from 'node-fetch';
import { Readable } from 'stream';

const router = Router();

/**
 * Proxies the multipart/form-data image upload to the Cloudflare Worker.
 * We stream the raw body directly to preserve the exact multipart format
 * the Worker expects (front_image, back_image fields).
 */
router.post('/extract', requireAdmin, async (req, res) => {
  const workerUrl = process.env.CLOUDFLARE_WORKER_URL;

  if (!workerUrl) {
    return res.status(500).json({ error: 'AI worker URL not configured.' });
  }

  try {
    // Forward the raw multipart request to the Cloudflare Worker
    const contentType = req.headers['content-type'];

    const workerResponse = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
      },
      body: req, // Pipe the incoming stream directly
    });

    const result = await workerResponse.json();
    return res.status(workerResponse.status).json(result);

  } catch (err) {
    console.error('AI proxy error:', err);
    return res.status(500).json({ error: err.message || 'Failed to reach AI worker.' });
  }
});

export default router;
