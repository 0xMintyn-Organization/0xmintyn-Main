// routes/market.js
import express from 'express';
import bitget from '../services/bitgetClient.service';
import { bitgetWebSocketService } from '../services/bitgetWebSocket.service';
import { getLatestMarketPrices } from '../services/marketPrices.service';
const router = express.Router();

// GET /api/market/candles?symbol=BTCUSDT&period=1m&limit=200
router.get('/candles', async (req, res) => {
  try {
    const symbol = typeof req.query.symbol === 'string' ? req.query.symbol : 'BTCUSDT';
    const period = typeof req.query.period === 'string' ? req.query.period : '1m';
    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 200;
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

router.get('/live-price', (req, res) => {
  const ticker = bitgetWebSocketService.getLastTicker();
  if (!ticker) {
    return res.status(503).json({ ok: false, message: 'Ticker data not ready yet' });
  }
  res.json({ ok: true, data: ticker });
});

router.get('/prices', (req, res) => {
  const prices = getLatestMarketPrices();
  return res.json({ ok: true, data: prices });
});

export default router;
