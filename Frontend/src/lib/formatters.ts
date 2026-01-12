// used in Exchange 24h Trading Volume (Without Currency Symbol)
export default function formatNumber(num: number) {
  return "$" + num.toLocaleString("en-US");
}

// used in My Profile UBI & Financials with currency and 2 fraction digits
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Format Mintyn tokens (0XM) - used throughout Education Hub
export function formatMintyn(value: number, decimals: number = 0): string {
  // Format number with commas, no decimals by default
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
  
  return `${formatted} 0XM`;
}

// Format Mintyn tokens with decimals (for precise amounts)
export function formatMintynPrecise(value: number): string {
  return formatMintyn(value, 2);
}

// Format Mintyn tokens for display (whole numbers)
export function formatMintynDisplay(value: number): string {
  return formatMintyn(value, 0);
}

// Format timestamp to relative time
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;

  return date.toLocaleDateString();
};



export const formatDate = (isoDate: string): string => {
  return new Date(isoDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};