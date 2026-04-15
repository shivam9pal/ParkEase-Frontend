/**
 * 1250.5 → "₹1,250.50"
 */
export const formatCurrency = (amount, decimals = 2) => {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('en-IN', {
    style                : 'currency',
    currency             : 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
};

/**
 * 1250500.75 → "₹12.51L" (compact Indian notation)
 */
export const formatCurrencyCompact = (amount) => {
  if (amount === null || amount === undefined) return '—';
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)}Cr`;
  if (amount >= 100_000)    return `₹${(amount / 100_000).toFixed(2)}L`;
  if (amount >= 1_000)      return `₹${(amount / 1_000).toFixed(1)}K`;
  return `₹${amount.toFixed(0)}`;
};