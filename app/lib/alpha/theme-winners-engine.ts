import type { TrendConfirmation } from "./conviction-engine";
import { getCachedStockReturns } from "./stock-returns";
import {
  loadThemeStockPerformance,
  type ThemeStockPerformanceFile,
} from "./theme-stock-performance";
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

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase();
}

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

function findStoredPerformance(
  performanceFile: ThemeStockPerformanceFile,
  displayName: string,
  themeName: string,
) {
  const candidateKeys = [
    displayName,
    DISPLAY_NAMES[themeName],
    themeName,
  ].filter((value, index, values) => value && values.indexOf(value) === index);

  for (const key of candidateKeys) {
    if (performanceFile[key]) {
      return performanceFile[key];
    }
  }

  return undefined;
}

function resolveChange7D(
  ticker: string,
  performanceFile: ThemeStockPerformanceFile,
  displayName: string,
  themeName: string,
  liveReturns: Map<string, { return7D: number | null }>,
  watchlistChange: number | null | undefined,
): number | null {
  const normalizedTicker = normalizeTicker(ticker);
  const storedPerformance = findStoredPerformance(
    performanceFile,
    displayName,
    themeName,
  );
  const storedStock = storedPerformance?.stocks.find(
    (stock) => normalizeTicker(stock.ticker) === normalizedTicker,
  );
  if (storedStock) {
    return storedStock.change7D;
  }

  const liveReturn = liveReturns.get(normalizedTicker)?.return7D ?? null;
  if (liveReturn !== null) {
    return liveReturn;
  }

  if (watchlistChange !== null && watchlistChange !== undefined) {
    return watchlistChange;
  }

  return null;
}

function buildStocksForTheme(
  trend: AlphaTrend,
  watchlistHistory: WatchlistHistoryFile,
  todayDate: string,
  displayName: string,
  performanceFile: ThemeStockPerformanceFile,
  liveReturns: Map<string, { return7D: number | null }>,
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
      const change7D = resolveChange7D(
        company.ticker,
        performanceFile,
        displayName,
        trend.name,
        liveReturns,
        performanceByTicker.get(company.ticker),
      );
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

function buildThemeWinner(
  trend: AlphaTrend,
  watchlistHistory: WatchlistHistoryFile,
  todayDate: string,
  confirmations: TrendConfirmation[],
  performanceFile: ThemeStockPerformanceFile,
  liveReturns: Map<string, { return7D: number | null }>,
): ThemeWinner {
  const displayName = resolveDisplayName(trend.name, confirmations);
  const stocks = buildStocksForTheme(
    trend,
    watchlistHistory,
    todayDate,
    displayName,
    performanceFile,
    liveReturns,
  );
  const validReturns = stocks
    .map((stock) => stock.change7D)
    .filter((value): value is number => value !== null);
  const avgReturn7D = averageChange7D(validReturns);
  const themeStrength = trend.alphaScore;
  const stockStrength = avgReturn7D;

  return {
    themeName: trend.name,
    displayName,
    avgReturn7D,
    avgReturn7DLabel: formatStockReturn7D(avgReturn7D),
    topPerformer: resolvePerformer(stocks, "top"),
    worstPerformer: resolvePerformer(stocks, "worst"),
    confirmationLevel: resolveConfirmationLevel(themeStrength, stockStrength),
    stocks,
  };
}

export async function buildThemeWinners(
  trends: AlphaTrend[],
  watchlistHistory: WatchlistHistoryFile,
  todayDate: string,
  confirmations: TrendConfirmation[] = [],
): Promise<ThemeWinner[]> {
  const performanceFile = await loadThemeStockPerformance();
  const allTickers = [
    ...new Set(
      trends.flatMap((trend) =>
        trend.potentialCompanies.map((company) => company.ticker),
      ),
    ),
  ];
  const liveReturns = await getCachedStockReturns(allTickers);

  return [...trends]
    .sort((a, b) => b.alphaScore - a.alphaScore)
    .map((trend) =>
      buildThemeWinner(
        trend,
        watchlistHistory,
        todayDate,
        confirmations,
        performanceFile,
        liveReturns,
      ),
    );
}
