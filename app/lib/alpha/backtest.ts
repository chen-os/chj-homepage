import type { TrendConfirmation } from "./conviction-engine";
import type { AlphaTrend } from "./trend-engine";
import { getThemeStockWatchlists } from "./trend-engine";
import {
  getStockPriceOnDate,
  loadWatchlistHistory,
  type DailyWatchlistSnapshot,
  type WatchlistHistoryFile,
} from "./watchlist-history";
import { readJson, upsertJson, writeJson } from "./storage";

export type BacktestStock = {
  ticker: string;
  entryPrice: number;
  currentPrice: number;
  return1D: number | null;
  return7D: number | null;
  return30D: number | null;
};

export type BacktestSignal = {
  date: string;
  theme: string;
  convictionScore: number;
  stocks: BacktestStock[];
};

export type AlphaBacktestFile = {
  signals: BacktestSignal[];
};

export type BacktestThemeScore = {
  theme: string;
  averageReturn: number;
  label: string;
};

export type BacktestSummary = {
  totalSignals: number;
  winningSignals: number;
  hitRate: number;
  averageReturn1D: number | null;
  averageReturn7D: number | null;
  averageReturn30D: number | null;
  bestTheme: BacktestThemeScore | null;
  worstTheme: BacktestThemeScore | null;
  bestStock: { ticker: string; averageReturn: number; label: string } | null;
  worstStock: { ticker: string; averageReturn: number; label: string } | null;
  themeScoreboard: BacktestThemeScore[];
  snapshotDays: number;
  meaningful: boolean;
};

type BacktestReportInput = {
  date: string;
  trends: AlphaTrend[];
  trendConfirmations: TrendConfirmation[];
};

const STORAGE_KEY = "alpha-backtest.json";

function emptyBacktest(): AlphaBacktestFile {
  return { signals: [] };
}

function normalizeBacktest(data: AlphaBacktestFile): AlphaBacktestFile {
  if (!Array.isArray(data.signals)) {
    return emptyBacktest();
  }
  return data;
}

function sortBacktest(data: AlphaBacktestFile): AlphaBacktestFile {
  return {
    signals: [...data.signals].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.theme.localeCompare(b.theme);
    }),
  };
}

export async function loadBacktest(): Promise<AlphaBacktestFile> {
  const data = await readJson(STORAGE_KEY, emptyBacktest());
  return normalizeBacktest(data);
}

export async function saveBacktest(data: AlphaBacktestFile): Promise<void> {
  await writeJson(STORAGE_KEY, sortBacktest(normalizeBacktest(data)));
}

function addDays(date: string, days: number): string {
  const parsed = new Date(`${date}T12:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

function roundReturn(value: number): number {
  return Math.round(value * 10) / 10;
}

function formatReturn(value: number | null): string {
  if (value === null) return "—";
  const rounded = roundReturn(value);
  if (rounded > 0) return `+${rounded.toFixed(1)}%`;
  if (rounded < 0) return `${rounded.toFixed(1)}%`;
  return "0.0%";
}

function calculateReturn(entryPrice: number, exitPrice: number | undefined): number | null {
  if (entryPrice <= 0 || exitPrice === undefined || exitPrice <= 0) return null;
  return roundReturn(((exitPrice - entryPrice) / entryPrice) * 100);
}

function getForwardPrice(
  history: WatchlistHistoryFile,
  theme: string,
  ticker: string,
  signalDate: string,
  daysForward: number,
): number | undefined {
  const targetDate = addDays(signalDate, daysForward);
  return getStockPriceOnDate(history, theme, ticker, targetDate);
}

function getLatestPrice(
  history: WatchlistHistoryFile,
  theme: string,
  ticker: string,
): number {
  const sortedDays = [...history.history].sort((a, b) => b.date.localeCompare(a.date));

  for (const day of sortedDays) {
    const price = getStockPriceOnDate(history, theme, ticker, day.date);
    if (price !== undefined && price > 0) return price;
  }

  return 0;
}

function resolveStockTickers(
  theme: string,
  trends: AlphaTrend[],
  watchlistSnapshot: DailyWatchlistSnapshot,
): string[] {
  const trend = trends.find((item) => item.name === theme);
  if (trend && trend.potentialCompanies.length > 0) {
    return trend.potentialCompanies.map((company) => company.ticker);
  }

  const snapshotTheme = watchlistSnapshot.themes.find((item) => item.theme === theme);
  if (snapshotTheme && snapshotTheme.stocks.length > 0) {
    return snapshotTheme.stocks.map((stock) => stock.ticker);
  }

  const fallback = getThemeStockWatchlists().find((item) => item.theme === theme);
  return fallback?.stocks.map((stock) => stock.ticker) ?? [];
}

function getEntryPrice(
  watchlistSnapshot: DailyWatchlistSnapshot,
  theme: string,
  ticker: string,
): number {
  const themeEntry = watchlistSnapshot.themes.find((item) => item.theme === theme);
  const stock = themeEntry?.stocks.find((item) => item.ticker === ticker);
  return stock?.price ?? 0;
}

function hasSignalForDate(data: AlphaBacktestFile, date: string, theme: string): boolean {
  return data.signals.some((signal) => signal.date === date && signal.theme === theme);
}

export function createDailySignals(
  report: BacktestReportInput,
  watchlistSnapshot: DailyWatchlistSnapshot,
  existing: AlphaBacktestFile,
): BacktestSignal[] {
  const created: BacktestSignal[] = [];

  for (const confirmation of report.trendConfirmations) {
    if (hasSignalForDate(existing, report.date, confirmation.themeName)) {
      continue;
    }

    const tickers = resolveStockTickers(
      confirmation.themeName,
      report.trends,
      watchlistSnapshot,
    );

    const stocks: BacktestStock[] = tickers.map((ticker) => {
      const entryPrice = getEntryPrice(watchlistSnapshot, confirmation.themeName, ticker);
      return {
        ticker,
        entryPrice,
        currentPrice: entryPrice,
        return1D: null,
        return7D: null,
        return30D: null,
      };
    });

    created.push({
      date: report.date,
      theme: confirmation.themeName,
      convictionScore: confirmation.convictionScore,
      stocks,
    });
  }

  return created;
}

export async function updateSignalPerformance(
  data?: AlphaBacktestFile,
): Promise<AlphaBacktestFile> {
  const source = data ?? (await loadBacktest());
  const history = await loadWatchlistHistory();

  const updated: AlphaBacktestFile = {
    signals: source.signals.map((signal) => ({
      ...signal,
      stocks: signal.stocks.map((stock) => {
        const currentPrice = getLatestPrice(history, signal.theme, stock.ticker);
        const price1D = getForwardPrice(history, signal.theme, stock.ticker, signal.date, 1);
        const price7D = getForwardPrice(history, signal.theme, stock.ticker, signal.date, 7);
        const price30D = getForwardPrice(history, signal.theme, stock.ticker, signal.date, 30);

        return {
          ...stock,
          currentPrice,
          return1D: calculateReturn(stock.entryPrice, price1D),
          return7D: calculateReturn(stock.entryPrice, price7D),
          return30D: calculateReturn(stock.entryPrice, price30D),
        };
      }),
    })),
  };

  await saveBacktest(updated);
  return updated;
}

function averageNullable(values: Array<number | null>): number | null {
  const valid = values.filter((value): value is number => value !== null);
  if (valid.length === 0) return null;
  return roundReturn(valid.reduce((sum, value) => sum + value, 0) / valid.length);
}

function getCurrentReturn(stock: BacktestStock): number | null {
  return calculateReturn(stock.entryPrice, stock.currentPrice);
}

function getEffectiveReturn(stock: BacktestStock): number | null {
  if (stock.return7D !== null) return stock.return7D;
  if (stock.return1D !== null) return stock.return1D;
  return getCurrentReturn(stock);
}

function isWinningSignal(signal: BacktestSignal): boolean {
  const returns = signal.stocks
    .map((stock) => getEffectiveReturn(stock))
    .filter((value): value is number => value !== null);

  if (returns.length === 0) return false;
  const average = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  return average > 0;
}

export function getBacktestSummary(
  data: AlphaBacktestFile,
  watchlistHistory: WatchlistHistoryFile,
): BacktestSummary {
  const snapshotDays = watchlistHistory.history.length;
  const meaningful = snapshotDays >= 7;

  const allStocks = data.signals.flatMap((signal) => signal.stocks);
  const averageReturn1D = averageNullable(allStocks.map((stock) => stock.return1D));
  const averageReturn7D = averageNullable(allStocks.map((stock) => stock.return7D));
  const averageReturn30D = averageNullable(allStocks.map((stock) => stock.return30D));

  const winningSignals = data.signals.filter(isWinningSignal).length;
  const totalSignals = data.signals.length;
  const hitRate = totalSignals > 0 ? roundReturn((winningSignals / totalSignals) * 100) : 0;

  const themeReturns = new Map<string, number[]>();
  for (const signal of data.signals) {
    for (const stock of signal.stocks) {
      const value = getEffectiveReturn(stock);
      if (value === null) continue;
      const existing = themeReturns.get(signal.theme) ?? [];
      existing.push(value);
      themeReturns.set(signal.theme, existing);
    }
  }

  const themeScoreboard: BacktestThemeScore[] = [...themeReturns.entries()]
    .map(([theme, values]) => {
      const averageReturn = roundReturn(
        values.reduce((sum, value) => sum + value, 0) / values.length,
      );
      return {
        theme,
        averageReturn,
        label: formatReturn(averageReturn),
      };
    })
    .sort((a, b) => b.averageReturn - a.averageReturn);

  const stockReturns = new Map<string, number[]>();
  for (const signal of data.signals) {
    for (const stock of signal.stocks) {
      const value = getEffectiveReturn(stock);
      if (value === null) continue;
      const existing = stockReturns.get(stock.ticker) ?? [];
      existing.push(value);
      stockReturns.set(stock.ticker, existing);
    }
  }

  const stockScores = [...stockReturns.entries()]
    .map(([ticker, values]) => ({
      ticker,
      averageReturn: roundReturn(
        values.reduce((sum, value) => sum + value, 0) / values.length,
      ),
    }))
    .sort((a, b) => b.averageReturn - a.averageReturn);

  return {
    totalSignals,
    winningSignals,
    hitRate,
    averageReturn1D,
    averageReturn7D,
    averageReturn30D,
    bestTheme: themeScoreboard[0]
      ? {
          theme: themeScoreboard[0].theme,
          averageReturn: themeScoreboard[0].averageReturn,
          label: themeScoreboard[0].label,
        }
      : null,
    worstTheme: themeScoreboard.at(-1)
      ? {
          theme: themeScoreboard.at(-1)!.theme,
          averageReturn: themeScoreboard.at(-1)!.averageReturn,
          label: themeScoreboard.at(-1)!.label,
        }
      : null,
    bestStock: stockScores[0]
      ? {
          ticker: stockScores[0].ticker,
          averageReturn: stockScores[0].averageReturn,
          label: formatReturn(stockScores[0].averageReturn),
        }
      : null,
    worstStock: stockScores.at(-1)
      ? {
          ticker: stockScores.at(-1)!.ticker,
          averageReturn: stockScores.at(-1)!.averageReturn,
          label: formatReturn(stockScores.at(-1)!.averageReturn),
        }
      : null,
    themeScoreboard,
    snapshotDays,
    meaningful,
  };
}

export async function syncDailyBacktest(
  report: BacktestReportInput,
  watchlistSnapshot: DailyWatchlistSnapshot,
): Promise<{ data: AlphaBacktestFile; summary: BacktestSummary }> {
  const existing = await loadBacktest();
  const newSignals = createDailySignals(report, watchlistSnapshot, existing);

  const merged: AlphaBacktestFile = {
    signals: [...existing.signals, ...newSignals],
  };

  if (newSignals.length > 0) {
    await saveBacktest(merged);
  }

  const updated = await updateSignalPerformance(
    newSignals.length > 0 ? merged : existing,
  );
  const watchlistHistory = await loadWatchlistHistory();
  const summary = getBacktestSummary(updated, watchlistHistory);

  return { data: updated, summary };
}

export async function getBacktestResponse(): Promise<{
  summary: BacktestSummary;
  signals: BacktestSignal[];
}> {
  const existing = await loadBacktest();
  const updated = await updateSignalPerformance(existing);
  const watchlistHistory = await loadWatchlistHistory();
  const summary = getBacktestSummary(updated, watchlistHistory);
  return { summary, signals: updated.signals };
}

export function getTopStockForSignal(signal: BacktestSignal): {
  ticker: string;
  returnLabel: string;
  returnValue: number | null;
} | null {
  if (signal.stocks.length === 0) return null;

  const ranked = [...signal.stocks].sort((a, b) => {
    const aReturn = getEffectiveReturn(a) ?? -Infinity;
    const bReturn = getEffectiveReturn(b) ?? -Infinity;
    return bReturn - aReturn;
  });

  const top = ranked[0];
  const value = getEffectiveReturn(top);
  return {
    ticker: top.ticker,
    returnValue: value,
    returnLabel: formatReturn(value),
  };
}

export { formatReturn as formatBacktestReturn };
