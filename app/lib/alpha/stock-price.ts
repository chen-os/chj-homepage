const YAHOO_CHART_URL =
  "https://query1.finance.yahoo.com/v8/finance/chart";

function normalizeTicker(ticker: string): string {
  return ticker.trim();
}

export async function fetchStockPrice(ticker: string): Promise<number | null> {
  const symbol = normalizeTicker(ticker);
  const url = `${YAHOO_CHART_URL}/${encodeURIComponent(symbol)}?interval=1d&range=1d`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CHJ-AlphaDashboard/0.6)",
        Accept: "application/json",
      },
      next: { revalidate: 900 },
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as {
      chart?: {
        result?: Array<{
          meta?: {
            regularMarketPrice?: number;
          };
        }>;
      };
    };

    const price = payload.chart?.result?.[0]?.meta?.regularMarketPrice;
    if (typeof price !== "number" || Number.isNaN(price)) return null;
    return Math.round(price * 100) / 100;
  } catch {
    return null;
  }
}

export async function fetchStockPrices(
  tickers: string[],
): Promise<Map<string, number>> {
  const uniqueTickers = [...new Set(tickers.map(normalizeTicker))];
  const prices = new Map<string, number>();

  await Promise.all(
    uniqueTickers.map(async (ticker) => {
      const price = await fetchStockPrice(ticker);
      if (price !== null) {
        prices.set(ticker, price);
      }
    }),
  );

  return prices;
}
