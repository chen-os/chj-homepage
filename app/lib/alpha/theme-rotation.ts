import type { TrendConfirmation } from "./conviction-engine";
import { readJson, upsertJson } from "./storage";

export type DailyThemeRotation = {
  date: string;
  rank1: string;
  rank2: string;
  rank3: string;
  rank4: string;
};

export type ThemeRotationHistoryFile = {
  history: DailyThemeRotation[];
};

export type ThemeChampionStat = {
  displayName: string;
  wins7Day: number;
  wins30Day: number;
  winsAllTime: number;
};

export type CurrentReign = {
  displayName: string;
  consecutiveDays: number;
};

export type LeadershipChange = {
  date: string;
  from: string;
  to: string;
};

export type ThemeRotationSummary = {
  champions: ThemeChampionStat[];
  currentReign: CurrentReign | null;
  leadershipChange: LeadershipChange | null;
};

const STORAGE_KEY = "theme-rotation-history.json";

function emptyHistory(): ThemeRotationHistoryFile {
  return { history: [] };
}

function normalizeHistory(data: ThemeRotationHistoryFile): ThemeRotationHistoryFile {
  if (!Array.isArray(data.history)) {
    return emptyHistory();
  }
  return data;
}

function sortHistory(data: ThemeRotationHistoryFile): ThemeRotationHistoryFile {
  return {
    history: [...data.history].sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export async function loadThemeRotationHistory(): Promise<ThemeRotationHistoryFile> {
  const data = await readJson(STORAGE_KEY, emptyHistory());
  return normalizeHistory(data);
}

function buildDailyRotation(
  date: string,
  confirmations: TrendConfirmation[],
): DailyThemeRotation | null {
  const ranked = [...confirmations].sort(
    (a, b) => b.convictionScore - a.convictionScore,
  );

  if (ranked.length < 4) return null;

  return {
    date,
    rank1: ranked[0].displayName,
    rank2: ranked[1].displayName,
    rank3: ranked[2].displayName,
    rank4: ranked[3].displayName,
  };
}

export async function appendDailyThemeRotation(
  date: string,
  confirmations: TrendConfirmation[],
): Promise<ThemeRotationHistoryFile> {
  const snapshot = buildDailyRotation(date, confirmations);
  if (!snapshot) return loadThemeRotationHistory();

  return upsertJson(
    STORAGE_KEY,
    (data) => {
      const normalized = normalizeHistory(data);
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

function subtractDays(date: string, days: number): string {
  const parsed = new Date(`${date}T12:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() - days);
  return parsed.toISOString().slice(0, 10);
}

function countChampionWins(
  history: ThemeRotationHistoryFile,
  displayName: string,
  sinceDate?: string,
): number {
  return history.history.filter((entry) => {
    if (sinceDate && entry.date < sinceDate) return false;
    return entry.rank1 === displayName;
  }).length;
}

function collectChampionNames(history: ThemeRotationHistoryFile): string[] {
  const names = new Set<string>();
  for (const entry of history.history) {
    names.add(entry.rank1);
    names.add(entry.rank2);
    names.add(entry.rank3);
    names.add(entry.rank4);
  }
  return [...names].sort();
}

export function buildThemeChampions(
  history: ThemeRotationHistoryFile,
  todayDate: string = new Date().toISOString().slice(0, 10),
): ThemeChampionStat[] {
  const since7Day = subtractDays(todayDate, 6);
  const since30Day = subtractDays(todayDate, 29);

  return collectChampionNames(history)
    .map((displayName) => ({
      displayName,
      wins7Day: countChampionWins(history, displayName, since7Day),
      wins30Day: countChampionWins(history, displayName, since30Day),
      winsAllTime: countChampionWins(history, displayName),
    }))
    .filter(
      (item) => item.wins7Day > 0 || item.wins30Day > 0 || item.winsAllTime > 0,
    )
    .sort(
      (a, b) =>
        b.winsAllTime - a.winsAllTime ||
        b.wins30Day - a.wins30Day ||
        b.wins7Day - a.wins7Day,
    );
}

export function buildCurrentReign(
  history: ThemeRotationHistoryFile,
): CurrentReign | null {
  if (history.history.length === 0) return null;

  const sorted = [...history.history].sort((a, b) => b.date.localeCompare(a.date));
  const champion = sorted[0].rank1;
  let consecutiveDays = 0;

  for (const entry of sorted) {
    if (entry.rank1 !== champion) break;
    consecutiveDays += 1;
  }

  return {
    displayName: champion,
    consecutiveDays,
  };
}

export function buildLeadershipChange(
  history: ThemeRotationHistoryFile,
): LeadershipChange | null {
  const sorted = [...history.history].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < 2) return null;

  for (let index = sorted.length - 1; index >= 1; index -= 1) {
    const current = sorted[index];
    const previous = sorted[index - 1];
    if (current.rank1 !== previous.rank1) {
      return {
        date: current.date,
        from: previous.rank1,
        to: current.rank1,
      };
    }
  }

  return null;
}

export async function buildThemeRotationSummary(
  history?: ThemeRotationHistoryFile,
  todayDate: string = new Date().toISOString().slice(0, 10),
): Promise<ThemeRotationSummary> {
  const resolvedHistory = history ?? (await loadThemeRotationHistory());
  return {
    champions: buildThemeChampions(resolvedHistory, todayDate),
    currentReign: buildCurrentReign(resolvedHistory),
    leadershipChange: buildLeadershipChange(resolvedHistory),
  };
}
