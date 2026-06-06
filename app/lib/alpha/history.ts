import type { AlphaTrend } from "./trend-engine";
import { readJson, upsertJson, writeJson } from "./storage";

export type HistoryTrendSnapshot = {
  name: string;
  displayName?: string;
  alphaScore: number;
  signalStrength: "High" | "Medium" | "Low";
  evidenceCount: number;
  convictionScore?: number;
  googleTrendScore?: number;
};

export type DailyHistorySnapshot = {
  date: string;
  trends: HistoryTrendSnapshot[];
};

export type AlphaHistoryFile = {
  history: DailyHistorySnapshot[];
};

export type TrendHistoryPoint = {
  date: string;
  alphaScore: number;
  evidenceCount: number;
  signalStrength: "High" | "Medium" | "Low";
  convictionScore?: number;
  googleTrendScore?: number;
};

export type ThemeHistoryRecord = {
  theme: string;
  date: string;
  convictionScore: number;
};

const STORAGE_KEY = "alpha-history.json";

function emptyHistory(): AlphaHistoryFile {
  return { history: [] };
}

function normalizeHistory(data: AlphaHistoryFile): AlphaHistoryFile {
  if (!Array.isArray(data.history)) {
    return emptyHistory();
  }
  return data;
}

function sortHistory(data: AlphaHistoryFile): AlphaHistoryFile {
  return {
    history: [...data.history].sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export async function loadHistory(): Promise<AlphaHistoryFile> {
  const data = await readJson(STORAGE_KEY, emptyHistory());
  return normalizeHistory(data);
}

export async function saveSnapshot(data: AlphaHistoryFile): Promise<void> {
  await writeJson(STORAGE_KEY, sortHistory(data));
}

function trendsToSnapshot(trends: AlphaTrend[]): HistoryTrendSnapshot[] {
  return trends.map((trend) => ({
    name: trend.name,
    alphaScore: trend.alphaScore,
    signalStrength: trend.signalStrength,
    evidenceCount: trend.evidence.length,
  }));
}

export function buildInMemoryHistoryWithTodayEvidence(
  prior: AlphaHistoryFile,
  date: string,
  trends: AlphaTrend[],
): AlphaHistoryFile {
  const snapshot: DailyHistorySnapshot = {
    date,
    trends: trendsToSnapshot(trends),
  };

  const history = prior.history.filter((entry) => entry.date !== date);
  return { history: [...history, snapshot] };
}

export async function appendTodaySnapshot(
  date: string,
  trends: HistoryTrendSnapshot[],
): Promise<AlphaHistoryFile> {
  return upsertJson(
    STORAGE_KEY,
    (data) => {
      const normalized = normalizeHistory(data);
      const snapshot: DailyHistorySnapshot = {
        date,
        trends,
      };
      const existingIndex = normalized.history.findIndex((entry) => entry.date === date);

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

export async function getTrendHistory(trendName: string): Promise<TrendHistoryPoint[]> {
  const data = await loadHistory();

  return data.history
    .flatMap((day) => {
      const trend = day.trends.find((item) => item.name === trendName);
      if (!trend) return [];
      return [
        {
          date: day.date,
          alphaScore: trend.alphaScore,
          evidenceCount: trend.evidenceCount,
          signalStrength: trend.signalStrength,
          convictionScore: trend.convictionScore,
          googleTrendScore: trend.googleTrendScore,
        },
      ];
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getThemeHistoryRecords(): Promise<ThemeHistoryRecord[]> {
  const data = await loadHistory();

  return data.history
    .flatMap((day) =>
      day.trends
        .filter((trend) => trend.convictionScore !== undefined)
        .map((trend) => ({
          theme: trend.displayName ?? trend.name,
          date: day.date,
          convictionScore: trend.convictionScore as number,
        })),
    )
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.theme.localeCompare(b.theme);
    });
}
