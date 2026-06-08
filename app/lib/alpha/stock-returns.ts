export type StockReturnSnapshot = {
  return5D: number | null;
  return20D: number | null;
};

const YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

type CacheEntry = {
  expiresAt: number;
  value: StockReturnSnapshot;
};

const returnCache = new Map<string, CacheEntry>();

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase();
}

function toStooqSymbol(ticker: string): string {
  if (ticker.includes(".")) {
    return ticker.toLowerCase();
  }
  return `${ticker.toLowerCase()}.us`;
}

function roundReturn(value: number): number {
  return Math.round(value * 10) / 10;
}

function calculateReturnFromCloses(
  closes: number[],
  tradingDaysBack: number,
): number | null {
  if (closes.length < tradingDaysBack + 1) return null;

  const latest = closes[closes.length - 1];
  const baseline = closes[closes.length - 1 - tradingDaysBack];

  if (latest <= 0 || baseline <= 0) return null;
  return roundReturn(((latest - baseline) / baseline) * 100);
}

function extractValidCloses(values: Array<number | null | undefined>): number[] {
  return values.filter(
    (value): value is number =>
      typeof value === "number" && !Number.isNaN(value) && value > 0,
  );
}

async function fetchYahooReturns(ticker: string): Promise<StockReturnSnapshot | null> {
  const symbol = normalizeTicker(ticker);
  const url = `${YAHOO_CHART_URL}/${encodeURIComponent(symbol)}?interval=1d&range=3mo`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CHJ-AlphaDashboard/3.0)",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as {
      chart?: {
        result?: Array<{
          indicators?: {
            quote?: Array<{
              close?: Array<number | null>;
            }>;
          };
        }>;
      };
    };

    const closes = extractValidCloses(
      payload.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [],
    );

    if (closes.length < 6) return null;

    return {
      return5D: calculateReturnFromCloses(closes, 5),
      return20D: calculateReturnFromCloses(closes, 20),
    };
  } catch {
    return null;
  }
}

async function fetchStooqReturns(ticker: string): Promise<StockReturnSnapshot | null> {
  const symbol = toStooqSymbol(normalizeTicker(ticker));
  const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(symbol)}&i=d`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CHJ-AlphaDashboard/3.0)",
      },
      cache: "no-store",
    });

    if (!response.ok) return null;

    const csv = await response.text();
    const lines = csv.trim().split("\n").slice(1);
    const closes = lines
      .map((line) => {
        const parts = line.split(",");
        const close = Number(parts[4]);
        return Number.isFinite(close) && close > 0 ? close : null;
      })
      .filter((value): value is number => value !== null);

    if (closes.length < 6) return null;

    return {
      return5D: calculateReturnFromCloses(closes, 5),
      return20D: calculateReturnFromCloses(closes, 20),
    };
  } catch {
    return null;
  }
}

async function fetchTickerReturns(ticker: string): Promise<StockReturnSnapshot> {
  const yahoo = await fetchYahooReturns(ticker);
  if (yahoo && (yahoo.return5D !== null || yahoo.return20D !== null)) {
    return yahoo;
  }

  const stooq = await fetchStooqReturns(ticker);
  if (stooq) return stooq;

  return { return5D: null, return20D: null };
}

export async function getCachedStockReturns(
  tickers: string[],
): Promise<Map<string, StockReturnSnapshot>> {
  const uniqueTickers = [...new Set(tickers.map(normalizeTicker))];
  const now = Date.now();
  const results = new Map<string, StockReturnSnapshot>();
  const missing: string[] = [];

  for (const ticker of uniqueTickers) {
    const cached = returnCache.get(ticker);
    if (cached && cached.expiresAt > now) {
      results.set(ticker, cached.value);
    } else {
      missing.push(ticker);
    }
  }

  await Promise.all(
    missing.map(async (ticker) => {
      const value = await fetchTickerReturns(ticker);
      returnCache.set(ticker, {
        expiresAt: now + CACHE_TTL_MS,
        value,
      });
      results.set(ticker, value);
    }),
  );

  return results;
}
