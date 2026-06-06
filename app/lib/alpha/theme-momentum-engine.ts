import type { AlphaHistoryFile } from "./history";
import type { TrendConfirmation } from "./conviction-engine";

export type ThemeMomentum = {
  themeName: string;
  displayName: string;
  convictionScore: number;
  convictionChange7Day: number;
  convictionChangeLabel: string;
  trendAgeDays: number;
};

export type TrendLeaderboardEntry = {
  rank: number;
  themeName: string;
  displayName: string;
  convictionIncrease7Day: number;
  increaseLabel: string;
};

function subtractDays(date: string, days: number): string {
  const parsed = new Date(`${date}T12:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() - days);
  return parsed.toISOString().slice(0, 10);
}

function formatConvictionChange(change: number): string {
  const rounded = Math.round(change);
  if (rounded > 0) return `▲ +${rounded} (7D)`;
  if (rounded < 0) return `▼ ${rounded} (7D)`;
  return "— 0 (7D)";
}

function formatIncreaseLabel(change: number): string {
  const rounded = Math.round(change);
  if (rounded > 0) return `+${rounded}`;
  if (rounded < 0) return `${rounded}`;
  return "0";
}

function getConvictionFromDay(
  history: AlphaHistoryFile,
  themeName: string,
  date: string,
): number | undefined {
  const day = history.history.find((entry) => entry.date === date);
  const trend = day?.trends.find((item) => item.name === themeName);
  return trend?.convictionScore;
}

function getBaselineConviction7Day(
  history: AlphaHistoryFile,
  themeName: string,
  todayDate: string,
): number | null {
  const targetDate = subtractDays(todayDate, 7);
  const priorEntry = history.history
    .filter((entry) => entry.date < todayDate && entry.date <= targetDate)
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  if (priorEntry) {
    const conviction = getConvictionFromDay(history, themeName, priorEntry.date);
    if (conviction !== undefined) return conviction;
  }

  const priorDays = history.history
    .filter((entry) => entry.date < todayDate)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);

  const values = priorDays
    .map((entry) => getConvictionFromDay(history, themeName, entry.date))
    .filter((value): value is number => value !== undefined);

  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getTrendAgeDays(
  history: AlphaHistoryFile,
  themeName: string,
  todayDate: string,
  todayConviction: number,
): number {
  if (todayConviction <= 0) return 0;

  let age = 1;
  let cursor = subtractDays(todayDate, 1);

  while (true) {
    const conviction = getConvictionFromDay(history, themeName, cursor);
    if (conviction === undefined || conviction <= 0) break;
    age += 1;
    cursor = subtractDays(cursor, 1);
  }

  return age;
}

export function buildThemeMomentum(
  history: AlphaHistoryFile,
  todayDate: string,
  confirmations: TrendConfirmation[],
): ThemeMomentum[] {
  return confirmations
    .map((confirmation) => {
      const convictionScore = confirmation.convictionScore;
      const baseline = getBaselineConviction7Day(
        history,
        confirmation.themeName,
        todayDate,
      );
      const convictionChange7Day =
        baseline === null ? 0 : convictionScore - baseline;

      return {
        themeName: confirmation.themeName,
        displayName: confirmation.displayName,
        convictionScore,
        convictionChange7Day,
        convictionChangeLabel: formatConvictionChange(convictionChange7Day),
        trendAgeDays: getTrendAgeDays(
          history,
          confirmation.themeName,
          todayDate,
          convictionScore,
        ),
      };
    })
    .sort((a, b) => b.convictionScore - a.convictionScore);
}

export function buildTrendLeaderboard(
  momentum: ThemeMomentum[],
): TrendLeaderboardEntry[] {
  return [...momentum]
    .sort((a, b) => b.convictionChange7Day - a.convictionChange7Day)
    .map((item, index) => ({
      rank: index + 1,
      themeName: item.themeName,
      displayName: item.displayName,
      convictionIncrease7Day: item.convictionChange7Day,
      increaseLabel: formatIncreaseLabel(item.convictionChange7Day),
    }));
}
