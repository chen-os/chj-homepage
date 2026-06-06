export type GoogleTrendKeywordResult = {
  keyword: string;
  current: number;
  previous: number;
  growthRate: number;
  trendScore: number;
  interest7Day: number;
  interest30Day: number;
};

export type GoogleTrendThemeResult = {
  themeId: string;
  themeName: string;
  displayName: string;
  keywords: GoogleTrendKeywordResult[];
  trendScore: number;
  growthRate: number;
};

type TrendGroupConfig = {
  themeId: string;
  themeName: string;
  displayName: string;
  keywords: string[];
};

type TimelinePoint = {
  value: number[];
  isPartial?: boolean;
};

const TREND_GROUPS: TrendGroupConfig[] = [
  {
    themeId: "ai-power",
    themeName: "AI Data Center Power Demand",
    displayName: "AI Power",
    keywords: ["data center power", "AI electricity demand"],
  },
  {
    themeId: "nuclear",
    themeName: "Nuclear Fuel Cycle",
    displayName: "Nuclear",
    keywords: ["HALEU", "SMR", "Oklo", "Centrus Energy"],
  },
  {
    themeId: "humanoid",
    themeName: "Humanoid Robotics Supply Chain",
    displayName: "Humanoid",
    keywords: ["Figure AI", "1X Robot", "Humanoid Robot"],
  },
  {
    themeId: "ai-compute",
    themeName: "AI Compute Infrastructure",
    displayName: "AI Compute",
    keywords: ["inference compute", "GPU cluster", "AI infrastructure"],
  },
];

function averagePoints(points: TimelinePoint[]): number {
  if (points.length === 0) return 0;
  const total = points.reduce((sum, point) => sum + (point.value[0] ?? 0), 0);
  return total / points.length;
}

function calculateGrowthRate(current: number, previous: number): number {
  if (previous <= 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

function calculateTrendScore(
  current: number,
  interest7Day: number,
  interest30Day: number,
  growthRate: number,
): number {
  const momentumBoost = Math.max(0, growthRate) * 0.25;
  const relative7vs30 =
    interest30Day > 0 ? (interest7Day / interest30Day) * 20 : 0;
  const score = current * 0.45 + interest7Day * 0.25 + relative7vs30 + momentumBoost;
  return Math.min(100, Math.round(score));
}

function parseGoogleTrendsResponse(raw: string): {
  default?: { timelineData?: TimelinePoint[] };
} {
  const cleaned = raw.trim().replace(/^\)\]\}',?\s*/, "");
  return JSON.parse(cleaned) as {
    default?: { timelineData?: TimelinePoint[] };
  };
}

async function fetchInterestTimeline(keyword: string): Promise<TimelinePoint[]> {
  const googleTrends = await import("google-trends-api");
  const endTime = new Date();
  const startTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const raw = await googleTrends.default.interestOverTime({
    keyword,
    startTime,
    endTime,
    geo: "US",
  });

  const parsed = parseGoogleTrendsResponse(raw);
  return parsed.default?.timelineData ?? [];
}

async function fetchKeywordTrend(keyword: string): Promise<GoogleTrendKeywordResult> {
  try {
    const timeline = await fetchInterestTimeline(keyword);

    if (timeline.length === 0) {
      throw new Error(`No timeline data for "${keyword}"`);
    }

    const completePoints = timeline.filter((point) => !point.isPartial);
    const usable = completePoints.length > 0 ? completePoints : timeline;
    const last7 = usable.slice(-7);
    const prior7 = usable.slice(-14, -7);
    const current = usable[usable.length - 1]?.value[0] ?? 0;
    const interest7Day = averagePoints(last7);
    const interest30Day = averagePoints(usable);
    const previous = averagePoints(prior7);
    const growthRate = calculateGrowthRate(interest7Day, previous);

    return {
      keyword,
      current,
      previous: Math.round(previous * 10) / 10,
      growthRate: Math.round(growthRate * 10) / 10,
      trendScore: calculateTrendScore(
        current,
        interest7Day,
        interest30Day,
        growthRate,
      ),
      interest7Day: Math.round(interest7Day * 10) / 10,
      interest30Day: Math.round(interest30Day * 10) / 10,
    };
  } catch {
    return {
      keyword,
      current: 0,
      previous: 0,
      growthRate: 0,
      trendScore: 0,
      interest7Day: 0,
      interest30Day: 0,
    };
  }
}

function aggregateThemeKeywords(
  keywords: GoogleTrendKeywordResult[],
): Pick<GoogleTrendThemeResult, "trendScore" | "growthRate"> {
  if (keywords.length === 0) {
    return { trendScore: 0, growthRate: 0 };
  }

  const trendScore =
    keywords.reduce((sum, item) => sum + item.trendScore, 0) / keywords.length;
  const growthRate =
    keywords.reduce((sum, item) => sum + item.growthRate, 0) / keywords.length;

  return {
    trendScore: Math.round(trendScore),
    growthRate: Math.round(growthRate * 10) / 10,
  };
}

export async function fetchGoogleTrendsByTheme(): Promise<GoogleTrendThemeResult[]> {
  const results = await Promise.all(
    TREND_GROUPS.map(async (group) => {
      const keywordResults = await Promise.allSettled(
        group.keywords.map((keyword) => fetchKeywordTrend(keyword)),
      );

      const keywords = keywordResults.map((result, index) =>
        result.status === "fulfilled"
          ? result.value
          : {
              keyword: group.keywords[index],
              current: 0,
              previous: 0,
              growthRate: 0,
              trendScore: 0,
              interest7Day: 0,
              interest30Day: 0,
            },
      );

      const aggregate = aggregateThemeKeywords(keywords);

      return {
        themeId: group.themeId,
        themeName: group.themeName,
        displayName: group.displayName,
        keywords,
        ...aggregate,
      };
    }),
  );

  return results;
}

export async function fetchAllGoogleTrendKeywords(): Promise<GoogleTrendKeywordResult[]> {
  const themes = await fetchGoogleTrendsByTheme();
  return themes.flatMap((theme) => theme.keywords);
}

export function getGoogleTrendThemeConfigs(): TrendGroupConfig[] {
  return TREND_GROUPS;
}
