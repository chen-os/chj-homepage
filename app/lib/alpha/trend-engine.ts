import type { GoogleTrendThemeResult } from "./google-trends";

export type TrendSourceInput = {
  keyword: string;
  title: string;
  source: string;
  publishedAt: string;
  link: string;
};

export type TrendEvidence = {
  title: string;
  source: string;
  publishedAt: string;
  link: string;
};

export type TrendCompany = {
  ticker: string;
  name: string;
  reason: string;
};

export type AlphaTrend = {
  id: string;
  name: string;
  alphaScore: number;
  signalStrength: "High" | "Medium" | "Low";
  summary: string;
  evidence: TrendEvidence[];
  beneficiaryIndustries: string[];
  potentialCompanies: TrendCompany[];
  risks: string[];
};

type TrendRule = {
  id: string;
  name: string;
  triggers: string[];
  beneficiaryIndustries: string[];
  potentialCompanies: TrendCompany[];
  risks: string[];
};

const PREMIUM_SOURCES = [
  /reuters/i,
  /bloomberg/i,
  /wsj/i,
  /wall street journal/i,
  /cnbc/i,
  /financial times/i,
];

const TREND_RULES: TrendRule[] = [
  {
    id: "ai-data-center-power",
    name: "AI Data Center Power Demand",
    triggers: [
      "data center",
      "power",
      "electricity",
      "grid",
      "energy demand",
      "ai infrastructure",
    ],
    beneficiaryIndustries: [
      "Nuclear power",
      "Natural gas",
      "Grid equipment",
      "Fuel cells",
      "Data center infrastructure",
    ],
    potentialCompanies: [
      {
        ticker: "LEU",
        name: "Centrus Energy",
        reason: "Nuclear fuel exposure",
      },
      {
        ticker: "CEG",
        name: "Constellation Energy",
        reason: "Nuclear power generation",
      },
      {
        ticker: "VST",
        name: "Vistra",
        reason: "Power generation and grid demand",
      },
      {
        ticker: "ETN",
        name: "Eaton",
        reason: "Electrical equipment",
      },
      {
        ticker: "BE",
        name: "Bloom Energy",
        reason: "Fuel cells for data centers",
      },
    ],
    risks: [
      "Valuation already expanded",
      "Policy uncertainty",
      "Power project delays",
    ],
  },
  {
    id: "nuclear-fuel-cycle",
    name: "Nuclear Fuel Cycle",
    triggers: ["nuclear", "uranium", "reactor", "smr", "haleu"],
    beneficiaryIndustries: [
      "Uranium mining",
      "Nuclear fuel",
      "SMR technology",
      "Nuclear utilities",
    ],
    potentialCompanies: [
      {
        ticker: "LEU",
        name: "Centrus Energy",
        reason: "HALEU and nuclear fuel",
      },
      {
        ticker: "CCJ",
        name: "Cameco",
        reason: "Uranium mining",
      },
      {
        ticker: "SMR",
        name: "NuScale Power",
        reason: "Small modular reactor exposure",
      },
      {
        ticker: "CEG",
        name: "Constellation Energy",
        reason: "Nuclear fleet",
      },
    ],
    risks: [
      "Long regulatory timeline",
      "Project financing risk",
      "Commodity volatility",
    ],
  },
  {
    id: "humanoid-robotics",
    name: "Humanoid Robotics Supply Chain",
    triggers: [
      "humanoid",
      "robot",
      "robotics",
      "actuator",
      "sensor",
      "embodied ai",
    ],
    beneficiaryIndustries: [
      "Actuators",
      "Sensors",
      "Machine vision",
      "Industrial automation",
      "Edge AI chips",
    ],
    potentialCompanies: [
      {
        ticker: "TSLA",
        name: "Tesla",
        reason: "Humanoid robot platform",
      },
      {
        ticker: "ISRG",
        name: "Intuitive Surgical",
        reason: "Robotics precision systems",
      },
      {
        ticker: "NVDA",
        name: "Nvidia",
        reason: "Robotics AI compute",
      },
      {
        ticker: "TER",
        name: "Teradyne",
        reason: "Industrial automation and testing",
      },
      {
        ticker: "FANUY",
        name: "Fanuc",
        reason: "Industrial robotics",
      },
    ],
    risks: [
      "Commercial adoption may be slower than expected",
      "Hardware margins uncertain",
      "Hype cycle risk",
    ],
  },
  {
    id: "ai-compute-infrastructure",
    name: "AI Compute Infrastructure",
    triggers: ["gpu", "inference", "compute", "cloud", "cluster", "accelerator"],
    beneficiaryIndustries: [
      "GPUs",
      "AI cloud",
      "Networking",
      "Memory",
      "Data center cooling",
    ],
    potentialCompanies: [
      {
        ticker: "NVDA",
        name: "Nvidia",
        reason: "GPU and inference compute",
      },
      {
        ticker: "AMD",
        name: "AMD",
        reason: "AI accelerators",
      },
      {
        ticker: "AVGO",
        name: "Broadcom",
        reason: "Networking and custom silicon",
      },
      {
        ticker: "ANET",
        name: "Arista Networks",
        reason: "AI data center networking",
      },
      {
        ticker: "MU",
        name: "Micron",
        reason: "AI memory demand",
      },
    ],
    risks: [
      "Capex cycle slowdown",
      "Supply chain bottlenecks",
      "Customer concentration",
    ],
  },
];

function matchesTrigger(text: string, triggers: string[]): boolean {
  const lower = text.toLowerCase();
  return triggers.some((trigger) => lower.includes(trigger.toLowerCase()));
}

function isPremiumSource(source: string): boolean {
  return PREMIUM_SOURCES.some((pattern) => pattern.test(source));
}

export function countPremiumEvidence(evidence: TrendEvidence[]): number {
  return evidence.filter((item) => isPremiumSource(item.source)).length;
}

export type GoogleTrendsScoreInput = {
  trendScore: number;
  growthRate: number;
};

function getGoogleTrendsInput(
  themeName: string,
  googleThemes?: GoogleTrendThemeResult[],
): GoogleTrendsScoreInput | undefined {
  const theme = googleThemes?.find((item) => item.themeName === themeName);
  if (!theme) return undefined;
  return {
    trendScore: theme.trendScore,
    growthRate: theme.growthRate,
  };
}

function calculateAlphaScore(
  evidence: TrendEvidence[],
  google?: GoogleTrendsScoreInput,
): number {
  const evidenceCount = Math.min(evidence.length, 15);
  const premiumCount = Math.min(
    evidence.filter((item) => isPremiumSource(item.source)).length,
    5,
  );

  const evidenceScore = (evidenceCount / 15) * 40;
  const premiumScore = (premiumCount / 5) * 30;
  const googleTrendScore = ((google?.trendScore ?? 0) / 100) * 20;
  const growthRate = google?.growthRate ?? 0;
  const growthScore = Math.min(10, Math.max(0, 5 + growthRate * 0.25));

  const total = evidenceScore + premiumScore + googleTrendScore + growthScore;
  return Math.round(Math.min(100, Math.max(0, total)));
}

function resolveSignalStrength(
  alphaScore: number,
): AlphaTrend["signalStrength"] {
  if (alphaScore >= 80) return "High";
  if (alphaScore >= 50) return "Medium";
  return "Low";
}

function buildSummary(rule: TrendRule, evidence: TrendEvidence[]): string {
  const premiumCount = evidence.filter((item) => isPremiumSource(item.source)).length;
  const leadSource = evidence[0]?.source ?? "multiple outlets";

  if (evidence.length === 0) {
    return `${rule.name} has no qualifying headlines in the current scan.`;
  }

  return (
    `${rule.name} is supported by ${evidence.length} headline${evidence.length === 1 ? "" : "s"}` +
    `${premiumCount > 0 ? `, including ${premiumCount} premium-source signal${premiumCount === 1 ? "" : "s"}` : ""}.` +
    ` Latest flow from ${leadSource} reinforces near-term investor attention across ${rule.beneficiaryIndustries.slice(0, 2).join(" and ")}.`
  );
}

function collectEvidence(
  sources: TrendSourceInput[],
  rule: TrendRule,
): TrendEvidence[] {
  return sources
    .filter((source) =>
      matchesTrigger(`${source.keyword} ${source.title}`, rule.triggers),
    )
    .map((source) => ({
      title: source.title,
      source: source.source,
      publishedAt: source.publishedAt,
      link: source.link,
    }));
}

export function getThemeStockWatchlists(): Array<{
  theme: string;
  stocks: Array<{ ticker: string; name: string }>;
}> {
  return TREND_RULES.map((rule) => ({
    theme: rule.name,
    stocks: rule.potentialCompanies.map((company) => ({
      ticker: company.ticker,
      name: company.name,
    })),
  }));
}

export function buildTrends(
  sources: TrendSourceInput[],
  googleThemes?: GoogleTrendThemeResult[],
): AlphaTrend[] {
  const trends = TREND_RULES.map((rule) => {
    const evidence = collectEvidence(sources, rule);
    const googleInput = getGoogleTrendsInput(rule.name, googleThemes);
    const alphaScore = calculateAlphaScore(evidence, googleInput);
    const signalStrength = resolveSignalStrength(alphaScore);

    return {
      id: rule.id,
      name: rule.name,
      alphaScore,
      signalStrength,
      summary: buildSummary(rule, evidence),
      evidence,
      beneficiaryIndustries: rule.beneficiaryIndustries,
      potentialCompanies: rule.potentialCompanies,
      risks: rule.risks,
    };
  })
    .filter((trend) => trend.evidence.length > 0)
    .sort((a, b) => b.alphaScore - a.alphaScore);

  return trends;
}
