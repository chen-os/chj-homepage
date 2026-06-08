import type { TrendConfirmation } from "./conviction-engine";
import { formatConvictionChangeLabel } from "./format-labels";
import type { ThemeMomentum } from "./theme-momentum-engine";
import type { AlphaTrend } from "./trend-engine";

export type LifecycleStage =
  | "Accelerating"
  | "Emerging"
  | "Peak"
  | "Cooling"
  | "Decelerating"
  | "Failed Breakout"
  | "Dormant";

export type TrendLifecycle = {
  themeName: string;
  displayName: string;
  alphaScore: number;
  convictionScore: number;
  convictionChange7Day: number;
  convictionChangeLabel: string;
  trendAgeDays: number;
  lifecycleStage: LifecycleStage;
  lifecycleReason: string;
  actionHint: string;
};

type LifecycleResolution = {
  lifecycleStage: LifecycleStage;
  lifecycleReason: string;
  actionHint: string;
};

function resolveLifecycleStage(
  alphaScore: number,
  convictionScore: number,
  convictionChange7Day: number,
  trendAgeDays: number,
): LifecycleResolution {
  if (convictionScore >= 45 && convictionChange7Day > 5) {
    return {
      lifecycleStage: "Accelerating",
      lifecycleReason: "Theme is strengthening",
      actionHint: "Watch for breakout",
    };
  }

  if (
    convictionScore >= 25 &&
    convictionScore < 45 &&
    trendAgeDays <= 3 &&
    convictionChange7Day >= -10
  ) {
    return {
      lifecycleStage: "Emerging",
      lifecycleReason: "Early theme without strong confirmation yet",
      actionHint: "Early watch",
    };
  }

  if (
    convictionScore >= 45 &&
    convictionChange7Day <= 0 &&
    convictionChange7Day >= -10
  ) {
    return {
      lifecycleStage: "Peak",
      lifecycleReason: "Theme remains strong but growth is slowing",
      actionHint: "Avoid chasing",
    };
  }

  if (
    alphaScore >= 50 &&
    convictionChange7Day < 0 &&
    convictionChange7Day >= -15
  ) {
    return {
      lifecycleStage: "Cooling",
      lifecycleReason: "Theme still has heat but momentum is fading",
      actionHint: "Watch but do not chase",
    };
  }

  if (convictionChange7Day < -15 && convictionScore >= 30) {
    return {
      lifecycleStage: "Decelerating",
      lifecycleReason: "Theme momentum is fading sharply",
      actionHint: "Reduce confidence",
    };
  }

  if (convictionScore < 30 && convictionChange7Day < -10) {
    return {
      lifecycleStage: "Failed Breakout",
      lifecycleReason: "Theme failed to sustain confirmation",
      actionHint: "Ignore for now",
    };
  }

  if (convictionScore < 20 && alphaScore < 30) {
    return {
      lifecycleStage: "Dormant",
      lifecycleReason: "No actionable lifecycle signal",
      actionHint: "No action",
    };
  }

  return {
    lifecycleStage: "Peak",
    lifecycleReason: "Theme remains active with muted momentum",
    actionHint: "Avoid chasing",
  };
}

export function buildTrendLifecycles(
  trendConfirmations: TrendConfirmation[],
  themeMomentum: ThemeMomentum[],
  trends: AlphaTrend[],
): TrendLifecycle[] {
  const trendByName = new Map(trends.map((trend) => [trend.name, trend]));
  const confirmationByName = new Map(
    trendConfirmations.map((item) => [item.themeName, item]),
  );

  return themeMomentum
    .map((momentum) => {
      const trend = trendByName.get(momentum.themeName);
      const confirmation = confirmationByName.get(momentum.themeName);
      const alphaScore = trend?.alphaScore ?? 0;
      const lifecycle = resolveLifecycleStage(
        alphaScore,
        momentum.convictionScore,
        momentum.convictionChange7Day,
        momentum.trendAgeDays,
      );

      return {
        themeName: momentum.themeName,
        displayName:
          confirmation?.displayName ??
          momentum.displayName,
        alphaScore,
        convictionScore: momentum.convictionScore,
        convictionChange7Day: momentum.convictionChange7Day,
        convictionChangeLabel: formatConvictionChangeLabel(
          momentum.convictionChange7Day,
        ),
        trendAgeDays: momentum.trendAgeDays,
        ...lifecycle,
      };
    })
    .sort((a, b) => b.convictionScore - a.convictionScore);
}
