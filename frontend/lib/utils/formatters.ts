/**
 * Format a price value as Indian Rupees per quintal
 */
export function formatPrice(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`;
}

/**
 * Format price with /quintal suffix
 */
export function formatPricePerQuintal(value: number): string {
  return `₹${value.toLocaleString('en-IN')}/qtl`;
}

/**
 * Format a date string (YYYY-MM-DD) to readable format
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Format a date string (YYYY-MM-DD) to short format
 */
export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/**
 * Format an ISO datetime string to readable format
 */
export function formatDateTime(isoStr: string): string {
  const date = new Date(isoStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a percentage change with sign
 */
export function formatPercentage(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Format a price change with sign
 */
export function formatPriceChange(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}₹${Math.abs(value).toLocaleString('en-IN')}`;
}

/**
 * Format a large number with Indian number system (lakhs, crores)
 */
export function formatIndianNumber(value: number): string {
  return value.toLocaleString('en-IN');
}

/**
 * Get a relative time label
 */
export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(dateStr);
}
