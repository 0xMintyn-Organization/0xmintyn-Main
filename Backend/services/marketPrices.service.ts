import axios from 'axios';

const COINS = ['OXMUSDT', 'BTCUSDT', 'ETHUSDT'];
const BITGET_TICKERS_URL = 'https://api.bitget.com/api/v2/spot/market/tickers';

let latestPrices: Record<string, any> = {};
let pollingHandle: ReturnType<typeof setInterval> | null = null;

async function fetchTicker(symbol: string) {
  const response = await axios.get(BITGET_TICKERS_URL, {
    params: { symbol },
  });
  return response.data?.data?.[0] ?? null;
}

async function refreshPrices() {
  try {
    const updates = await Promise.all(COINS.map(async (symbol) => ({
      symbol,
      data: await fetchTicker(symbol),
    })));
    updates.forEach(({ symbol, data }) => {
      if (data) {
        latestPrices[symbol] = data;
      }
    });
  } catch (error) {
    console.error('Failed to refresh market prices', error);
  }
}

export function startMarketPricesPolling(intervalMs = 10_000) {
  if (pollingHandle) {
    return;
  }
  refreshPrices();
  pollingHandle = setInterval(() => {
    refreshPrices();
  }, intervalMs);
}

export function getLatestMarketPrices() {
  return COINS.map((symbol) => ({
    symbol,
    data: latestPrices[symbol] ?? null,
  }));
}
