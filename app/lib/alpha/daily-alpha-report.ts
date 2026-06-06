import type { TrendConfirmation } from "./conviction-engine";
import type { GoogleTrendThemeResult } from "./google-trends";
import type { AlphaTrend } from "./trend-engine";

export type DailyAlphaReportInput = {
  trends: AlphaTrend[];
  trendConfirmations: TrendConfirmation[];
  googleTrends?: GoogleTrendThemeResult[];
};

export type TodayAlpha = {
  themeName: string;
  displayName: string;
  convictionScore: number;
  convictionStrength: "Strong" | "Medium" | "Weak";
  drivingKeywords: string[];
  beneficiaryIndustries: string[];
  beneficiaryStocks: string[];
};

export type AlphaRankingEntry = {
  rank: number;
  themeName: string;
  displayName: string;
  convictionScore: number;
};

export type RiskWarnings = {
  valuationRisk: string | null;
  policyRisk: string | null;
  executionRisk: string | null;
};

export type DailyAlphaReport = {
  todayAlpha: TodayAlpha | null;
  alphaRanking: AlphaRankingEntry[];
  riskWarnings: RiskWarnings;
  chjView: string;
};

type RiskCategory = "valuation" | "policy" | "execution";

function categorizeRisk(risk: string): RiskCategory | null {
  const lower = risk.toLowerCase();
  if (/valuation|margin|hype|commodity|concentration/.test(lower)) {
    return "valuation";
  }
  if (/policy|regulatory/.test(lower)) {
    return "policy";
  }
  if (
    /delay|adoption|financing|supply|chain|capex|project|commercial|slow|execution|bottleneck/.test(
      lower,
    )
  ) {
    return "execution";
  }
  return null;
}

function findTrend(
  trends: AlphaTrend[],
  themeName: string,
): AlphaTrend | undefined {
  return trends.find((trend) => trend.name === themeName);
}

function getDrivingKeywords(
  themeName: string,
  googleTrends: GoogleTrendThemeResult[] | undefined,
): string[] {
  const googleTheme = googleTrends?.find((item) => item.themeName === themeName);
  if (googleTheme && googleTheme.keywords.length > 0) {
    return googleTheme.keywords.map((item) => item.keyword);
  }
  return [];
}

function buildTodayAlpha(
  confirmation: TrendConfirmation,
  trend: AlphaTrend | undefined,
  googleTrends: GoogleTrendThemeResult[] | undefined,
): TodayAlpha {
  return {
    themeName: confirmation.themeName,
    displayName: confirmation.displayName,
    convictionScore: confirmation.convictionScore,
    convictionStrength: confirmation.convictionStrength,
    drivingKeywords: getDrivingKeywords(confirmation.themeName, googleTrends),
    beneficiaryIndustries: trend?.beneficiaryIndustries ?? [],
    beneficiaryStocks:
      trend?.potentialCompanies.map((company) => company.ticker) ?? [],
  };
}

function buildAlphaRanking(
  confirmations: TrendConfirmation[],
): AlphaRankingEntry[] {
  return [...confirmations]
    .sort((a, b) => b.convictionScore - a.convictionScore)
    .map((item, index) => ({
      rank: index + 1,
      themeName: item.themeName,
      displayName: item.displayName,
      convictionScore: item.convictionScore,
    }));
}

function buildRiskWarnings(trends: AlphaTrend[]): RiskWarnings {
  const warnings: RiskWarnings = {
    valuationRisk: null,
    policyRisk: null,
    executionRisk: null,
  };

  for (const trend of trends) {
    for (const risk of trend.risks) {
      const category = categorizeRisk(risk);
      if (category === "valuation" && !warnings.valuationRisk) {
        warnings.valuationRisk = risk;
      }
      if (category === "policy" && !warnings.policyRisk) {
        warnings.policyRisk = risk;
      }
      if (category === "execution" && !warnings.executionRisk) {
        warnings.executionRisk = risk;
      }
    }
  }

  return warnings;
}

function describeNewsFlow(growthRate: number): string {
  if (growthRate > 0) return "News Flow is positive";
  if (growthRate < 0) return "News Flow is negative";
  return "News Flow is flat";
}

function describeGoogleTrends(
  confirmation: TrendConfirmation,
): string | null {
  const google = confirmation.googleTrendsSignal;
  if (!google.available) return null;
  if (google.growthRate > 0) return "Google Trends momentum is positive";
  if (google.growthRate < 0) return "Google Trends momentum is negative";
  return "Google Trends momentum is flat";
}

function buildChjView(
  todayAlpha: TodayAlpha | null,
  confirmation: TrendConfirmation | undefined,
): string {
  if (!todayAlpha || !confirmation) {
    return "Insufficient Alpha data to generate today's view.";
  }

  const newsText = describeNewsFlow(confirmation.newsSignal.growthRate);
  const googleText = describeGoogleTrends(confirmation);

  let signalSentence: string;
  if (googleText && newsText.includes("positive") && googleText.includes("positive")) {
    signalSentence = "Google Trends and News Flow are both positive.";
  } else if (googleText) {
    signalSentence = `${newsText}; ${googleText}.`;
  } else {
    signalSentence = `${newsText}; Google Trends data is unavailable.`;
  }

  const leadership =
    todayAlpha.beneficiaryStocks.length > 0
      ? todayAlpha.beneficiaryStocks.slice(0, 3).join(" / ")
      : "no mapped leadership stocks";

  return (
    `Today's strongest theme is ${todayAlpha.themeName}. ` +
    `${signalSentence} ` +
    `Current leadership remains ${leadership}.`
  );
}

export function buildDailyAlphaReport(
  input: DailyAlphaReportInput,
): DailyAlphaReport {
  const confirmations = input.trendConfirmations;
  const alphaRanking = buildAlphaRanking(confirmations);
  const topConfirmation = alphaRanking[0]
    ? confirmations.find((item) => item.themeName === alphaRanking[0].themeName)
    : undefined;

  const todayAlpha = topConfirmation
    ? buildTodayAlpha(
        topConfirmation,
        findTrend(input.trends, topConfirmation.themeName),
        input.googleTrends,
      )
    : null;

  const riskWarnings = buildRiskWarnings(input.trends);
  const chjView = buildChjView(todayAlpha, topConfirmation);

  return {
    todayAlpha,
    alphaRanking,
    riskWarnings,
    chjView,
  };
}
