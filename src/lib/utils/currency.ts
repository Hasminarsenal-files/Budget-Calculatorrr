export const currencySymbols: Record<string, string> = {
  PHP: '₱',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  SGD: 'S$',
  CAD: 'C$',
  AUD: 'A$'
};

/**
 * Converts a floating point currency value to integer cents to prevent JS floating point inaccuracies.
 */
export function toCents(amount: number): number {
  if (isNaN(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100);
}

/**
 * Converts integer cents back to a standard floating point money value.
 */
export function fromCents(cents: number): number {
  if (isNaN(cents)) return 0;
  return cents / 100;
}

/**
 * Safe floating-point free addition of money amounts.
 */
export function addMoney(amountA: number, amountB: number): number {
  return fromCents(toCents(amountA) + toCents(amountB));
}

/**
 * Safe floating-point free subtraction of money amounts.
 */
export function subMoney(amountA: number, amountB: number): number {
  return fromCents(toCents(amountA) - toCents(amountB));
}

/**
 * Formats a monetary amount into a clean localized currency string.
 */
export function formatCurrency(amount: number, currencyCode = 'PHP'): string {
  const symbol = currencySymbols[currencyCode] || '₱';
  const absVal = Math.abs(amount);
  const formatted = absVal.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return amount < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}
