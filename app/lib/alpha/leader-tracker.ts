import { formatPercentChange } from "./format-labels";
import type { ThemeRotationHistoryFile } from "./theme-rotation";
import {
  getStockPriceOnDate,
  type WatchlistHistoryFile,
} from "./watchlist-history";

export type CurrentLeader = {
  displayName: string;
  reignDays: number;
  becameLeaderDate: string;
};

export type LeaderHistoryEntry = {
  date: string;
  displayName: string;
};

export type LeaderPerformance = {
  displayName: string;
  sinceDate: string;
  basketReturn: number | null;
  basketReturnLabel: string;
  meaningful: boolean;
};

export type LeaderTracker = {
  currentLeader: CurrentLeader | null;
  leaderHistory: LeaderHistoryEntry[];
  leaderPerformance: LeaderPerformance | null;
};

const DISPLAY_NAME_TO_THEME: Record<string, string> = {
  "AI Power": "AI Data Center Power Demand",
  Nuclear: "Nuclear Fuel Cycle",
  Humanoid: "Humanoid Robotics Supply Chain",
  "AI Compute": "AI Compute Infrastructure",
};

function roundReturn(value: number): number {
  return Math.round(value * 10) / 10;
}

function resolveThemeName(displayName: string): string | undefined {
  return DISPLAY_NAME_TO_THEME[displayName];
}

function findWatchlistDate(
  history: WatchlistHistoryFile,
  targetDate: string,
  direction: "onOrAfter" | "onOrBefore",
): string | undefined {
  const sorted = [...history.history].sort((a, b) => a.date.localeCompare(b.date));

  if (direction === "onOrAfter") {
    return sorted.find((entry) => entry.date >= targetDate)?.date;
  }

  return [...sorted]
    .reverse()
    .find((entry) => entry.date <= targetDate)?.date;
}

function averageThemeBasketPrice(
  history: WatchlistHistoryFile,
  themeName: string,
  date: string,
): number | null {
  const day = history.history.find((entry) => entry.date === date);
  const themeEntry = day?.themes.find((item) => item.theme === themeName);
  if (!themeEntry || themeEntry.stocks.length === 0) return null;

  const prices = themeEntry.stocks
    .map((stock) => getStockPriceOnDate(history, themeName, stock.ticker, date))
    .filter((price): price is number => price !== undefined && price > 0);

  if (prices.length === 0) return null;
  return prices.reduce((sum, price) => sum + price, 0) / prices.length;
}

export function buildCurrentLeader(
  history: ThemeRotationHistoryFile,
): CurrentLeader | null {
  if (history.history.length === 0) return null;

  const sorted = [...history.history].sort((a, b) => b.date.localeCompare(a.date));
  const latest = sorted[0];
  if (!latest?.rank1) return null;

  const champion = latest.rank1;
  let becameLeaderDate = latest.date;
  let reignDays = 0;

  for (const entry of sorted) {
    if (entry.rank1 !== champion) break;
    becameLeaderDate = entry.date;
    reignDays += 1;
  }

  return {
    displayName: champion,
    reignDays,
    becameLeaderDate,
  };
}

export function buildLeaderHistory(
  history: ThemeRotationHistoryFile,
): LeaderHistoryEntry[] {
  return [...history.history]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => ({
      date: entry.date,
      displayName: entry.rank1,
    }))
    .filter((entry) => entry.displayName);
}

export function buildLeaderPerformance(
  rotationHistory: ThemeRotationHistoryFile,
  watchlistHistory: WatchlistHistoryFile,
  asOfDate: string,
): LeaderPerformance | null {
  const currentLeader = buildCurrentLeader(rotationHistory);
  if (!currentLeader) return null;

  const themeName = resolveThemeName(currentLeader.displayName);
  if (!themeName) {
    return {
      displayName: currentLeader.displayName,
      sinceDate: currentLeader.becameLeaderDate,
      basketReturn: null,
      basketReturnLabel: "Pending",
      meaningful: false,
    };
  }

  const entryDate =
    findWatchlistDate(watchlistHistory, currentLeader.becameLeaderDate, "onOrAfter") ??
    currentLeader.becameLeaderDate;
  const exitDate =
    findWatchlistDate(watchlistHistory, asOfDate, "onOrBefore") ?? asOfDate;

  const entryBasket = averageThemeBasketPrice(
    watchlistHistory,
    themeName,
    entryDate,
  );
  const exitBasket = averageThemeBasketPrice(
    watchlistHistory,
    themeName,
    exitDate,
  );

  const basketReturn =
    entryBasket !== null &&
    exitBasket !== null &&
    entryBasket > 0 &&
    exitDate >= entryDate
      ? roundReturn(((exitBasket - entryBasket) / entryBasket) * 100)
      : null;

  return {
    displayName: currentLeader.displayName,
    sinceDate: currentLeader.becameLeaderDate,
    basketReturn,
    basketReturnLabel:
      basketReturn === null ? "Pending" : formatPercentChange(basketReturn),
    meaningful: basketReturn !== null,
  };
}

export function buildLeaderTracker(
  rotationHistory: ThemeRotationHistoryFile,
  watchlistHistory: WatchlistHistoryFile,
  asOfDate: string,
): LeaderTracker {
  return {
    currentLeader: buildCurrentLeader(rotationHistory),
    leaderHistory: buildLeaderHistory(rotationHistory),
    leaderPerformance: buildLeaderPerformance(
      rotationHistory,
      watchlistHistory,
      asOfDate,
    ),
  };
}
