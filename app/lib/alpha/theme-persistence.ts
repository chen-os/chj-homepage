import type { TrendConfirmation } from "./conviction-engine";
import type { HistoryTrendSnapshot } from "./history";
import type { AlphaTrend } from "./trend-engine";

export function buildThemeSnapshots(
  trends: AlphaTrend[],
  confirmations: TrendConfirmation[],
): HistoryTrendSnapshot[] {
  return confirmations.map((confirmation) => {
    const alphaTrend = trends.find((trend) => trend.name === confirmation.themeName);

    return {
      name: confirmation.themeName,
      displayName: confirmation.displayName,
      alphaScore: alphaTrend?.alphaScore ?? 0,
      signalStrength: alphaTrend?.signalStrength ?? "Low",
      evidenceCount:
        alphaTrend?.evidence.length ?? confirmation.newsSignal.currentCount,
      convictionScore: confirmation.convictionScore,
      googleTrendScore: confirmation.googleTrendsSignal.available
        ? confirmation.googleTrendsSignal.trendScore
        : 0,
    };
  });
}
