// routes/market.js
import express from 'express';
import bitget from '../services/bitgetClient.service';
const router = express.Router();

// GET /api/market/candles?symbol=BTCUSDT&period=1m&limit=200
router.get('/candles', async (req, res) => {
  try {
    const { symbol = 'BTCUSDT', period = '1m', limit = 200 } = req.query;
    const data = await bitget.getCandles(symbol, period, limit);
    // Transform response to standard: [{time, open, high, low, close, volume}, ...]
    return res.json({ ok: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/ticker', async (req, res) => {
  // implement using public endpoint
});

export default router;
