// services/bitgetClient.js
import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = process.env.BITGET_BASE_URL || 'https://api.bitget.com';
const API_KEY = process.env.BITGET_API_KEY;
const SECRET_KEY = process.env.BITGET_SECRET_KEY;
const PASSPHRASE = process.env.BITGET_PASSPHRASE;

// helper to sign requests for Bitget API
function createSignature({ method = 'GET', requestPath = '', query = '', body = '' }) {
  // Ensure timestamp in seconds with ms precision string as docs require
  const timestamp = Date.now().toString();
  // If body is object, stringify without spaces; if empty, ''
  const bodyStr = body && typeof body === 'object' ? JSON.stringify(body) : (body || '');
  const prehash = `${timestamp}${method.toUpperCase()}${requestPath}${query}${bodyStr}`;
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(prehash);
  const signature = hmac.digest('base64');
  return { sign: signature, timestamp };
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
  
  // For signature: GET requests have empty body, POST requests have JSON stringified body
  const bodyForSignature = method === 'GET' ? '' : JSON.stringify(body);
  
  const { sign, timestamp } = createSignature({
    method,
    requestPath,
    query,
    body: bodyForSignature
  });

  const headers: any = {
    'ACCESS-KEY': API_KEY,
    'ACCESS-SIGN': sign,
    'ACCESS-TIMESTAMP': timestamp,
    'ACCESS-PASSPHRASE': PASSPHRASE,
  };

  // Only add Content-Type for POST/PUT requests with body
  if (method !== 'GET' && Object.keys(body).length > 0) {
    headers['Content-Type'] = 'application/json';
  }

  const url = requestPath + query;
  
  // For GET requests, don't send body at all. For POST/PUT, send JSON body.
  const requestConfig: any = {
    url,
    method,
    headers,
  };
  
  if (method !== 'GET' && Object.keys(body).length > 0) {
    requestConfig.data = body;
  }
  
  const res = await client.request(requestConfig);
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
  // Bitget API v2 format:
  // order = {
  //   symbol: string (e.g., 'ETHUSDT'),
  //   side: 'buy' | 'sell',
  //   orderType: 'market' | 'limit',
  //   size: string (amount in base currency),
  //   clientOid: string (unique client order ID),
  //   price?: string (required for limit orders)
  // }
  const path = '/api/v2/spot/trade/place-order';
  
  // Ensure size is a string (Bitget API requires string format)
  const formattedOrder = {
    ...order,
    size: String(order.size),
    ...(order.price && { price: String(order.price) }),
  };
  
  return privateRequest({ method: 'POST', path, body: formattedOrder });
}

export async function getAccount() {
  const path = '/api/v2/mix/account/accounts';
  return privateRequest({ method: 'GET', path });
}

// Get spot account assets
export async function getSpotAccount() {
  const path = '/api/v2/spot/account/assets';
  return privateRequest({ method: 'GET', path });
}

// Get order info
export async function getOrderInfo(params: { orderId?: string; clientOid?: string }) {
  const path = '/api/v2/spot/trade/orderInfo';
  return privateRequest({ method: 'GET', path, params });
}

// Get order history
export async function getOrderHistory(params: { symbol?: string; startTime?: string; endTime?: string; pageSize?: number }) {
  const path = '/api/v2/spot/trade/orders';
  return privateRequest({ method: 'GET', path, params });
}

export default {
  getCandles,
  placeSpotOrder,
  getAccount,
  getSpotAccount,
  getOrderInfo,
  getOrderHistory,
};
