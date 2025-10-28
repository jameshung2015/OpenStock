/**
 * Utility functions for market identification and formatting
 * These are client-safe utility functions
 */

/**
 * Get market identification for a stock symbol
 * @param symbol - Stock symbol
 * @returns Market type (US, CN-SH, CN-SZ, CN-BJ)
 */
export function identifyMarket(symbol: string): 'US' | 'CN-SH' | 'CN-SZ' | 'CN-BJ' | 'UNKNOWN' {
    if (!symbol) return 'UNKNOWN';

    // Chinese stock patterns (Tushare format)
    if (symbol.endsWith('.SH')) return 'CN-SH'; // Shanghai Stock Exchange
    if (symbol.endsWith('.SZ')) return 'CN-SZ'; // Shenzhen Stock Exchange
    if (symbol.endsWith('.BJ')) return 'CN-BJ'; // Beijing Stock Exchange

    // US stock pattern (no suffix)
    if (/^[A-Z]{1,5}$/.test(symbol)) return 'US';

    return 'UNKNOWN';
}

/**
 * Check if a symbol represents a Chinese stock
 * @param symbol - Stock symbol
 * @returns True if Chinese stock
 */
export function isChineseStock(symbol: string): boolean {
    const market = identifyMarket(symbol);
    return market.startsWith('CN-');
}

/**
 * Check if a symbol represents a US stock
 * @param symbol - Stock symbol
 * @returns True if US stock
 */
export function isUSStock(symbol: string): boolean {
    return identifyMarket(symbol) === 'US';
}

/**
 * Format market display name
 * @param market - Market identifier
 * @returns Formatted market name
 */
export function formatMarketName(market: string): string {
    const marketNames: Record<string, string> = {
        US: 'United States',
        'CN-SH': 'Shanghai Stock Exchange',
        'CN-SZ': 'Shenzhen Stock Exchange',
        'CN-BJ': 'Beijing Stock Exchange',
        UNKNOWN: 'Unknown Market',
    };

    return marketNames[market] || market;
}
