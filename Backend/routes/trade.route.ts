// routes/trade.js
import express from 'express';
import bitget from '../services/bitgetClient.service';
import { authenticate } from '../middleware/auth.js'; // your JWT auth middleware
const router = express.Router();

// POST /api/trade/place
router.post('/place', authenticate, async (req, res) => {
  try {
    const order = req.body;
    // Validate order shape
    const result = await bitget.placeSpotOrder(order);
    // Save order to DB with status pending
    return res.json({ ok: true, result });
  } catch (err) {
    console.error('place order error', err.response?.data || err.message);
    return res.status(400).json({ ok: false, error: err.response?.data || err.message });
  }
});

export default router;
