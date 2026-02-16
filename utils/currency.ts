/**
 * Currency utility for Bangladeshi Taka (BDT)
 */

export const CURRENCY_CODE = 'BDT';
export const CURRENCY_SYMBOL = '৳';
export const CURRENCY_LOCALE = 'en-BD';

/**
 * Format price in Bangladeshi Taka
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted price string
 */
export function formatPrice(
  amount: number,
  options: {
    showSymbol?: boolean;
    showCode?: boolean;
    locale?: string;
  } = {}
): string {
  const {
    showSymbol = true,
    showCode = false,
    locale = CURRENCY_LOCALE
  } = options;

  if (showSymbol && showCode) {
    return `${CURRENCY_SYMBOL}${amount.toLocaleString(locale)} ${CURRENCY_CODE}`;
  } else if (showSymbol) {
    return `${CURRENCY_SYMBOL}${amount.toLocaleString(locale)}`;
  } else if (showCode) {
    return `${amount.toLocaleString(locale)} ${CURRENCY_CODE}`;
  } else {
    return amount.toLocaleString(locale);
  }
}

/**
 * Convert USD to BDT (approximate rate - you may want to use real-time rates)
 * @param usdAmount - Amount in USD
 * @returns Amount in BDT
 */
export function convertUSDtoBDT(usdAmount: number): number {
  const EXCHANGE_RATE = 117; // Approximate exchange rate (1 USD ≈ 117 BDT)
  return Math.round(usdAmount * EXCHANGE_RATE);
}

/**
 * Format a price that was originally in USD to BDT
 * @param usdAmount - Original USD amount
 * @param options - Formatting options
 * @returns Formatted BDT price string
 */
export function formatPriceFromUSD(
  usdAmount: number,
  options: {
    showSymbol?: boolean;
    showCode?: boolean;
  } = {}
): string {
  const bdtAmount = convertUSDtoBDT(usdAmount);
  return formatPrice(bdtAmount, options);
}

/**
 * Format a number with locale-specific formatting
 * @param num - The number to format
 * @param options - Formatting options
 * @returns Formatted number string
 */
export function formatNumber(
  num: number,
  options: {
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  const {
    locale = CURRENCY_LOCALE,
    minimumFractionDigits,
    maximumFractionDigits
  } = options;

  return num.toLocaleString(locale, {
    minimumFractionDigits,
    maximumFractionDigits
  });
}

/**
 * Default export for convenience
 */
export default {
  formatPrice,
  convertUSDtoBDT,
  formatPriceFromUSD,
  formatNumber,
  CURRENCY_CODE,
  CURRENCY_SYMBOL,
  CURRENCY_LOCALE
};
