export type AlphaSignal = {
  id: string;
  title: string;
  summary: string;
  sentiment: "bullish" | "neutral" | "watch";
};

export type TrendingTheme = {
  id: string;
  name: string;
  momentum: string;
  note: string;
};

export type BeneficiaryIndustry = {
  id: string;
  industry: string;
  rationale: string;
};

export type PublicCompanyCandidate = {
  id: string;
  ticker: string;
  name: string;
  theme: string;
};

export type WatchlistItem = {
  id: string;
  symbol: string;
  name: string;
  status: string;
};

export type RiskNote = {
  id: string;
  text: string;
};

export type AlphaDashboardData = {
  updatedAt: string;
  signals: AlphaSignal[];
  themes: TrendingTheme[];
  industries: BeneficiaryIndustry[];
  companies: PublicCompanyCandidate[];
  watchlist: WatchlistItem[];
  risks: RiskNote[];
};

export const mockAlphaDashboardData: AlphaDashboardData = {
  updatedAt: "2026-05-31",
  signals: [
    {
      id: "signal-1",
      title: "Data center power capex accelerating",
      summary: "Hyperscaler guidance points to sustained grid and backup power demand through 2027.",
      sentiment: "bullish",
    },
    {
      id: "signal-2",
      title: "SMR policy momentum in G7 markets",
      summary: "Regulatory timelines improving for small modular reactor pilots in North America and Japan.",
      sentiment: "watch",
    },
    {
      id: "signal-3",
      title: "Humanoid actuator lead times extending",
      summary: "Tier-2 precision motor suppliers reporting 20+ week backlogs on new robotics SKUs.",
      sentiment: "neutral",
    },
  ],
  themes: [
    {
      id: "theme-ai-power",
      name: "AI Infrastructure Power Demand",
      momentum: "High",
      note: "Grid equipment, gas turbines, and UPS vendors seeing order book expansion.",
    },
    {
      id: "theme-nuclear",
      name: "Nuclear Fuel Cycle",
      momentum: "Rising",
      note: "Enrichment capacity and long-term uranium contracting back in focus.",
    },
    {
      id: "theme-robotics",
      name: "Humanoid Robotics Supply Chain",
      momentum: "Emerging",
      note: "Actuators, harmonic drives, and vision modules moving up the priority list.",
    },
  ],
  industries: [
    {
      id: "ind-1",
      industry: "Electric Utilities & Grid Equipment",
      rationale: "Direct beneficiary of AI data center load growth and transmission upgrades.",
    },
    {
      id: "ind-2",
      industry: "Uranium Mining & Conversion",
      rationale: "Nuclear restarts and SMR pipelines support multi-year fuel demand.",
    },
    {
      id: "ind-3",
      industry: "Precision Motion & Sensors",
      rationale: "Humanoid platforms require high-torque, low-weight actuator ecosystems.",
    },
  ],
  companies: [
    {
      id: "co-1",
      ticker: "GEV",
      name: "GE Vernova",
      theme: "AI Infrastructure Power Demand",
    },
    {
      id: "co-2",
      ticker: "CCJ",
      name: "Cameco",
      theme: "Nuclear Fuel Cycle",
    },
    {
      id: "co-3",
      ticker: "6506.T",
      name: "Yaskawa Electric",
      theme: "Humanoid Robotics Supply Chain",
    },
  ],
  watchlist: [
    { id: "wl-1", symbol: "VRT", name: "Vertiv", status: "Pullback watch" },
    { id: "wl-2", symbol: "UEC", name: "Uranium Energy", status: "Theme confirm" },
    { id: "wl-3", symbol: "6854.T", name: "Nidec", status: "Supply chain monitor" },
  ],
  risks: [
    {
      id: "risk-1",
      text: "AI capex cycle may decelerate if hyperscaler ROI scrutiny intensifies in H2.",
    },
    {
      id: "risk-2",
      text: "Nuclear project timelines remain politically and regulatorily sensitive.",
    },
    {
      id: "risk-3",
      text: "Humanoid robotics adoption is early-stage; revenue translation may lag narrative.",
    },
  ],
};
