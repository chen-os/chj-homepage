import { readJson, writeJson } from "./storage";

export type ThemeStockPerformanceRecord = {
  ticker: string;
  change7D: number;
};

export type ThemeStockPerformanceEntry = {
  stocks: ThemeStockPerformanceRecord[];
};

export type ThemeStockPerformanceFile = Record<string, ThemeStockPerformanceEntry>;

const STORAGE_KEY = "theme-stock-performance.json";

function emptyFile(): ThemeStockPerformanceFile {
  return {};
}

export async function loadThemeStockPerformance(): Promise<ThemeStockPerformanceFile> {
  return readJson(STORAGE_KEY, emptyFile());
}

export async function saveThemeStockPerformance(
  data: ThemeStockPerformanceFile,
): Promise<void> {
  await writeJson(STORAGE_KEY, data);
}

export function buildThemeStockPerformanceFile(
  winners: Array<{
    displayName: string;
    stocks: Array<{ ticker: string; change7D: number | null }>;
  }>,
): ThemeStockPerformanceFile {
  const file: ThemeStockPerformanceFile = {};

  for (const winner of winners) {
    const stocks = winner.stocks
      .filter((stock): stock is { ticker: string; change7D: number } =>
        stock.change7D !== null,
      )
      .map((stock) => ({
        ticker: stock.ticker,
        change7D: Math.round(stock.change7D * 10) / 10,
      }));

    if (stocks.length > 0) {
      file[winner.displayName] = { stocks };
    }
  }

  return file;
}
