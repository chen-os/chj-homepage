import { readJson, upsertJson, writeJson } from "./storage";

export type WatchlistStockSnapshot = {
  ticker: string;
  price: number;
};

export type WatchlistThemeSnapshot = {
  theme: string;
  stocks: WatchlistStockSnapshot[];
};

export type DailyWatchlistSnapshot = {
  date: string;
  themes: WatchlistThemeSnapshot[];
};

export type WatchlistHistoryFile = {
  history: DailyWatchlistSnapshot[];
};

const STORAGE_KEY = "watchlist-history.json";

function emptyHistory(): WatchlistHistoryFile {
  return { history: [] };
}

function normalizeHistory(data: WatchlistHistoryFile): WatchlistHistoryFile {
  if (!Array.isArray(data.history)) {
    return emptyHistory();
  }
  return data;
}

function sortHistory(data: WatchlistHistoryFile): WatchlistHistoryFile {
  return {
    history: [...data.history].sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export async function loadWatchlistHistory(): Promise<WatchlistHistoryFile> {
  const data = await readJson(STORAGE_KEY, emptyHistory());
  return normalizeHistory(data);
}

export async function saveWatchlistHistory(data: WatchlistHistoryFile): Promise<void> {
  await writeJson(STORAGE_KEY, sortHistory(normalizeHistory(data)));
}

export async function getWatchlistSnapshotForDate(
  date: string,
): Promise<DailyWatchlistSnapshot | undefined> {
  const data = await loadWatchlistHistory();
  return data.history.find((entry) => entry.date === date);
}

export async function appendWatchlistSnapshot(
  snapshot: DailyWatchlistSnapshot,
): Promise<WatchlistHistoryFile> {
  return upsertJson(
    STORAGE_KEY,
    (data) => {
      const normalized = normalizeHistory(data);
      const existingIndex = normalized.history.findIndex(
        (entry) => entry.date === snapshot.date,
      );

      if (existingIndex >= 0) {
        normalized.history[existingIndex] = snapshot;
      } else {
        normalized.history.push(snapshot);
      }

      return sortHistory(normalized);
    },
    emptyHistory(),
  );
}

export function getStockPriceOnDate(
  history: WatchlistHistoryFile,
  theme: string,
  ticker: string,
  date: string,
): number | undefined {
  const day = history.history.find((entry) => entry.date === date);
  const themeEntry = day?.themes.find((item) => item.theme === theme);
  const stock = themeEntry?.stocks.find((item) => item.ticker === ticker);
  return stock?.price;
}
