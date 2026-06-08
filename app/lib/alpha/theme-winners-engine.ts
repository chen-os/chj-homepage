import type { TrendConfirmation } from "./conviction-engine";
import { formatPercentChange } from "./format-labels";
import { buildThemePerformance } from "./theme-performance-engine";
import type { AlphaTrend, TrendCompany } from "./trend-engine";
import type { WatchlistHistoryFile } from "./watchlist-history";

export type ThemeWinnerConfirmationLevel =
  | "Strong Confirmation"
  | "Divergence"
  | "Late Stage"
  | "Neutral";

export type ThemeWinnerStock = {
  ticker: string;
  change7D: number | null;
  change7DLabel: string;
};

export type ThemeWinnerPerformer = {
  ticker: string;
  change7D: number;
};

export type ThemeWinner = {
  themeName: string;
  displayName: string;
  avgReturn7D: number | null;
  avgReturn7DLabel: string;
  topPerformer: ThemeWinnerPerformer | null;
  worstPerformer: ThemeWinnerPerformer | null;
  confirmationLevel: ThemeWinnerConfirmationLevel;
  stocks: ThemeWinnerStock[];
};

const DISPLAY_NAMES: Record<string, string> = {
  "AI Data Center Power Demand": "AI Power",
  "Nuclear Fuel Cycle": "Nuclear Fuel",
  "Humanoid Robotics Supply Chain": "Humanoid Robotics",
  "AI Compute Infrastructure": "AI Compute",
};

function formatStockReturn7D(value: number | null): string {
  if (value === null) return "N/A";
  const rounded = Math.round(value);
  if (rounded > 0) return `+${rounded}%`;
  if (rounded < 0) return `${rounded}%`;
  return "0%";
}

function resolveDisplayName(
  themeName: string,
  confirmations: TrendConfirmation[],
): string {
  const confirmation = confirmations.find((item) => item.themeName === themeName);
  if (confirmation) return confirmation.displayName;
  return DISPLAY_NAMES[themeName] ?? themeName;
}

function resolveConfirmationLevel(
  themeStrength: number,
  stockStrength: number | null,
): ThemeWinnerConfirmationLevel {
  if (stockStrength === null) return "Neutral";
  if (themeStrength > 50 && stockStrength > 5) return "Strong Confirmation";
  if (themeStrength > 50 && stockStrength < 0) return "Divergence";
  if (themeStrength < 40 && stockStrength > 10) return "Late Stage";
  return "Neutral";
}

function averageChange7D(values: number[]): number | null {
  if (values.length === 0) return null;
  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round((total / values.length) * 10) / 10;
}

function buildStocksForTheme(
  trend: AlphaTrend,
  watchlistHistory: WatchlistHistoryFile,
  todayDate: string,
): ThemeWinnerStock[] {
  const performance = buildThemePerformance(watchlistHistory, todayDate).find(
    (entry) => entry.theme === trend.name,
  );
  const performanceByTicker = new Map(
    performance?.stocks.map((stock) => [stock.ticker, stock.change7Day]) ?? [],
  );

  const tickers =
    trend.potentialCompanies.length > 0
      ? trend.potentialCompanies
      : (performance?.stocks.map((stock) => ({
          ticker: stock.ticker,
          name: stock.ticker,
          reason: "",
        })) ?? []);

  return tickers
    .map((company: TrendCompany) => {
      const change7D = performanceByTicker.get(company.ticker) ?? null;
      return {
        ticker: company.ticker,
        change7D,
        change7DLabel: formatStockReturn7D(change7D),
      };
    })
    .sort((a, b) => {
      if (a.change7D === null && b.change7D === null) {
        return a.ticker.localeCompare(b.ticker);
      }
      if (a.change7D === null) return 1;
      if (b.change7D === null) return -1;
      return b.change7D - a.change7D;
    });
}

function resolvePerformer(
  stocks: ThemeWinnerStock[],
  direction: "top" | "worst",
): ThemeWinnerPerformer | null {
  const ranked = stocks.filter(
    (stock): stock is ThemeWinnerStock & { change7D: number } =>
      stock.change7D !== null,
  );

  if (ranked.length === 0) return null;

  const pick =
    direction === "top"
      ? ranked.reduce((best, stock) =>
          stock.change7D > best.change7D ? stock : best,
        )
      : ranked.reduce((worst, stock) =>
          stock.change7D < worst.change7D ? stock : worst,
        );

  return {
    ticker: pick.ticker,
    change7D: pick.change7D,
  };
}

export function buildThemeWinner(
  trend: AlphaTrend,
  watchlistHistory: WatchlistHistoryFile,
  todayDate: string,
  confirmations: TrendConfirmation[],
): ThemeWinner {
  const stocks = buildStocksForTheme(trend, watchlistHistory, todayDate);
  const validReturns = stocks
    .map((stock) => stock.change7D)
    .filter((value): value is number => value !== null);
  const avgReturn7D = averageChange7D(validReturns);
  const themeStrength = trend.alphaScore;
  const stockStrength = avgReturn7D;

  return {
    themeName: trend.name,
    displayName: resolveDisplayName(trend.name, confirmations),
    avgReturn7D,
    avgReturn7DLabel: formatPercentChange(avgReturn7D),
    topPerformer: resolvePerformer(stocks, "top"),
    worstPerformer: resolvePerformer(stocks, "worst"),
    confirmationLevel: resolveConfirmationLevel(themeStrength, stockStrength),
    stocks,
  };
}

export function buildThemeWinners(
  trends: AlphaTrend[],
  watchlistHistory: WatchlistHistoryFile,
  todayDate: string,
  confirmations: TrendConfirmation[] = [],
): ThemeWinner[] {
  return [...trends]
    .sort((a, b) => b.alphaScore - a.alphaScore)
    .map((trend) =>
      buildThemeWinner(trend, watchlistHistory, todayDate, confirmations),
    );
}
