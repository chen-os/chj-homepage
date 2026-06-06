import type { AlphaHistoryFile } from "./history";

export type TrendMomentum = {
  name: string;
  displayName: string;
  currentCount: number;
  sevenDayAverage: number;
  growthRate: number;
  growthLabel: string;
};

const DISPLAY_NAMES: Record<string, string> = {
  "AI Data Center Power Demand": "AI Power",
  "Nuclear Fuel Cycle": "Nuclear Fuel",
  "Humanoid Robotics Supply Chain": "Humanoid Robotics",
  "AI Compute Infrastructure": "AI Compute",
};

function formatGrowth(rate: number): string {
  const rounded = Math.round(rate);
  if (rounded > 0) return `+${rounded}%`;
  if (rounded < 0) return `${rounded}%`;
  return "0%";
}

function getSevenDayAverage(
  history: AlphaHistoryFile,
  trendName: string,
  todayDate: string,
): number {
  const priorDays = history.history
    .filter((day) => day.date < todayDate)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);

  if (priorDays.length === 0) return 0;

  const total = priorDays.reduce((sum, day) => {
    const trend = day.trends.find((item) => item.name === trendName);
    return sum + (trend?.evidenceCount ?? 0);
  }, 0);

  return total / priorDays.length;
}

function getCurrentCount(
  history: AlphaHistoryFile,
  trendName: string,
  todayDate: string,
): number {
  const today = history.history.find((day) => day.date === todayDate);
  const trend = today?.trends.find((item) => item.name === trendName);
  return trend?.evidenceCount ?? 0;
}

function calculateGrowthRate(current: number, average: number): number {
  if (average <= 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - average) / average) * 100;
}

export function buildTrendMomentum(
  history: AlphaHistoryFile,
  todayDate: string,
): TrendMomentum[] {
  const today = history.history.find((day) => day.date === todayDate);
  if (!today) return [];

  return today.trends
    .map((trend) => {
      const currentCount = trend.evidenceCount;
      const sevenDayAverage = getSevenDayAverage(history, trend.name, todayDate);
      const growthRate = calculateGrowthRate(currentCount, sevenDayAverage);

      return {
        name: trend.name,
        displayName: DISPLAY_NAMES[trend.name] ?? trend.name,
        currentCount,
        sevenDayAverage: Math.round(sevenDayAverage * 10) / 10,
        growthRate,
        growthLabel: formatGrowth(growthRate),
      };
    })
    .sort((a, b) => b.growthRate - a.growthRate);
}

export function buildEmergingThemes(
  history: AlphaHistoryFile,
  todayDate: string,
): TrendMomentum[] {
  return buildTrendMomentum(history, todayDate);
}
