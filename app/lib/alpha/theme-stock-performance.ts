import fs from "fs/promises";
import path from "path";
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

function isThemeStockPerformanceFile(
  value: unknown,
): value is ThemeStockPerformanceFile {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return false;
    }

    const stocks = (entry as ThemeStockPerformanceEntry).stocks;
    if (!Array.isArray(stocks)) {
      return false;
    }

    return stocks.every((stock) => {
      if (!stock || typeof stock !== "object" || Array.isArray(stock)) {
        return false;
      }

      const record = stock as ThemeStockPerformanceRecord;
      return (
        typeof record.ticker === "string" &&
        typeof record.change7D === "number" &&
        Number.isFinite(record.change7D)
      );
    });
  });
}

async function loadBundledSeed(): Promise<ThemeStockPerformanceFile> {
  try {
    const seedPath = path.join(process.cwd(), "data", STORAGE_KEY);
    const raw = await fs.readFile(seedPath, "utf-8");
    const parsed: unknown = JSON.parse(raw);

    if (!isThemeStockPerformanceFile(parsed) || Object.keys(parsed).length === 0) {
      return emptyFile();
    }

    return parsed;
  } catch {
    return emptyFile();
  }
}

export async function loadThemeStockPerformance(): Promise<ThemeStockPerformanceFile> {
  const stored = await readJson(STORAGE_KEY, emptyFile());
  if (Object.keys(stored).length > 0) {
    return stored;
  }

  return loadBundledSeed();
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
