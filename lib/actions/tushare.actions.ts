'use server';

import { cache } from 'react';
import { POPULAR_CHINESE_STOCK_SYMBOLS } from '@/lib/constants';

const TUSHARE_API_URL = 'http://api.tushare.pro';
const TUSHARE_TOKEN = process.env.TUSHARE_TOKEN ?? '';

/**
 * Generic function to call Tushare Pro API
 * @param apiName - The API interface name (e.g., 'stock_basic', 'daily')
 * @param fields - Fields to return
 * @param params - Query parameters
 */
async function callTushareAPI<T>(
    apiName: string,
    fields?: string,
    params?: Record<string, any>
): Promise<T> {
    if (!TUSHARE_TOKEN) {
        throw new Error('TUSHARE_TOKEN is not configured in environment variables');
    }

    const requestBody = {
        api_name: apiName,
        token: TUSHARE_TOKEN,
        params: params || {},
        fields: fields || '',
    };

    const response = await fetch(TUSHARE_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        cache: 'no-store',
    });

    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Tushare API request failed ${response.status}: ${text}`);
    }

    const data = await response.json();

    if (data.code !== 0) {
        throw new Error(`Tushare API error: ${data.msg || 'Unknown error'}`);
    }

    return data as T;
}

/**
 * Convert Tushare data array format to objects
 * Tushare returns data in format: { fields: [...], items: [[...], [...]] }
 */
function convertTushareData(fields: string[], items: any[][]): any[] {
    return items.map((item) => {
        const obj: any = {};
        fields.forEach((field, index) => {
            obj[field] = item[index];
        });
        return obj;
    });
}

/**
 * Search for Chinese stocks by name or symbol
 * @param query - Search query (stock name or code)
 * @returns Array of Chinese stocks with watchlist status
 */
export const searchChineseStocks = cache(
    async (query?: string): Promise<StockWithWatchlistStatus[]> => {
        try {
            if (!TUSHARE_TOKEN) {
                console.error('Error in Chinese stock search: TUSHARE_TOKEN is not configured');
                return [];
            }

            const trimmed = typeof query === 'string' ? query.trim() : '';

            let results: TushareStockBasic[] = [];

            if (!trimmed) {
                // Return top popular Chinese stocks when no query
                const symbols = POPULAR_CHINESE_STOCK_SYMBOLS.slice(0, 10);

                const data = await callTushareAPI<TushareResponse>(
                    'stock_basic',
                    'ts_code,symbol,name,area,industry,market,list_date',
                    {
                        list_status: 'L', // Only listed stocks
                    }
                );

                if (data.data && data.data.fields && data.data.items) {
                    const allStocks = convertTushareData(data.data.fields, data.data.items);

                    // Filter to only return popular stocks
                    results = allStocks.filter((stock: any) =>
                        symbols.some(
                            (popularSymbol) =>
                                stock.ts_code === popularSymbol || stock.symbol === popularSymbol
                        )
                    );
                }
            } else {
                // Search by symbol or name
                const data = await callTushareAPI<TushareResponse>(
                    'stock_basic',
                    'ts_code,symbol,name,area,industry,market,list_date',
                    {
                        list_status: 'L', // Only listed stocks
                    }
                );

                if (data.data && data.data.fields && data.data.items) {
                    const allStocks = convertTushareData(data.data.fields, data.data.items);

                    // Filter stocks by query (match symbol or name)
                    const queryUpper = trimmed.toUpperCase();
                    results = allStocks.filter((stock: any) => {
                        const symbolMatch =
                            stock.ts_code?.toUpperCase().includes(queryUpper) ||
                            stock.symbol?.toUpperCase().includes(queryUpper);
                        const nameMatch = stock.name?.includes(trimmed);
                        return symbolMatch || nameMatch;
                    });
                }
            }

            // Map to StockWithWatchlistStatus format
            const mapped: StockWithWatchlistStatus[] = results
                .map((stock) => {
                    const tsCode = stock.ts_code || '';
                    const name = stock.name || tsCode;
                    const market = stock.market || 'CN';
                    const industry = stock.industry || 'Unknown';

                    return {
                        symbol: tsCode,
                        name: name,
                        exchange: market,
                        type: industry,
                        isInWatchlist: false,
                    };
                })
                .slice(0, 15);

            return mapped;
        } catch (err) {
            console.error('Error in Chinese stock search:', err);
            return [];
        }
    }
);

/**
 * Get Chinese stock daily quotes
 * @param symbols - Array of stock codes (ts_code format like '000001.SZ')
 * @returns Map of symbol to quote data
 */
export async function getChineseStockQuotes(
    symbols: string[]
): Promise<Map<string, TushareQuoteData>> {
    try {
        if (!TUSHARE_TOKEN) {
            console.error('TUSHARE_TOKEN is not configured');
            return new Map();
        }

        const quotesMap = new Map<string, TushareQuoteData>();

        // Get today's date in YYYYMMDD format
        const today = new Date();
        const dateStr =
            today.getFullYear() +
            String(today.getMonth() + 1).padStart(2, '0') +
            String(today.getDate()).padStart(2, '0');

        // Fetch quotes for all symbols
        await Promise.all(
            symbols.map(async (symbol) => {
                try {
                    const data = await callTushareAPI<TushareResponse>(
                        'daily',
                        'ts_code,trade_date,close,pct_chg,vol,amount',
                        {
                            ts_code: symbol,
                            start_date: dateStr,
                            end_date: dateStr,
                        }
                    );

                    if (data.data && data.data.fields && data.data.items.length > 0) {
                        const quotes = convertTushareData(data.data.fields, data.data.items);
                        if (quotes.length > 0) {
                            quotesMap.set(symbol, {
                                close: quotes[0].close,
                                pct_chg: quotes[0].pct_chg,
                                vol: quotes[0].vol,
                                amount: quotes[0].amount,
                            });
                        }
                    }
                } catch (e) {
                    console.error('Error fetching quote for', symbol, e);
                }
            })
        );

        return quotesMap;
    } catch (err) {
        console.error('Error fetching Chinese stock quotes:', err);
        return new Map();
    }
}

/**
 * Get Chinese stock company information
 * @param symbol - Stock code (ts_code format like '000001.SZ')
 * @returns Company information
 */
export async function getChineseStockInfo(symbol: string): Promise<TushareCompanyInfo | null> {
    try {
        if (!TUSHARE_TOKEN) {
            console.error('TUSHARE_TOKEN is not configured');
            return null;
        }

        const data = await callTushareAPI<TushareResponse>(
            'stock_company',
            'ts_code,chairman,manager,secretary,reg_capital,setup_date,province,city,introduction,website,email,office,employees,main_business,business_scope',
            {
                ts_code: symbol,
            }
        );

        if (data.data && data.data.fields && data.data.items.length > 0) {
            const companies = convertTushareData(data.data.fields, data.data.items);
            return companies[0] as TushareCompanyInfo;
        }

        return null;
    } catch (err) {
        console.error('Error fetching Chinese stock info:', err);
        return null;
    }
}

/**
 * Get market news for Chinese stocks
 * Note: Tushare may have limited news API. This is a placeholder for future implementation
 * @param symbols - Array of stock codes
 * @returns Array of news articles
 */
export async function getChineseMarketNews(symbols?: string[]): Promise<MarketNewsArticle[]> {
    try {
        // Tushare news API requires higher permission level
        // For now, return empty array
        // You can implement this when you have access to news API
        console.log('Chinese market news feature requires Tushare premium subscription');
        return [];
    } catch (err) {
        console.error('Error fetching Chinese market news:', err);
        return [];
    }
}

/**
 * Get Chinese stock basic information
 * @param symbol - Stock code (ts_code format like '000001.SZ')
 * @returns Stock basic information
 */
export async function getChineseStockBasicInfo(
    symbol: string
): Promise<TushareStockBasic | null> {
    try {
        if (!TUSHARE_TOKEN) {
            console.error('TUSHARE_TOKEN is not configured');
            return null;
        }

        const data = await callTushareAPI<TushareResponse>(
            'stock_basic',
            'ts_code,symbol,name,area,industry,market,list_date,list_status,is_hs',
            {
                ts_code: symbol,
            }
        );

        if (data.data && data.data.fields && data.data.items.length > 0) {
            const stocks = convertTushareData(data.data.fields, data.data.items);
            return stocks[0] as TushareStockBasic;
        }

        return null;
    } catch (err) {
        console.error('Error fetching Chinese stock basic info:', err);
        return null;
    }
}

/**
 * Get historical data for Chinese stock
 * @param symbol - Stock code (ts_code format)
 * @param startDate - Start date (YYYYMMDD)
 * @param endDate - End date (YYYYMMDD)
 * @returns Historical price data
 */
export async function getChineseStockHistoricalData(
    symbol: string,
    startDate?: string,
    endDate?: string
): Promise<TushareDailyData[]> {
    try {
        if (!TUSHARE_TOKEN) {
            console.error('TUSHARE_TOKEN is not configured');
            return [];
        }

        // Default to last 30 days if dates not provided
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        const formatDate = (date: Date) => {
            return (
                date.getFullYear() +
                String(date.getMonth() + 1).padStart(2, '0') +
                String(date.getDate()).padStart(2, '0')
            );
        };

        const start = startDate || formatDate(thirtyDaysAgo);
        const end = endDate || formatDate(today);

        const data = await callTushareAPI<TushareResponse>(
            'daily',
            'ts_code,trade_date,open,high,low,close,pre_close,change,pct_chg,vol,amount',
            {
                ts_code: symbol,
                start_date: start,
                end_date: end,
            }
        );

        if (data.data && data.data.fields && data.data.items.length > 0) {
            const historicalData = convertTushareData(data.data.fields, data.data.items);
            return historicalData as TushareDailyData[];
        }

        return [];
    } catch (err) {
        console.error('Error fetching Chinese stock historical data:', err);
        return [];
    }
}
