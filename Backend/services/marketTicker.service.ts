// services/marketTicker.js
import bitget from './bitgetClient.service';
let ioRef = null;

export function initMarketTicker(io) {
  ioRef = io;
  // start polling for top symbols
  setInterval(async () => {
    try {
      const symbol = 'BTCUSDT';
      const candles = await bitget.getCandles(symbol, '1m', 5);
      // parse & send last candle
      const parsed = parseCandles(candles); // implement parse
      const latest = parsed[parsed.length - 1];
      io.emit('candle:update', latest);
    } catch (err) {
      console.error('poll error', err.message || err);
    }
  }, 5000); // poll every 5s (respect rate limits)
}
