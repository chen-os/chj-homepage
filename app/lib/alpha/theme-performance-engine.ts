import type { WatchlistHistoryFile } from "./watchlist-history";
import { getStockPriceOnDate } from "./watchlist-history";

export type StockPerformance = {
  ticker: string;
  change1Day: number | null;
  change7Day: number | null;
  change30Day: number | null;
  change1DayLabel: string;
  change7DayLabel: string;
  change30DayLabel: string;
};

export type ThemePerformance = {
  theme: string;
  stocks: StockPerformance[];
  topWinner: {
    ticker: string;
    change: number;
    label: string;
    period: "7D" | "1D";
  } | null;
};

function subtractDays(date: string, days: number): string {
  const parsed = new Date(`${date}T12:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() - days);
  return parsed.toISOString().slice(0, 10);
}

function formatChange(rate: number | null): string {
  if (rate === null) return "—";
  const rounded = Math.round(rate * 10) / 10;
  if (rounded > 0) return `+${rounded.toFixed(1)}%`;
  if (rounded < 0) return `${rounded.toFixed(1)}%`;
  return "0.0%";
}

function calculateChange(current: number, baseline: number | null): number | null {
  if (baseline === null || baseline <= 0 || current <= 0) return null;
  return ((current - baseline) / baseline) * 100;
}

function getBaselinePrice(
  history: WatchlistHistoryFile,
  theme: string,
  ticker: string,
  todayDate: string,
  daysBack: number,
): number | null {
  const targetDate = subtractDays(todayDate, daysBack);
  const priorEntries = history.history
    .filter((entry) => entry.date < todayDate && entry.date <= targetDate)
    .sort((a, b) => b.date.localeCompare(a.date));

  for (const entry of priorEntries) {
    const price = getStockPriceOnDate(history, theme, ticker, entry.date);
    if (price !== undefined && price > 0) return price;
  }

  return null;
}

function buildStockPerformance(
  history: WatchlistHistoryFile,
  theme: string,
  ticker: string,
  currentPrice: number,
  todayDate: string,
): StockPerformance {
  const baseline1Day = getBaselinePrice(history, theme, ticker, todayDate, 1);
  const baseline7Day = getBaselinePrice(history, theme, ticker, todayDate, 7);
  const baseline30Day = getBaselinePrice(history, theme, ticker, todayDate, 30);

  const change1Day = calculateChange(currentPrice, baseline1Day);
  const change7Day = calculateChange(currentPrice, baseline7Day);
  const change30Day = calculateChange(currentPrice, baseline30Day);

  return {
    ticker,
    change1Day,
    change7Day,
    change30Day,
    change1DayLabel: formatChange(change1Day),
    change7DayLabel: formatChange(change7Day),
    change30DayLabel: formatChange(change30Day),
  };
}

function resolveTopWinner(stocks: StockPerformance[]): ThemePerformance["topWinner"] {
  const ranked7Day = stocks
    .filter((stock) => stock.change7Day !== null)
    .sort((a, b) => (b.change7Day ?? 0) - (a.change7Day ?? 0));

  if (ranked7Day.length > 0) {
    const winner = ranked7Day[0];
    return {
      ticker: winner.ticker,
      change: winner.change7Day as number,
      label: winner.change7DayLabel,
      period: "7D",
    };
  }

  const ranked1Day = stocks
    .filter((stock) => stock.change1Day !== null)
    .sort((a, b) => (b.change1Day ?? 0) - (a.change1Day ?? 0));

  if (ranked1Day.length === 0) return null;

  const winner = ranked1Day[0];
  return {
    ticker: winner.ticker,
    change: winner.change1Day as number,
    label: winner.change1DayLabel,
    period: "1D",
  };
}

export function buildThemePerformance(
  history: WatchlistHistoryFile,
  todayDate: string,
): ThemePerformance[] {
  const today = history.history.find((entry) => entry.date === todayDate);
  if (!today) return [];

  return today.themes.map((themeEntry) => {
    const stocks = themeEntry.stocks.map((stock) =>
      buildStockPerformance(
        history,
        themeEntry.theme,
        stock.ticker,
        stock.price,
        todayDate,
      ),
    );

    return {
      theme: themeEntry.theme,
      stocks,
      topWinner: resolveTopWinner(stocks),
    };
  });
}
