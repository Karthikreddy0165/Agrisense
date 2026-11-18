export type PriceDirection = 'up' | 'down' | 'neutral';

/**
 * Calculate percentage change between two prices
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Get price direction label
 */
export function getPriceDirection(current: number, previous: number): PriceDirection {
  const diff = current - previous;
  if (Math.abs(diff) < 1) return 'neutral';
  return diff > 0 ? 'up' : 'down';
}

/**
 * Calculate average of an array of numbers
 */
export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculate min and max from an array
 */
export function minMax(values: number[]): { min: number; max: number } {
  if (values.length === 0) return { min: 0, max: 0 };
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

/**
 * Generate a date string N days from a base date
 */
export function addDays(baseDateStr: string, days: number): string {
  const date = new Date(baseDateStr + 'T00:00:00');
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Generate an array of date strings from start to end (inclusive)
 */
export function dateRange(startStr: string, endStr: string): string[] {
  const dates: string[] = [];
  const current = new Date(startStr + 'T00:00:00');
  const end = new Date(endStr + 'T00:00:00');
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/**
 * Simple deterministic pseudo-random generator (seeded)
 * Returns a value between 0 and 1
 */
export function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}
