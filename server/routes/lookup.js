import { Router } from 'express';
import { lookup } from '../metadata.js';

const router = Router();

// GET /api/lookup/:isbn — fetch metadata only, used to prefill the add form.
router.get('/:isbn', async (req, res) => {
  try {
    const meta = await lookup(req.params.isbn);
    res.json(meta);
  } catch (err) {
    res.status(err.status || 502).json({ error: err.message });
  }
});

export default router;
