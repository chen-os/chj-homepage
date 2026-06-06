import { fetchStockPrices } from "./stock-price";
import { getThemeStockWatchlists } from "./trend-engine";
import {
  buildThemePerformance,
  type ThemePerformance,
} from "./theme-performance-engine";
import {
  appendWatchlistSnapshot,
  getWatchlistSnapshotForDate,
  loadWatchlistHistory,
  type DailyWatchlistSnapshot,
} from "./watchlist-history";

export type WatchlistSnapshotResponse = DailyWatchlistSnapshot & {
  cached: boolean;
  themePerformance: ThemePerformance[];
};

export async function getOrCreateWatchlistSnapshot(
  date: string,
): Promise<WatchlistSnapshotResponse> {
  const existing = await getWatchlistSnapshotForDate(date);
  const history = await loadWatchlistHistory();

  if (existing) {
    return {
      ...existing,
      cached: true,
      themePerformance: buildThemePerformance(history, date),
    };
  }

  const watchlists = getThemeStockWatchlists();
  const allTickers = watchlists.flatMap((entry) =>
    entry.stocks.map((stock) => stock.ticker),
  );
  const prices = await fetchStockPrices(allTickers);

  const themes = watchlists.map((entry) => ({
    theme: entry.theme,
    stocks: entry.stocks.map((stock) => ({
      ticker: stock.ticker,
      price: prices.get(stock.ticker) ?? 0,
    })),
  }));

  const snapshot: DailyWatchlistSnapshot = { date, themes };
  const updatedHistory = await appendWatchlistSnapshot(snapshot);

  return {
    ...snapshot,
    cached: false,
    themePerformance: buildThemePerformance(updatedHistory, date),
  };
}
