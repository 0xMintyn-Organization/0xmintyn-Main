'use client';

// DISABLED: Live price API polling completely stopped
// This hook now returns static values without making any API calls

type LiveTicker = {
  price: number | null;
  bid: number | null;
  ask: number | null;
  high: number | null;
  low: number | null;
  open: number | null;
  timestamp: number | null;
  loading: boolean;
};

// Static state - no API calls, no polling
const staticTicker: LiveTicker = {
  price: null,
  bid: null,
  ask: null,
  high: null,
  low: null,
  open: null,
  timestamp: null,
  loading: false,
};

export default function useLiveTicker(): LiveTicker {
  // DISABLED: Completely stopped - no API calls, no state, no effects
  // Return static value immediately
  return staticTicker;
}
