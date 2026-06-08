import type { LifecycleStage, TrendLifecycle } from "./trend-lifecycle-engine";
import { getCachedStockReturns } from "./stock-returns";

export type ThemeDivergenceDefinition = {
  themeName: string;
  displayName: string;
  tickers: string[];
};

export type DivergenceStatus =
  | "UNDEROWNED"
  | "CONFIRMED"
  | "OVEREXTENDED"
  | "WEAK"
  | "NEUTRAL";

export type ThemeDivergence = {
  themeName: string;
  displayName: string;
  themeStrength: number;
  basketReturn5D: number | null;
  basketReturn20D: number | null;
  basketReturn5DLabel: string;
  basketReturn20DLabel: string;
  divergenceScore: number | null;
  themeRank: number;
  stockRank5D: number;
  stockRank20D: number;
  relativeDivergence: number;
  lifecycleStage: LifecycleStage;
  alphaOpportunityScore: number;
  divergenceStatus: DivergenceStatus;
  actionHint: string;
};

export type AlphaOpportunity = {
  themeName: string;
  displayName: string;
  alphaOpportunityScore: number;
  divergenceStatus: DivergenceStatus;
  themeRank: number;
  stockRank5D: number;
  lifecycleStage: LifecycleStage;
  actionHint: string;
};

export type ThemeDivergenceReport = {
  themeDivergence: ThemeDivergence[];
  alphaOpportunities: AlphaOpportunity[];
};

export const THEME_DIVERGENCE_DEFINITIONS: ThemeDivergenceDefinition[] = [
  {
    themeName: "AI Data Center Power Demand",
    displayName: "AI Power",
    tickers: ["LEU", "CEG", "VST", "ETN", "BE"],
  },
  {
    themeName: "Nuclear Fuel Cycle",
    displayName: "Nuclear",
    tickers: ["LEU", "CCJ", "SMR", "OKLO", "CEG"],
  },
  {
    themeName: "Humanoid Robotics Supply Chain",
    displayName: "Humanoid",
    tickers: ["TSLA", "NVDA", "TER", "FANUY"],
  },
  {
    themeName: "AI Compute Infrastructure",
    displayName: "AI Compute",
    tickers: ["NVDA", "AMD", "AVGO", "ANET", "MU"],
  },
];

type DivergenceDraft = {
  themeName: string;
  displayName: string;
  themeStrength: number;
  basketReturn5D: number | null;
  basketReturn20D: number | null;
  lifecycleStage: LifecycleStage;
};

function formatBasketReturn(value: number | null): string {
  if (value === null) return "N/A";
  const rounded = Math.round(value);
  if (rounded > 0) return `+${rounded}%`;
  if (rounded < 0) return `${rounded}%`;
  return "0%";
}

function averageNullable(values: number[]): number | null {
  if (values.length === 0) return null;
  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round((total / values.length) * 10) / 10;
}

function computeThemeStrength(alphaScore: number, convictionScore: number): number {
  return Math.round(alphaScore * 0.6 + convictionScore * 0.4);
}

function normalizeThemeStrength(themeStrength: number): number {
  return Math.max(0, Math.min(100, themeStrength));
}

function normalizeStockStrength(basketReturn5D: number): number {
  return Math.max(0, Math.min(100, 50 + basketReturn5D * 2));
}

function clampScore(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value)));
}

function rankByThemeName<T extends { themeName: string }>(
  items: T[],
  selector: (item: T) => number,
  descending = true,
): Map<string, number> {
  const sorted = [...items].sort((left, right) => {
    const delta = descending
      ? selector(right) - selector(left)
      : selector(left) - selector(right);
    if (delta !== 0) return delta;
    return left.themeName.localeCompare(right.themeName);
  });

  const ranks = new Map<string, number>();
  sorted.forEach((item, index) => {
    ranks.set(item.themeName, index + 1);
  });
  return ranks;
}

function resolveRelativeDivergenceStatus(
  themeRank: number,
  stockRank5D: number,
  basketReturn5D: number | null,
): DivergenceStatus {
  if (basketReturn5D === null) return "NEUTRAL";
  if (themeRank <= 2 && stockRank5D >= 3 && basketReturn5D <= 0) {
    return "UNDEROWNED";
  }
  if (themeRank <= 2 && stockRank5D <= 2 && basketReturn5D > 0) {
    return "CONFIRMED";
  }
  if (themeRank >= 3 && stockRank5D <= 2 && basketReturn5D > 5) {
    return "OVEREXTENDED";
  }
  if (themeRank >= 3 && stockRank5D >= 3) {
    return "WEAK";
  }
  return "NEUTRAL";
}

function resolveActionHint(status: DivergenceStatus): string {
  switch (status) {
    case "UNDEROWNED":
      return "Potential Catch-Up";
    case "CONFIRMED":
      return "Trend Confirmed";
    case "OVEREXTENDED":
      return "Avoid Chasing";
    case "WEAK":
      return "Low Priority";
    default:
      return "Monitor";
  }
}

function computeAlphaOpportunityScore(
  relativeDivergence: number,
  lifecycleStage: LifecycleStage,
  themeStrength: number,
): number {
  let score = relativeDivergence * 20;

  switch (lifecycleStage) {
    case "Emerging":
      score += 20;
      break;
    case "Accelerating":
      score += 25;
      break;
    case "Peak":
      score += 5;
      break;
    case "Decelerating":
      score -= 10;
      break;
    case "Failed Breakout":
      score -= 20;
      break;
    default:
      break;
  }

  score += themeStrength / 2;
  return clampScore(score);
}

function findLifecycle(
  lifecycles: TrendLifecycle[],
  definition: ThemeDivergenceDefinition,
): TrendLifecycle | undefined {
  return lifecycles.find(
    (item) =>
      item.themeName === definition.themeName ||
      item.displayName === definition.displayName,
  );
}

function buildAlphaOpportunities(
  themeDivergence: ThemeDivergence[],
): AlphaOpportunity[] {
  return [...themeDivergence]
    .sort(
      (left, right) =>
        right.alphaOpportunityScore - left.alphaOpportunityScore ||
        left.themeRank - right.themeRank ||
        left.displayName.localeCompare(right.displayName),
    )
    .map((item) => ({
      themeName: item.themeName,
      displayName: item.displayName,
      alphaOpportunityScore: item.alphaOpportunityScore,
      divergenceStatus: item.divergenceStatus,
      themeRank: item.themeRank,
      stockRank5D: item.stockRank5D,
      lifecycleStage: item.lifecycleStage,
      actionHint: item.actionHint,
    }));
}

export async function buildThemeDivergenceReport(
  trendLifecycles: TrendLifecycle[],
): Promise<ThemeDivergenceReport> {
  try {
    const allTickers = THEME_DIVERGENCE_DEFINITIONS.flatMap((item) => item.tickers);
    const returnsByTicker = await getCachedStockReturns(allTickers);

    const drafts: DivergenceDraft[] = THEME_DIVERGENCE_DEFINITIONS.map(
      (definition) => {
        const lifecycle = findLifecycle(trendLifecycles, definition);
        const alphaScore = lifecycle?.alphaScore ?? 0;
        const convictionScore = lifecycle?.convictionScore ?? 0;
        const themeStrength = computeThemeStrength(alphaScore, convictionScore);

        const return5DValues = definition.tickers
          .map((ticker) => returnsByTicker.get(ticker)?.return5D)
          .filter((value): value is number => value !== null);
        const return20DValues = definition.tickers
          .map((ticker) => returnsByTicker.get(ticker)?.return20D)
          .filter((value): value is number => value !== null);

        return {
          themeName: definition.themeName,
          displayName: definition.displayName,
          themeStrength,
          basketReturn5D: averageNullable(return5DValues),
          basketReturn20D: averageNullable(return20DValues),
          lifecycleStage: lifecycle?.lifecycleStage ?? "Dormant",
        };
      },
    );

    const themeRanks = rankByThemeName(drafts, (item) => item.themeStrength, true);
    const stockRanks5D = rankByThemeName(
      drafts,
      (item) => item.basketReturn5D ?? Number.NEGATIVE_INFINITY,
      true,
    );
    const stockRanks20D = rankByThemeName(
      drafts,
      (item) => item.basketReturn20D ?? Number.NEGATIVE_INFINITY,
      true,
    );

    const themeDivergence = drafts.map((draft) => {
      const themeRank = themeRanks.get(draft.themeName) ?? drafts.length;
      const stockRank5D = stockRanks5D.get(draft.themeName) ?? drafts.length;
      const stockRank20D = stockRanks20D.get(draft.themeName) ?? drafts.length;
      const relativeDivergence = stockRank5D - themeRank;
      const divergenceStatus = resolveRelativeDivergenceStatus(
        themeRank,
        stockRank5D,
        draft.basketReturn5D,
      );
      const alphaOpportunityScore = computeAlphaOpportunityScore(
        relativeDivergence,
        draft.lifecycleStage,
        draft.themeStrength,
      );
      const divergenceScore =
        draft.basketReturn5D === null
          ? null
          : Math.round(
              (normalizeThemeStrength(draft.themeStrength) -
                normalizeStockStrength(draft.basketReturn5D)) *
                10,
            ) / 10;

      return {
        themeName: draft.themeName,
        displayName: draft.displayName,
        themeStrength: draft.themeStrength,
        basketReturn5D: draft.basketReturn5D,
        basketReturn20D: draft.basketReturn20D,
        basketReturn5DLabel: formatBasketReturn(draft.basketReturn5D),
        basketReturn20DLabel: formatBasketReturn(draft.basketReturn20D),
        divergenceScore,
        themeRank,
        stockRank5D,
        stockRank20D,
        relativeDivergence,
        lifecycleStage: draft.lifecycleStage,
        alphaOpportunityScore,
        divergenceStatus,
        actionHint: resolveActionHint(divergenceStatus),
      };
    });

    return {
      themeDivergence,
      alphaOpportunities: buildAlphaOpportunities(themeDivergence),
    };
  } catch (error) {
    console.error("[theme-divergence] Failed to build theme divergence:", error);
    return {
      themeDivergence: [],
      alphaOpportunities: [],
    };
  }
}

export async function buildThemeDivergence(
  trendLifecycles: TrendLifecycle[],
): Promise<ThemeDivergence[]> {
  const report = await buildThemeDivergenceReport(trendLifecycles);
  return report.themeDivergence;
}
