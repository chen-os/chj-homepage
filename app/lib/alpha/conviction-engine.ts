import type { AlphaHistoryFile } from "./history";
import type { GoogleTrendThemeResult } from "./google-trends";
import type { TrendMomentum } from "./momentum-engine";
import { countPremiumEvidence, type AlphaTrend } from "./trend-engine";

export type ConvictionStrength = "Strong" | "Medium" | "Weak";

export type ConvictionBreakdown = {
  googleTrends: number | null;
  newsMomentum: number;
  premiumSources: number;
  persistence: number;
  total: number;
  adjusted: boolean;
};

export type TrendConfirmation = {
  themeName: string;
  displayName: string;
  newsSignal: {
    growthRate: number;
    growthLabel: string;
    currentCount: number;
  };
  googleTrendsSignal: {
    trendScore: number;
    growthRate: number;
    growthLabel: string;
    current: number;
    interest7Day: number;
    interest30Day: number;
    available: boolean;
  };
  convictionScore: number;
  convictionStrength: ConvictionStrength;
  convictionBreakdown: ConvictionBreakdown;
};

const PREMIUM_CAP = 5;
const PERSISTENCE_CAP_DAYS = 10;

function formatGrowth(rate: number): string {
  const rounded = Math.round(rate);
  if (rounded > 0) return `+${rounded}%`;
  if (rounded < 0) return `${rounded}%`;
  return "0%";
}

function subtractDays(date: string, days: number): string {
  const parsed = new Date(`${date}T12:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() - days);
  return parsed.toISOString().slice(0, 10);
}

export function normalizeNewsMomentum(growthRate: number): number {
  return Math.min(100, Math.max(0, (growthRate + 100) / 3));
}

function averageKeywordCurrent(keywords: GoogleTrendThemeResult["keywords"]): number {
  if (keywords.length === 0) return 0;
  return (
    keywords.reduce((sum, item) => sum + item.current, 0) / keywords.length
  );
}

function averageKeywordInterest(
  keywords: GoogleTrendThemeResult["keywords"],
  field: "interest7Day" | "interest30Day",
): number {
  if (keywords.length === 0) return 0;
  return (
    keywords.reduce((sum, item) => sum + item[field], 0) / keywords.length
  );
}

export function resolveConvictionStrength(score: number): ConvictionStrength {
  if (score >= 70) return "Strong";
  if (score >= 50) return "Medium";
  return "Weak";
}

export function formatBreakdownPoints(value: number): string {
  if (value > 0) return `+${value}`;
  return `${value}`;
}

export function formatGoogleTrendsBreakdown(value: number | null): string {
  if (value === null) return "N/A";
  return formatBreakdownPoints(value);
}

const NEWS_WEIGHT = 30;
const PREMIUM_WEIGHT = 20;
const PERSISTENCE_WEIGHT = 10;
const RENORMALIZED_WEIGHT = NEWS_WEIGHT + PREMIUM_WEIGHT + PERSISTENCE_WEIGHT;

function getThemePersistenceDays(
  history: AlphaHistoryFile,
  themeName: string,
  todayDate: string,
): number {
  let age = 1;
  let cursor = subtractDays(todayDate, 1);

  while (true) {
    const day = history.history.find((entry) => entry.date === cursor);
    const trend = day?.trends.find((item) => item.name === themeName);
    if (!trend) break;
    const active =
      (trend.convictionScore ?? 0) > 0 ||
      trend.evidenceCount > 0 ||
      trend.alphaScore > 0;
    if (!active) break;
    age += 1;
    cursor = subtractDays(cursor, 1);
  }

  return age;
}

function calculateConvictionBreakdown(input: {
  googleTrendScore: number;
  googleAvailable: boolean;
  newsMomentum: number;
  premiumCount: number;
  persistenceDays: number;
}): ConvictionBreakdown {
  const newsMomentumPoints = Math.round(input.newsMomentum * 0.3);
  const premiumSourcesPoints = Math.round(
    (Math.min(input.premiumCount, PREMIUM_CAP) / PREMIUM_CAP) * 100 * 0.2,
  );
  const persistencePoints = Math.round(
    (Math.min(input.persistenceDays, PERSISTENCE_CAP_DAYS) / PERSISTENCE_CAP_DAYS) *
      100 *
      0.1,
  );

  if (input.googleAvailable) {
    const googleTrendsPoints = Math.round(input.googleTrendScore * 0.4);
    const total = Math.min(
      100,
      Math.max(
        0,
        googleTrendsPoints + newsMomentumPoints + premiumSourcesPoints + persistencePoints,
      ),
    );

    return {
      googleTrends: googleTrendsPoints,
      newsMomentum: newsMomentumPoints,
      premiumSources: premiumSourcesPoints,
      persistence: persistencePoints,
      total,
      adjusted: false,
    };
  }

  const partialSum = newsMomentumPoints + premiumSourcesPoints + persistencePoints;
  const total = Math.min(
    100,
    Math.max(0, Math.round((partialSum / RENORMALIZED_WEIGHT) * 100)),
  );

  return {
    googleTrends: null,
    newsMomentum: newsMomentumPoints,
    premiumSources: premiumSourcesPoints,
    persistence: persistencePoints,
    total,
    adjusted: true,
  };
}

export function isGoogleTrendsThemeAvailable(
  theme: GoogleTrendThemeResult,
): boolean {
  return theme.keywords.some(
    (keyword) =>
      keyword.current > 0 ||
      keyword.interest7Day > 0 ||
      keyword.interest30Day > 0 ||
      keyword.trendScore > 0,
  );
}

export function isGoogleTrendsAvailable(
  googleThemes: GoogleTrendThemeResult[],
): boolean {
  return googleThemes.some(isGoogleTrendsThemeAvailable);
}

export function buildTrendConfirmations(
  emergingThemes: TrendMomentum[],
  googleThemes: GoogleTrendThemeResult[],
  trends: AlphaTrend[] = [],
  history: AlphaHistoryFile = { history: [] },
  todayDate: string = new Date().toISOString().slice(0, 10),
): TrendConfirmation[] {
  return googleThemes
    .map((googleTheme) => {
      const newsTheme = emergingThemes.find(
        (theme) => theme.name === googleTheme.themeName,
      );
      const alphaTrend = trends.find((trend) => trend.name === googleTheme.themeName);

      const newsGrowthRate = newsTheme?.growthRate ?? 0;
      const googleAvailable = isGoogleTrendsThemeAvailable(googleTheme);
      const googleTrendScore = googleAvailable ? googleTheme.trendScore : 0;
      const newsMomentum = normalizeNewsMomentum(newsGrowthRate);
      const premiumCount = alphaTrend
        ? countPremiumEvidence(alphaTrend.evidence)
        : 0;
      const persistenceDays = getThemePersistenceDays(
        history,
        googleTheme.themeName,
        todayDate,
      );
      const convictionBreakdown = calculateConvictionBreakdown({
        googleTrendScore,
        googleAvailable,
        newsMomentum,
        premiumCount,
        persistenceDays,
      });

      return {
        themeName: googleTheme.themeName,
        displayName: googleTheme.displayName,
        newsSignal: {
          growthRate: newsGrowthRate,
          growthLabel: newsTheme?.growthLabel ?? formatGrowth(newsGrowthRate),
          currentCount: newsTheme?.currentCount ?? 0,
        },
        googleTrendsSignal: {
          trendScore: googleTrendScore,
          growthRate: googleAvailable ? googleTheme.growthRate : 0,
          growthLabel: googleAvailable
            ? formatGrowth(googleTheme.growthRate)
            : "0%",
          current: googleAvailable
            ? Math.round(averageKeywordCurrent(googleTheme.keywords) * 10) / 10
            : 0,
          interest7Day: googleAvailable
            ? Math.round(
                averageKeywordInterest(googleTheme.keywords, "interest7Day") * 10,
              ) / 10
            : 0,
          interest30Day: googleAvailable
            ? Math.round(
                averageKeywordInterest(googleTheme.keywords, "interest30Day") * 10,
              ) / 10
            : 0,
          available: googleAvailable,
        },
        convictionScore: convictionBreakdown.total,
        convictionStrength: resolveConvictionStrength(convictionBreakdown.total),
        convictionBreakdown,
      };
    })
    .sort((a, b) => b.convictionScore - a.convictionScore);
}

type TrendConfirmationReportInput = {
  date?: string;
  trends?: AlphaTrend[];
  emergingThemes?: TrendMomentum[];
  googleTrends?: GoogleTrendThemeResult[];
  trendConfirmations?: TrendConfirmation[];
};

function normalizeTrendConfirmation(item: TrendConfirmation): TrendConfirmation {
  const breakdown = item.convictionBreakdown ?? {
    googleTrends: null,
    newsMomentum: item.convictionScore,
    premiumSources: 0,
    persistence: 0,
    total: item.convictionScore,
    adjusted: !item.googleTrendsSignal.available,
  };
  const convictionScore = breakdown.total ?? item.convictionScore;
  const googleTrends =
    breakdown.googleTrends ??
    (item.googleTrendsSignal.available ? 0 : null);

  return {
    ...item,
    convictionScore,
    convictionStrength:
      item.convictionStrength ?? resolveConvictionStrength(convictionScore),
    convictionBreakdown: {
      ...breakdown,
      googleTrends,
      total: convictionScore,
      adjusted:
        breakdown.adjusted ??
        (!item.googleTrendsSignal.available && googleTrends === null),
    },
    googleTrendsSignal: {
      ...item.googleTrendsSignal,
      available: item.googleTrendsSignal.available ?? false,
    },
  };
}

export function resolveTrendConfirmations(
  report: TrendConfirmationReportInput,
): TrendConfirmation[] {
  const existing = report.trendConfirmations ?? [];
  if (existing.length > 0) {
    return existing.map(normalizeTrendConfirmation);
  }

  const googleTrends = report.googleTrends ?? [];
  const emergingThemes = report.emergingThemes ?? [];

  if (googleTrends.length > 0) {
    return buildTrendConfirmations(
      emergingThemes,
      googleTrends,
      report.trends ?? [],
      { history: [] },
      report.date ?? new Date().toISOString().slice(0, 10),
    );
  }

  return [];
}
