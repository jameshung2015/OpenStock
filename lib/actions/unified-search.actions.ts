'use server';

import { cache } from 'react';
import { searchStocks } from './finnhub.actions';
import { searchChineseStocks } from './tushare.actions';

/**
 * Unified search across multiple markets (US stocks via Finnhub and Chinese stocks via Tushare)
 * @param query - Search query (stock name or symbol)
 * @returns Combined array of stocks from all markets
 */
export const searchAllMarkets = cache(
    async (query?: string): Promise<StockWithWatchlistStatus[]> => {
        try {
            // Check if Tushare token is configured
            const tushareEnabled = !!process.env.TUSHARE_TOKEN;

            // Run searches in parallel for better performance
            const searches: Promise<StockWithWatchlistStatus[]>[] = [
                searchStocks(query), // US stocks via Finnhub
            ];

            // Only search Chinese stocks if Tushare is configured
            if (tushareEnabled) {
                searches.push(searchChineseStocks(query));
            }

            const [usStocks, chineseStocks = []] = await Promise.all(searches);

            // Combine results
            const combined = [...usStocks, ...chineseStocks];

            // Remove duplicates based on symbol (in case any cross-listing)
            const uniqueStocks = Array.from(
                new Map(combined.map((stock) => [stock.symbol, stock])).values()
            );

            return uniqueStocks.slice(0, 20); // Return top 20 results
        } catch (err) {
            console.error('Error in unified market search:', err);
            // Fallback to US stocks only
            try {
                return await searchStocks(query);
            } catch (fallbackErr) {
                console.error('Error in fallback search:', fallbackErr);
                return [];
            }
        }
    }
);
