// services/bitgetClient.js
import axios from 'axios';
import crypto, { sign } from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = process.env.BITGET_BASE_URL || 'https://api.bitget.com';
const API_KEY = process.env.BITGET_API_KEY;
const SECRET_KEY = process.env.BITGET_SECRET_KEY;
const PASSPHRASE = process.env.BITGET_PASSPHRASE;

// helper to sign
function sign({ method = 'GET', requestPath = '', query = '', body = '' }) {
  // Ensure timestamp in seconds with ms precision string as docs require
  const timestamp = Date.now().toString();
  // If body is object, stringify without spaces; if empty, ''
  const bodyStr = body && typeof body === 'object' ? JSON.stringify(body) : (body || '');
  const prehash = `${timestamp}${method.toUpperCase()}${requestPath}${query}${bodyStr}`;
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(prehash);
  const sign = hmac.digest('base64');
  return { sign, timestamp };
}

// axios instance
const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

async function publicGet(path, params = {}) {
  return client.get(path, { params }).then(r => r.data);
}

async function privateRequest({ method = 'GET', path, params = {}, body = {} }) {
  const requestPath = path; // e.g. '/api/spot/v1/market/candles'
  const query = (method === 'GET' && params && Object.keys(params).length)
    ? '?' + new URLSearchParams(params).toString()
    : '';
  const { sign, timestamp } = sign({
    method,
    requestPath,
    query,
    body: method === 'GET' ? '' : JSON.stringify(body)
  });

  const headers = {
    'ACCESS-KEY': API_KEY,
    'ACCESS-SIGN': sign,
    'ACCESS-TIMESTAMP': timestamp,
    'ACCESS-PASSPHRASE': PASSPHRASE,
    'Content-Type': 'application/json'
  };

  const url = requestPath + query;
  const res = await client.request({ url, method, data: body, headers });
  return res.data;
}

/* Example helpers you will use */
export async function getCandles(symbol = 'BTCUSDT', period = '1m', limit = 200) {
  // Public endpoint path — replace with exact path from Bitget docs if different
  const path = '/api/v2/spot/market/candles';
  const params = { symbol, period, limit };
  // Use publicGet if endpoint public; use publicGet for speed/no-sign
  return publicGet(path, params);
}

export async function placeSpotOrder(order) {
  // order = {symbol, side: 'buy'|'sell', type: 'limit'|'market', price, size, clientOid}
  const path = '/api/v2/spot/trade/place-order';
  return privateRequest({ method: 'POST', path, body: order });
}

export async function getAccount() {
  const path = '/api/v2/mix/account/accounts';
  return privateRequest({ method: 'GET', path });
}

export default {
  getCandles, placeSpotOrder, getAccount
};
