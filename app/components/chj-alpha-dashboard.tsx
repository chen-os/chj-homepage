"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  formatBreakdownPoints,
  formatGoogleTrendsBreakdown,
  resolveTrendConfirmations,
  type TrendConfirmation,
} from "../lib/alpha/conviction-engine";
import {
  ALPHA_NA_LABEL,
  formatBacktestPercent,
} from "../lib/alpha/format-labels";
import { buildDailyAlphaReport } from "../lib/alpha/daily-alpha-report";
import type { GoogleTrendThemeResult } from "../lib/alpha/google-trends";
import {
  mockAlphaDashboardData,
  type AlphaDashboardData,
} from "../data/chj-alpha-dashboard";

type DailyReportSource = {
  keyword: string;
  title: string;
  source: string;
  publishedAt: string;
  link: string;
};

type TrendCompany = {
  ticker: string;
  name: string;
  reason: string;
};

type AlphaTrend = {
  id: string;
  name: string;
  alphaScore: number;
  signalStrength: "High" | "Medium" | "Low";
  summary: string;
  evidence: Array<{
    title: string;
    source: string;
    publishedAt: string;
    link: string;
  }>;
  beneficiaryIndustries: string[];
  potentialCompanies: TrendCompany[];
  risks: string[];
};

type EmergingTheme = {
  name: string;
  displayName: string;
  currentCount: number;
  sevenDayAverage: number;
  growthRate: number;
  growthLabel: string;
};

type TrendConfirmationItem = TrendConfirmation;

type ThemeMomentumItem = {
  themeName: string;
  displayName: string;
  convictionScore: number;
  convictionChange7Day: number;
  convictionChangeLabel: string;
  trendAgeDays: number;
};

type TrendLeaderboardItem = {
  rank: number;
  themeName: string;
  displayName: string;
  convictionIncrease7Day: number;
  increaseLabel: string;
};

type ThemeDivergenceItem = {
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
  lifecycleStage:
    | "Accelerating"
    | "Emerging"
    | "Peak"
    | "Cooling"
    | "Decelerating"
    | "Failed Breakout"
    | "Dormant";
  alphaOpportunityScore: number;
  divergenceStatus:
    | "UNDEROWNED"
    | "CONFIRMED"
    | "OVEREXTENDED"
    | "WEAK"
    | "NEUTRAL";
  actionHint: string;
};

type AlphaOpportunityItem = {
  themeName: string;
  displayName: string;
  alphaOpportunityScore: number;
  divergenceStatus:
    | "UNDEROWNED"
    | "CONFIRMED"
    | "OVEREXTENDED"
    | "WEAK"
    | "NEUTRAL";
  themeRank: number;
  stockRank5D: number;
  lifecycleStage:
    | "Accelerating"
    | "Emerging"
    | "Peak"
    | "Cooling"
    | "Decelerating"
    | "Failed Breakout"
    | "Dormant";
  actionHint: string;
};

type TrendLifecycleItem = {
  themeName: string;
  displayName: string;
  alphaScore: number;
  convictionScore: number;
  convictionChange7Day: number;
  convictionChangeLabel: string;
  trendAgeDays: number;
  lifecycleStage:
    | "Accelerating"
    | "Emerging"
    | "Peak"
    | "Cooling"
    | "Decelerating"
    | "Failed Breakout"
    | "Dormant";
  lifecycleReason: string;
  actionHint: string;
};

type ThemeWinnerItem = {
  themeName: string;
  displayName: string;
  avgReturn7D: number | null;
  avgReturn7DLabel: string;
  topPerformer: {
    ticker: string;
    change7D: number;
  } | null;
  worstPerformer: {
    ticker: string;
    change7D: number;
  } | null;
  confirmationLevel:
    | "Strong Confirmation"
    | "Divergence"
    | "Late Stage"
    | "Neutral";
  stocks: Array<{
    ticker: string;
    change7D: number | null;
    change7DLabel: string;
  }>;
};

type StockPerformanceItem = {
  ticker: string;
  change1Day: number | null;
  change7Day: number | null;
  change30Day: number | null;
  change1DayLabel: string;
  change7DayLabel: string;
  change30DayLabel: string;
};

type ThemePerformanceItem = {
  theme: string;
  stocks: StockPerformanceItem[];
  topWinner: {
    ticker: string;
    change: number;
    label: string;
    period: "7D" | "1D";
  } | null;
};

type WatchlistSnapshot = {
  date: string;
  cached: boolean;
  themePerformance: ThemePerformanceItem[];
};

type GoogleTrendTheme = GoogleTrendThemeResult;

type DailyReport = {
  date: string;
  sources?: DailyReportSource[];
  trends?: AlphaTrend[];
  emergingThemes?: EmergingTheme[];
  googleTrends?: GoogleTrendTheme[];
  trendConfirmations?: TrendConfirmationItem[];
  themeMomentum?: ThemeMomentumItem[];
  trendLeaderboard?: TrendLeaderboardItem[];
  themeWinners?: ThemeWinnerItem[];
  trendLifecycles?: TrendLifecycleItem[];
  themeDivergence?: ThemeDivergenceItem[];
  alphaOpportunities?: AlphaOpportunityItem[];
};

type FetchState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "success"; report: DailyReport };

type WatchlistFetchState =
  | { status: "idle" | "loading" }
  | { status: "error" }
  | { status: "success"; snapshot: WatchlistSnapshot };

type BacktestStockItem = {
  ticker: string;
  entryPrice: number;
  currentPrice: number;
  return1D: number | null;
  return7D: number | null;
  return30D: number | null;
};

type BacktestSignalItem = {
  date: string;
  theme: string;
  convictionScore: number;
  stocks: BacktestStockItem[];
};

type BacktestSummaryItem = {
  totalSignals: number;
  winningSignals: number;
  hitRate: number;
  averageReturn1D: number | null;
  averageReturn7D: number | null;
  averageReturn30D: number | null;
  themeScoreboard: Array<{
    theme: string;
    averageReturn: number;
    label: string;
  }>;
  snapshotDays: number;
  meaningful: boolean;
};

type BacktestResponse = {
  summary: BacktestSummaryItem;
  signals: BacktestSignalItem[];
};

type BacktestFetchState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "success"; data: BacktestResponse };

type ThemeChampionItem = {
  displayName: string;
  wins7Day: number;
  wins30Day: number;
  winsAllTime: number;
};

type LeaderTrackerData = {
  currentLeader: {
    displayName: string;
    reignDays: number;
    becameLeaderDate: string;
  } | null;
  leaderHistory: Array<{
    date: string;
    displayName: string;
  }>;
  leaderPerformance: {
    displayName: string;
    sinceDate: string;
    basketReturn: number | null;
    basketReturnLabel: string;
    meaningful: boolean;
  } | null;
};

type ThemeRotationResponse = {
  champions: ThemeChampionItem[];
  currentReign: {
    displayName: string;
    consecutiveDays: number;
  } | null;
  leadershipChange: {
    date: string;
    from: string;
    to: string;
  } | null;
  leaderTracker: LeaderTrackerData;
};

type ThemeRotationFetchState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "success"; data: ThemeRotationResponse };

type ChjAlphaDashboardProps = {
  data?: AlphaDashboardData;
};

function formatPublishedAt(value: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function ChjAlphaDashboard({
  data = mockAlphaDashboardData,
}: ChjAlphaDashboardProps) {
  const [fetchState, setFetchState] = useState<FetchState>({ status: "loading" });
  const [watchlistState, setWatchlistState] = useState<WatchlistFetchState>({
    status: "loading",
  });
  const [backtestState, setBacktestState] = useState<BacktestFetchState>({
    status: "loading",
  });
  const [rotationState, setRotationState] = useState<ThemeRotationFetchState>({
    status: "loading",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadReport() {
      try {
        const response = await fetch("/api/alpha/daily-report");
        if (!response.ok) throw new Error("Request failed");
        const report = (await response.json()) as DailyReport;
        if (!cancelled) {
          setFetchState({ status: "success", report });
        }
      } catch {
        if (!cancelled) {
          setFetchState({ status: "error" });
        }
      }
    }

    async function loadWatchlistSnapshot() {
      try {
        const response = await fetch("/api/alpha/watchlist-snapshot");
        if (!response.ok) throw new Error("Request failed");
        const snapshot = (await response.json()) as WatchlistSnapshot;
        if (!cancelled) {
          setWatchlistState({ status: "success", snapshot });
        }
      } catch {
        if (!cancelled) {
          setWatchlistState({ status: "error" });
        }
      }
    }

    async function loadBacktest() {
      try {
        const response = await fetch("/api/alpha/backtest");
        if (!response.ok) throw new Error("Request failed");
        const data = (await response.json()) as BacktestResponse;
        if (!cancelled) {
          setBacktestState({ status: "success", data });
        }
      } catch {
        if (!cancelled) {
          setBacktestState({ status: "error" });
        }
      }
    }

    async function loadThemeRotation() {
      try {
        const response = await fetch("/api/alpha/theme-rotation");
        if (!response.ok) throw new Error("Request failed");
        const data = (await response.json()) as ThemeRotationResponse;
        if (!cancelled) {
          setRotationState({ status: "success", data });
        }
      } catch {
        if (!cancelled) {
          setRotationState({ status: "error" });
        }
      }
    }

    void loadReport();
    void loadWatchlistSnapshot();
    void loadBacktest();
    void loadThemeRotation();

    return () => {
      cancelled = true;
    };
  }, []);

  const report = fetchState.status === "success" ? fetchState.report : undefined;
  const emergingThemes = report?.emergingThemes ?? [];
  const trends = report?.trends ?? [];
  const sources = report?.sources ?? [];
  const trendConfirmations = useMemo(
    () => (report ? resolveTrendConfirmations(report) : []),
    [report],
  );
  const dailyAlphaReport = useMemo(
    () =>
      report
        ? buildDailyAlphaReport({
            trends: report.trends ?? [],
            trendConfirmations,
            googleTrends: report.googleTrends,
          })
        : null,
    [report, trendConfirmations],
  );
  const themeMomentum = report?.themeMomentum ?? [];
  const trendLeaderboard = report?.trendLeaderboard ?? [];
  const themeWinners = report?.themeWinners ?? [];
  const trendLifecycles = report?.trendLifecycles ?? [];
  const themeDivergence = report?.themeDivergence ?? [];
  const alphaOpportunities = report?.alphaOpportunities ?? [];
  const themePerformance =
    watchlistState.status === "success"
      ? watchlistState.snapshot.themePerformance
      : [];
  const backtestSummary =
    backtestState.status === "success" ? backtestState.data.summary : undefined;
  const backtestSignals =
    backtestState.status === "success" ? backtestState.data.signals : [];
  const recentSignals = [...backtestSignals]
    .sort((a, b) => b.date.localeCompare(a.date) || a.theme.localeCompare(b.theme))
    .slice(0, 10);

  function hasCompletedHorizonReturn(stock: BacktestStockItem): boolean {
    return (
      stock.return1D !== null ||
      stock.return7D !== null ||
      stock.return30D !== null
    );
  }

  function getHorizonReturn(stock: BacktestStockItem): number | null {
    return stock.return7D ?? stock.return1D ?? stock.return30D;
  }

  function formatBacktestReturn(value: number | null): string {
    return formatBacktestPercent(value);
  }

  const themeScoreboardDisplay = useMemo(() => {
    const themeReturns = new Map<string, number[]>();

    for (const signal of backtestSignals) {
      for (const stock of signal.stocks) {
        const value = getHorizonReturn(stock);
        if (value === null) continue;
        const existing = themeReturns.get(signal.theme) ?? [];
        existing.push(value);
        themeReturns.set(signal.theme, existing);
      }
    }

    return [...new Set(backtestSignals.map((signal) => signal.theme))]
      .map((theme) => {
        const values = themeReturns.get(theme) ?? [];
        if (values.length === 0) {
          return { theme, label: ALPHA_NA_LABEL, averageReturn: null as number | null };
        }
        const averageReturn =
          values.reduce((sum, value) => sum + value, 0) / values.length;
        return {
          theme,
          label: formatBacktestReturn(averageReturn),
          averageReturn,
        };
      })
      .sort((a, b) => {
        if (a.averageReturn === null && b.averageReturn === null) {
          return a.theme.localeCompare(b.theme);
        }
        if (a.averageReturn === null) return 1;
        if (b.averageReturn === null) return -1;
        return b.averageReturn - a.averageReturn;
      });
  }, [backtestSignals]);

  const hitRateDisplay = useMemo(() => {
    const signalsWithCompletedReturns = backtestSignals.filter((signal) =>
      signal.stocks.some(hasCompletedHorizonReturn),
    );

    if (signalsWithCompletedReturns.length === 0) return ALPHA_NA_LABEL;

    const winningSignals = signalsWithCompletedReturns.filter((signal) => {
      const returns = signal.stocks
        .map(getHorizonReturn)
        .filter((value): value is number => value !== null);
      if (returns.length === 0) return false;
      const average =
        returns.reduce((sum, value) => sum + value, 0) / returns.length;
      return average > 0;
    }).length;

    return `${((winningSignals / signalsWithCompletedReturns.length) * 100).toFixed(1)}%`;
  }, [backtestSignals]);

  function getTopStockForSignal(signal: BacktestSignalItem): {
    pending: boolean;
    ticker?: string;
    label: string;
  } | null {
    if (signal.stocks.length === 0) return null;

    const completedStocks = signal.stocks.filter(hasCompletedHorizonReturn);
    if (completedStocks.length === 0) {
      return { pending: true, label: "Pending" };
    }

    const ranked = [...completedStocks].sort((a, b) => {
      const aValue = getHorizonReturn(a) ?? -Infinity;
      const bValue = getHorizonReturn(b) ?? -Infinity;
      return bValue - aValue;
    });

    const top = ranked[0];
    return {
      pending: false,
      ticker: top.ticker,
      label: formatBacktestReturn(getHorizonReturn(top)),
    };
  }

  const updatedLabel = report?.date ?? data.updatedAt;

  return (
    <main className="mx-auto min-h-[100dvh] max-w-md bg-white px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))] sm:max-w-lg">
      <header className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium tracking-[0.24em] text-neutral-400">
              ALPHA.CHJ.JP
            </p>
            <h1 className="mt-2 text-3xl font-light tracking-tight text-neutral-900">
              CHJ Alpha Dashboard
            </h1>
            <p className="mt-2 text-[11px] text-neutral-400">
              Updated {updatedLabel}
            </p>
          </div>
          <Link
            href="/"
            className="shrink-0 rounded-full border border-neutral-200 px-3 py-1.5 text-[10px] tracking-wide text-neutral-500"
          >
            Home
          </Link>
        </div>
      </header>

      <Section title="Today's Alpha">
        {fetchState.status === "loading" ? (
          <p className="text-[12px] text-neutral-500">Loading Alpha Signals...</p>
        ) : fetchState.status === "error" ? (
          <p className="text-[12px] text-neutral-500">Failed to load alpha report</p>
        ) : !dailyAlphaReport?.todayAlpha ? (
          <p className="text-[12px] text-neutral-500">No conviction signal available today.</p>
        ) : (
          <div className="rounded-2xl border border-neutral-200 px-4 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-medium text-neutral-900">
                    {dailyAlphaReport.todayAlpha.displayName}
                  </p>
                  <StatusPill label={dailyAlphaReport.todayAlpha.convictionStrength} />
                </div>
                <p className="mt-1 text-[10px] text-neutral-400">
                  {dailyAlphaReport.todayAlpha.themeName}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-2xl font-light text-neutral-900">
                  {dailyAlphaReport.todayAlpha.convictionScore}
                </p>
                <p className="text-[10px] text-neutral-400">Conviction</p>
              </div>
            </div>
            {dailyAlphaReport.todayAlpha.drivingKeywords.length > 0 ? (
              <SubBlock title="Driving Keywords">
                <TagList items={dailyAlphaReport.todayAlpha.drivingKeywords} />
              </SubBlock>
            ) : null}
            {dailyAlphaReport.todayAlpha.beneficiaryIndustries.length > 0 ? (
              <SubBlock title="Beneficiary Industries">
                <TagList items={dailyAlphaReport.todayAlpha.beneficiaryIndustries} />
              </SubBlock>
            ) : null}
            {dailyAlphaReport.todayAlpha.beneficiaryStocks.length > 0 ? (
              <SubBlock title="Beneficiary Stocks">
                <p className="font-mono text-[12px] text-neutral-800">
                  {dailyAlphaReport.todayAlpha.beneficiaryStocks.join(" · ")}
                </p>
              </SubBlock>
            ) : null}
          </div>
        )}
      </Section>

      <Section title="Alpha Ranking">
        {fetchState.status === "loading" ? (
          <p className="text-[12px] text-neutral-500">Loading Alpha Signals...</p>
        ) : fetchState.status === "error" ? (
          <p className="text-[12px] text-neutral-500">Failed to load alpha report</p>
        ) : !dailyAlphaReport || dailyAlphaReport.alphaRanking.length === 0 ? (
          <p className="text-[12px] text-neutral-500">No ranking available.</p>
        ) : (
          <ol className="space-y-2">
            {dailyAlphaReport.alphaRanking.map((item) => (
              <li
                key={item.themeName}
                className="flex items-center justify-between gap-4 rounded-xl border border-neutral-100 px-3 py-3"
              >
                <p className="text-[12px] font-medium text-neutral-900">
                  #{item.rank} {item.displayName}
                </p>
                <p className="font-mono text-[13px] text-neutral-900">
                  {item.convictionScore}
                </p>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section title="Risk Warning">
        {fetchState.status === "loading" ? (
          <p className="text-[12px] text-neutral-500">Loading Alpha Signals...</p>
        ) : fetchState.status === "error" ? (
          <p className="text-[12px] text-neutral-500">Failed to load alpha report</p>
        ) : !dailyAlphaReport ? (
          <p className="text-[12px] text-neutral-500">No risk data available.</p>
        ) : (
          <ul className="space-y-2">
            <li className="rounded-xl border border-neutral-100 px-3 py-3">
              <p className="text-[10px] tracking-wide text-neutral-400">Valuation Risk</p>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-700">
                {dailyAlphaReport.riskWarnings.valuationRisk ?? ALPHA_NA_LABEL}
              </p>
            </li>
            <li className="rounded-xl border border-neutral-100 px-3 py-3">
              <p className="text-[10px] tracking-wide text-neutral-400">Policy Risk</p>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-700">
                {dailyAlphaReport.riskWarnings.policyRisk ?? ALPHA_NA_LABEL}
              </p>
            </li>
            <li className="rounded-xl border border-neutral-100 px-3 py-3">
              <p className="text-[10px] tracking-wide text-neutral-400">Execution Risk</p>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-700">
                {dailyAlphaReport.riskWarnings.executionRisk ?? ALPHA_NA_LABEL}
              </p>
            </li>
          </ul>
        )}
      </Section>

      <Section title="CHJ View">
        {fetchState.status === "loading" ? (
          <p className="text-[12px] text-neutral-500">Loading Alpha Signals...</p>
        ) : fetchState.status === "error" ? (
          <p className="text-[12px] text-neutral-500">Failed to load alpha report</p>
        ) : (
          <p className="text-[12px] leading-relaxed text-neutral-700">
            {dailyAlphaReport?.chjView ??
              "Insufficient Alpha data to generate today's view."}
          </p>
        )}
      </Section>

      <Section title="Theme Champions">
        {rotationState.status === "loading" ? (
          <p className="text-[12px] text-neutral-500">Loading theme rotation...</p>
        ) : rotationState.status === "error" ? (
          <p className="text-[12px] text-neutral-500">Failed to load theme rotation</p>
        ) : rotationState.data.champions.length === 0 ? (
          <p className="text-[12px] text-neutral-500">
            Champion history will appear after daily rotation snapshots accumulate.
          </p>
        ) : (
          <ul className="space-y-2">
            {rotationState.data.champions.map((item) => (
              <li
                key={item.displayName}
                className="flex items-start justify-between gap-4 rounded-xl border border-neutral-100 px-3 py-3"
              >
                <div>
                  <p className="text-[12px] font-medium text-neutral-900">
                    {item.displayName}
                  </p>
                  <p className="mt-1 text-[10px] text-neutral-400">
                    7D {item.wins7Day} · 30D {item.wins30Day}
                  </p>
                </div>
                <p className="font-mono text-[13px] text-neutral-900">
                  {item.winsAllTime}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Current Reign">
        {rotationState.status === "loading" ? (
          <p className="text-[12px] text-neutral-500">Loading theme rotation...</p>
        ) : rotationState.status === "error" ? (
          <p className="text-[12px] text-neutral-500">Failed to load theme rotation</p>
        ) : !rotationState.data.currentReign ? (
          <p className="text-[12px] text-neutral-500">No reign data yet.</p>
        ) : (
          <div className="rounded-xl border border-neutral-100 px-3 py-3">
            <p className="text-[14px] font-medium text-neutral-900">
              {rotationState.data.currentReign.displayName}
            </p>
            <p className="mt-2 text-[11px] text-neutral-500">
              连续统治{" "}
              {rotationState.data.currentReign.consecutiveDays === 1
                ? "1 Day"
                : `${rotationState.data.currentReign.consecutiveDays} Days`}
            </p>
          </div>
        )}
      </Section>

      <Section title="Leadership Change">
        {rotationState.status === "loading" ? (
          <p className="text-[12px] text-neutral-500">Loading theme rotation...</p>
        ) : rotationState.status === "error" ? (
          <p className="text-[12px] text-neutral-500">Failed to load theme rotation</p>
        ) : !rotationState.data.leadershipChange ? (
          <p className="text-[12px] text-neutral-500">
            Leadership change will appear after multiple rotation days are recorded.
          </p>
        ) : (
          <div className="rounded-xl border border-neutral-100 px-3 py-3">
            <p className="text-[10px] text-neutral-400">Last Change</p>
            <p className="mt-1 text-[12px] font-medium text-neutral-900">
              {rotationState.data.leadershipChange.date}
            </p>
            <p className="mt-2 font-mono text-[12px] text-neutral-800">
              {rotationState.data.leadershipChange.from}
              {" -> "}
              {rotationState.data.leadershipChange.to}
            </p>
          </div>
        )}
      </Section>

      <Section title="Leader Tracker">
        {rotationState.status === "loading" ? (
          <p className="text-[12px] text-neutral-500">Loading leader tracker...</p>
        ) : rotationState.status === "error" ? (
          <p className="text-[12px] text-neutral-500">Failed to load leader tracker</p>
        ) : !rotationState.data.leaderTracker?.currentLeader ? (
          <p className="text-[12px] text-neutral-500">
            Leader tracker will appear after daily rotation snapshots accumulate.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-neutral-100 px-3 py-3">
              <p className="text-[10px] text-neutral-400">Current Leader</p>
              <p className="mt-1 text-[14px] font-medium text-neutral-900">
                {rotationState.data.leaderTracker.currentLeader.displayName}
              </p>
              <p className="mt-2 text-[11px] text-neutral-500">
                Leader for{" "}
                {rotationState.data.leaderTracker.currentLeader.reignDays === 1
                  ? "1 Day"
                  : `${rotationState.data.leaderTracker.currentLeader.reignDays} Days`}
              </p>
              <p className="mt-1 font-mono text-[11px] text-neutral-600">
                Since {rotationState.data.leaderTracker.currentLeader.becameLeaderDate}
              </p>
            </div>

            <div className="rounded-xl border border-neutral-100 px-3 py-3">
              <p className="text-[10px] text-neutral-400">Leader History</p>
              {rotationState.data.leaderTracker.leaderHistory.length === 0 ? (
                <p className="mt-2 text-[12px] text-neutral-500">No leader history yet.</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {rotationState.data.leaderTracker.leaderHistory.map((entry) => (
                    <li
                      key={entry.date}
                      className="flex items-center justify-between gap-4 font-mono text-[11px] text-neutral-700"
                    >
                      <span>{entry.date}</span>
                      <span className="font-medium text-neutral-900">
                        {entry.displayName}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-neutral-100 px-3 py-3">
              <p className="text-[10px] text-neutral-400">Leader Performance</p>
              {!rotationState.data.leaderTracker.leaderPerformance ? (
                <p className="mt-2 text-[12px] text-neutral-500">
                  Performance will appear once watchlist prices are available.
                </p>
              ) : (
                <div className="mt-2 space-y-2">
                  <p className="text-[11px] text-neutral-500">
                    Leader Since:{" "}
                    <span className="font-mono text-neutral-800">
                      {rotationState.data.leaderTracker.leaderPerformance.sinceDate}
                    </span>
                  </p>
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[12px] text-neutral-600">Theme Basket Return</p>
                    <p className="font-mono text-[14px] font-medium text-neutral-900">
                      {rotationState.data.leaderTracker.leaderPerformance.basketReturnLabel}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Section>

      <Section title="Top Emerging Themes">
        {fetchState.status === "loading" ? (
          <p className="text-[12px] text-neutral-500">Loading Alpha Signals...</p>
        ) : fetchState.status === "error" ? (
          <p className="text-[12px] text-neutral-500">Failed to load alpha report</p>
        ) : emergingThemes.length === 0 ? (
          <p className="text-[12px] text-neutral-500">
            No emerging themes yet. Momentum will improve as history accumulates.
          </p>
        ) : (
          <ol className="space-y-3">
            {emergingThemes.map((theme, index) => (
              <li
                key={theme.name}
                className="flex items-start justify-between gap-4 rounded-xl border border-neutral-100 px-3 py-3"
              >
                <div>
                  <p className="text-[12px] font-medium text-neutral-900">
                    #{index + 1} {theme.displayName}
                  </p>
                  <p className="mt-1 text-[10px] text-neutral-400">
                    Current {theme.currentCount} · 7D Avg {theme.sevenDayAverage}
                  </p>
                </div>
                <p className="font-mono text-[13px] text-neutral-900">
                  {theme.growthLabel}
                </p>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section title="Theme Momentum">
        {fetchState.status === "loading" ? (
          <p className="text-[12px] text-neutral-500">Loading Alpha Signals...</p>
        ) : fetchState.status === "error" ? (
          <p className="text-[12px] text-neutral-500">Failed to load alpha report</p>
        ) : themeMomentum.length === 0 ? (
          <p className="text-[12px] text-neutral-500">
            Theme momentum will appear as conviction history accumulates.
          </p>
        ) : (
          <ul className="space-y-3">
            {themeMomentum.map((item) => (
              <li
                key={item.themeName}
                className="rounded-xl border border-neutral-100 px-3 py-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[12px] font-medium text-neutral-900">
                      {item.displayName}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-neutral-600">
                      {item.convictionChangeLabel}
                    </p>
                  </div>
                  <p className="font-mono text-lg font-light text-neutral-900">
                    {item.convictionScore}
                  </p>
                </div>
                <p className="mt-2 text-[10px] text-neutral-400">
                  Trend Age{" "}
                  {item.trendAgeDays === 1
                    ? "1 Day"
                    : `${item.trendAgeDays} Days`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Trend Lifecycle">
        {fetchState.status === "loading" ? (
          <p className="text-[12px] text-neutral-500">Loading Alpha Signals...</p>
        ) : fetchState.status === "error" ? (
          <p className="text-[12px] text-neutral-500">Failed to load alpha report</p>
        ) : trendLifecycles.length === 0 ? (
          <p className="text-[12px] text-neutral-500">
            Trend lifecycle stages will appear once conviction history accumulates.
          </p>
        ) : (
          <ul className="space-y-3">
            {trendLifecycles.map((item) => (
              <li
                key={item.themeName}
                className="rounded-xl border border-neutral-100 px-3 py-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[12px] font-medium text-neutral-900">
                      {item.displayName}
                    </p>
                    <div className="mt-1">
                      <StatusPill label={item.lifecycleStage} />
                    </div>
                  </div>
                  <p className="font-mono text-lg font-light text-neutral-900">
                    {item.convictionScore}
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-neutral-600">
                  <div>
                    <p className="text-[10px] text-neutral-400">7D Change</p>
                    <p className="mt-1 font-mono text-neutral-800">
                      {item.convictionChangeLabel}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral-400">Age</p>
                    <p className="mt-1 text-neutral-800">
                      {item.trendAgeDays === 1
                        ? "1 Day"
                        : `${item.trendAgeDays} Days`}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-neutral-500">{item.actionHint}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Top Alpha Opportunities">
        {fetchState.status === "loading" ? (
          <p className="text-[12px] text-neutral-500">Loading Alpha Signals...</p>
        ) : fetchState.status === "error" ? (
          <p className="text-[12px] text-neutral-500">Failed to load alpha report</p>
        ) : alphaOpportunities.length === 0 ? (
          <p className="text-[12px] text-neutral-500">
            Alpha opportunities will appear once relative divergence data is available.
          </p>
        ) : (
          <ul className="space-y-3">
            {alphaOpportunities.map((item) => (
              <li
                key={item.themeName}
                className="rounded-xl border border-neutral-100 px-3 py-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[12px] font-medium text-neutral-900">
                      {item.displayName}
                    </p>
                    <div className="mt-1">
                      <StatusPill label={item.divergenceStatus} />
                    </div>
                  </div>
                  <p className="font-mono text-lg font-light text-neutral-900">
                    {item.alphaOpportunityScore}
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-neutral-600">
                  <div>
                    <p className="text-[10px] text-neutral-400">Theme Rank</p>
                    <p className="mt-1 font-mono text-neutral-800">
                      Theme #{item.themeRank}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral-400">Stock Rank</p>
                    <p className="mt-1 font-mono text-neutral-800">
                      Stock #{item.stockRank5D}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral-400">Lifecycle</p>
                    <p className="mt-1 text-neutral-800">{item.lifecycleStage}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral-400">Action</p>
                    <p className="mt-1 text-neutral-800">{item.actionHint}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Theme Divergence">
        {fetchState.status === "loading" ? (
          <p className="text-[12px] text-neutral-500">Loading Alpha Signals...</p>
        ) : fetchState.status === "error" ? (
          <p className="text-[12px] text-neutral-500">Failed to load alpha report</p>
        ) : themeDivergence.length === 0 ? (
          <p className="text-[12px] text-neutral-500">
            Theme divergence will appear once stock return data is available.
          </p>
        ) : (
          <ul className="space-y-3">
            {themeDivergence.map((item) => (
              <li
                key={item.themeName}
                className="rounded-xl border border-neutral-100 px-3 py-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[12px] font-medium text-neutral-900">
                      {item.displayName}
                    </p>
                    <div className="mt-1">
                      <StatusPill label={item.divergenceStatus} />
                    </div>
                  </div>
                  <p className="font-mono text-lg font-light text-neutral-900">
                    {item.themeStrength}
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-neutral-600">
                  <div>
                    <p className="text-[10px] text-neutral-400">5D Basket</p>
                    <p className="mt-1 font-mono text-neutral-800">
                      {item.basketReturn5DLabel}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral-400">20D Basket</p>
                    <p className="mt-1 font-mono text-neutral-800">
                      {item.basketReturn20DLabel}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral-400">Theme Rank</p>
                    <p className="mt-1 font-mono text-neutral-800">
                      Theme #{item.themeRank}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral-400">Stock Rank</p>
                    <p className="mt-1 font-mono text-neutral-800">
                      Stock #{item.stockRank5D}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral-400">Relative Divergence</p>
                    <p className="mt-1 font-mono text-neutral-800">
                      {item.relativeDivergence}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral-400">Opportunity Score</p>
                    <p className="mt-1 font-mono text-neutral-800">
                      {item.alphaOpportunityScore}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-neutral-500">{item.actionHint}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Trend Leaderboard">
        {fetchState.status === "loading" ? (
          <p className="text-[12px] text-neutral-500">Loading Alpha Signals...</p>
        ) : fetchState.status === "error" ? (
          <p className="text-[12px] text-neutral-500">Failed to load alpha report</p>
        ) : trendLeaderboard.length === 0 ? (
          <p className="text-[12px] text-neutral-500">
            Leaderboard will rank themes once 7-day conviction history is available.
          </p>
        ) : (
          <ol className="space-y-2">
            {trendLeaderboard.map((item) => (
              <li
                key={item.themeName}
                className="flex items-center justify-between gap-4 rounded-xl border border-neutral-100 px-3 py-3"
              >
                <p className="text-[12px] font-medium text-neutral-900">
                  #{item.rank} {item.displayName}
                </p>
                <p className="font-mono text-[13px] text-neutral-900">
                  {item.increaseLabel}
                </p>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section title="Theme Performance">
        {watchlistState.status === "loading" ? (
          <p className="text-[12px] text-neutral-500">Loading stock performance...</p>
        ) : watchlistState.status === "error" ? (
          <p className="text-[12px] text-neutral-500">Failed to load watchlist snapshot</p>
        ) : themePerformance.length === 0 ? (
          <p className="text-[12px] text-neutral-500">
            Theme performance will appear after the first watchlist snapshot.
          </p>
        ) : (
          <ul className="space-y-4">
            {themePerformance.map((theme) => (
              <li
                key={theme.theme}
                className="rounded-xl border border-neutral-100 px-3 py-3"
              >
                <p className="text-[12px] font-medium text-neutral-900">{theme.theme}</p>
                <ul className="mt-2 space-y-1.5">
                  {theme.stocks.map((stock) => {
                    const primaryLabel =
                      stock.change7DayLabel !== ALPHA_NA_LABEL
                        ? stock.change7DayLabel
                        : stock.change1DayLabel;

                    return (
                      <li
                        key={`${theme.theme}-${stock.ticker}`}
                        className="flex items-start justify-between gap-3"
                      >
                        <p className="font-mono text-[11px] text-neutral-800">
                          {stock.ticker}
                        </p>
                        <div className="text-right">
                          <p className="font-mono text-[12px] text-neutral-900">
                            {primaryLabel}
                          </p>
                          <p className="text-[10px] text-neutral-400">
                            1D {stock.change1DayLabel} · 7D {stock.change7DayLabel} · 30D{" "}
                            {stock.change30DayLabel}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {theme.topWinner ? (
                  <p className="mt-3 text-[10px] text-neutral-500">
                    Top Winner:{" "}
                    <span className="font-mono text-neutral-800">
                      {theme.topWinner.ticker}
                    </span>
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Alpha Backtest">
        {backtestState.status === "loading" ? (
          <p className="text-[12px] text-neutral-500">Loading backtest data...</p>
        ) : backtestState.status === "error" ? (
          <p className="text-[12px] text-neutral-500">Failed to load alpha backtest</p>
        ) : backtestState.status === "success" && backtestSummary ? (
          <div className="space-y-4">
            {!backtestSummary.meaningful ? (
              <p className="text-[12px] text-neutral-500">
                Backtest will become meaningful after 7+ days of snapshots.
              </p>
            ) : null}

            <div>
              <p className="text-[10px] tracking-wide text-neutral-400">Summary</p>
              <ul className="mt-2 space-y-1.5">
                <li className="flex items-center justify-between gap-3 text-[12px]">
                  <span className="text-neutral-600">Total Signals</span>
                  <span className="font-mono text-neutral-900">
                    {backtestSummary.totalSignals}
                  </span>
                </li>
                <li className="flex items-center justify-between gap-3 text-[12px]">
                  <span className="text-neutral-600">Hit Rate</span>
                  <span className="font-mono text-neutral-900">{hitRateDisplay}</span>
                </li>
                <li className="flex items-center justify-between gap-3 text-[12px]">
                  <span className="text-neutral-600">Avg 1D Return</span>
                  <span className="font-mono text-neutral-900">
                    {formatBacktestReturn(backtestSummary.averageReturn1D)}
                  </span>
                </li>
                <li className="flex items-center justify-between gap-3 text-[12px]">
                  <span className="text-neutral-600">Avg 7D Return</span>
                  <span className="font-mono text-neutral-900">
                    {formatBacktestReturn(backtestSummary.averageReturn7D)}
                  </span>
                </li>
                <li className="flex items-center justify-between gap-3 text-[12px]">
                  <span className="text-neutral-600">Avg 30D Return</span>
                  <span className="font-mono text-neutral-900">
                    {formatBacktestReturn(backtestSummary.averageReturn30D)}
                  </span>
                </li>
              </ul>
            </div>

            {themeScoreboardDisplay.length > 0 ? (
              <div>
                <p className="text-[10px] tracking-wide text-neutral-400">
                  Theme Scoreboard
                </p>
                <ul className="mt-2 space-y-2">
                  {themeScoreboardDisplay.map((item) => (
                    <li
                      key={item.theme}
                      className="flex items-center justify-between gap-3 rounded-xl border border-neutral-100 px-3 py-2.5"
                    >
                      <p className="text-[11px] text-neutral-800">{item.theme}</p>
                      <p className="font-mono text-[12px] text-neutral-900">
                        {item.label}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {recentSignals.length > 0 ? (
              <div>
                <p className="text-[10px] tracking-wide text-neutral-400">
                  Recent Signals
                </p>
                <ul className="mt-2 space-y-2">
                  {recentSignals.map((signal) => {
                    const topStock = getTopStockForSignal(signal);
                    return (
                      <li
                        key={`${signal.date}-${signal.theme}`}
                        className="rounded-xl border border-neutral-100 px-3 py-2.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-medium text-neutral-900">
                              {signal.date}
                            </p>
                            <p className="mt-0.5 text-[10px] text-neutral-500">
                              {signal.theme}
                            </p>
                          </div>
                          <p className="font-mono text-[12px] text-neutral-900">
                            {signal.convictionScore}
                          </p>
                        </div>
                        {topStock ? (
                          <p className="mt-2 text-[10px] text-neutral-500">
                            {topStock.pending ? (
                              <>Top Stock Pending</>
                            ) : (
                              <>
                                Top Stock{" "}
                                <span className="font-mono text-neutral-800">
                                  {topStock.ticker}
                                </span>{" "}
                                · {topStock.label}
                              </>
                            )}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : backtestSummary.totalSignals === 0 ? (
              <p className="text-[12px] text-neutral-500">
                No backtest signals yet. Run daily report to generate the first snapshot.
              </p>
            ) : null}
          </div>
        ) : null}
      </Section>

      <Section title="Trend Confirmation">
        {fetchState.status === "loading" ? (
          <p className="text-[12px] text-neutral-500">Loading Alpha Signals...</p>
        ) : fetchState.status === "error" ? (
          <p className="text-[12px] text-neutral-500">Failed to load alpha report</p>
        ) : trendConfirmations.length === 0 ? (
          <p className="text-[12px] text-neutral-500">
            Google Trends data unavailable
          </p>
        ) : (
          <ul className="space-y-4">
            {trendConfirmations.map((item) => (
              <li
                key={item.themeName}
                className="rounded-2xl border border-neutral-200 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-medium text-neutral-900">
                      {item.displayName}
                    </p>
                    <div className="mt-1">
                      <StatusPill label={item.convictionStrength} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg font-light text-neutral-900">
                      {item.convictionScore}
                    </p>
                    <p className="text-[10px] text-neutral-400">Conviction</p>
                  </div>
                </div>

                {item.convictionBreakdown ? (
                  <div className="mt-3 rounded-xl border border-neutral-100 px-3 py-3">
                    <p className="text-[10px] tracking-wide text-neutral-400">
                      Conviction Breakdown
                    </p>
                    <ul className="mt-2 space-y-1">
                      <li className="flex items-center justify-between text-[11px] text-neutral-700">
                        <span>Google Trends</span>
                        <span className="font-mono">
                          {formatGoogleTrendsBreakdown(item.convictionBreakdown.googleTrends)}
                        </span>
                      </li>
                      <li className="flex items-center justify-between text-[11px] text-neutral-700">
                        <span>News Momentum</span>
                        <span className="font-mono">
                          {formatBreakdownPoints(item.convictionBreakdown.newsMomentum)}
                        </span>
                      </li>
                      <li className="flex items-center justify-between text-[11px] text-neutral-700">
                        <span>Premium Sources</span>
                        <span className="font-mono">
                          {formatBreakdownPoints(item.convictionBreakdown.premiumSources)}
                        </span>
                      </li>
                      <li className="flex items-center justify-between text-[11px] text-neutral-700">
                        <span>Persistence</span>
                        <span className="font-mono">
                          {formatBreakdownPoints(item.convictionBreakdown.persistence)}
                        </span>
                      </li>
                    </ul>
                    <p className="mt-2 flex items-center justify-between border-t border-neutral-100 pt-2 text-[11px] font-medium text-neutral-900">
                      <span>
                        {item.convictionBreakdown.adjusted ? "Adjusted Score" : "Total"}
                      </span>
                      <span className="font-mono">{item.convictionBreakdown.total}</span>
                    </p>
                  </div>
                ) : null}

                <div className="mt-3 grid grid-cols-1 gap-2">
                  <div className="rounded-xl border border-neutral-100 px-3 py-3">
                    <p className="text-[10px] tracking-wide text-neutral-400">
                      News Signal
                    </p>
                    <p className="mt-1 text-[12px] text-neutral-800">
                      {item.newsSignal.growthLabel}
                    </p>
                    <p className="mt-1 text-[10px] text-neutral-500">
                      {item.newsSignal.currentCount} headlines · News Momentum
                    </p>
                  </div>
                  <div className="rounded-xl border border-neutral-100 px-3 py-3">
                    <p className="text-[10px] tracking-wide text-neutral-400">
                      Google Trends Signal
                    </p>
                    {item.googleTrendsSignal.available ? (
                      <>
                        <p className="mt-1 text-[12px] text-neutral-800">
                          Google Trends Score {item.googleTrendsSignal.trendScore} ·{" "}
                          Growth {item.googleTrendsSignal.growthLabel}
                        </p>
                        <p className="mt-1 text-[10px] text-neutral-500">
                          Current {item.googleTrendsSignal.current} · 7D{" "}
                          {item.googleTrendsSignal.interest7Day} · 30D{" "}
                          {item.googleTrendsSignal.interest30Day}
                        </p>
                      </>
                    ) : (
                      <p className="mt-1 text-[12px] text-neutral-500">
                        Google Trends data unavailable
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Theme Winners">
        {fetchState.status === "loading" ? (
          <p className="text-[12px] text-neutral-500">Loading Alpha Signals...</p>
        ) : fetchState.status === "error" ? (
          <p className="text-[12px] text-neutral-500">Failed to load alpha report</p>
        ) : themeWinners.length === 0 ? (
          <p className="text-[12px] text-neutral-500">
            Theme winners will appear once watchlist performance data is available.
          </p>
        ) : (
          <ul className="space-y-4">
            {themeWinners.map((item) => (
              <li
                key={item.themeName}
                className="rounded-2xl border border-neutral-200 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-medium text-neutral-900">
                      {item.displayName}
                    </p>
                    <div className="mt-1">
                      <StatusPill label={item.confirmationLevel} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg font-light text-neutral-900">
                      {item.avgReturn7DLabel}
                    </p>
                    <p className="text-[10px] text-neutral-400">7D Return</p>
                  </div>
                </div>

                <ul className="mt-3 space-y-1.5 rounded-xl border border-neutral-100 px-3 py-3">
                  {item.stocks.map((stock) => (
                    <li
                      key={stock.ticker}
                      className="flex items-center justify-between font-mono text-[12px] text-neutral-800"
                    >
                      <span>{stock.ticker}</span>
                      <span>{stock.change7DLabel}</span>
                    </li>
                  ))}
                </ul>

                <p className="mt-3 text-[10px] text-neutral-500">
                  Theme Confirmation: {item.confirmationLevel}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Trend Engine">
        {fetchState.status === "loading" ? (
          <p className="text-[12px] text-neutral-500">Loading Alpha Signals...</p>
        ) : fetchState.status === "error" ? (
          <p className="text-[12px] text-neutral-500">Failed to load alpha report</p>
        ) : trends.length === 0 ? (
          <p className="text-[12px] text-neutral-500">
            No investment trends detected in the current scan.
          </p>
        ) : (
          <ul className="space-y-4">
            {trends.map((trend) => (
              <li
                key={trend.id}
                className="rounded-2xl border border-neutral-200 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[14px] font-medium leading-snug text-neutral-900">
                    {trend.name}
                  </p>
                  <div className="text-right">
                    <p className="font-mono text-lg font-light text-neutral-900">
                      {trend.alphaScore}
                    </p>
                    <p className="text-[10px] text-neutral-400">Alpha Score</p>
                  </div>
                </div>

                <div className="mt-2">
                  <StatusPill label={trend.signalStrength} />
                </div>

                <p className="mt-3 text-[11px] leading-relaxed text-neutral-600">
                  {trend.summary}
                </p>

                <SubBlock title="Evidence">
                  <ul className="space-y-2">
                    {(trend.evidence ?? []).slice(0, 3).map((item, index) => (
                      <li key={`${item.link}-${index}`}>
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-medium leading-snug text-neutral-800 underline-offset-2 hover:underline"
                        >
                          {item.title}
                        </a>
                        <p className="mt-0.5 text-[10px] text-neutral-400">
                          {item.source} · {formatPublishedAt(item.publishedAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </SubBlock>

                <SubBlock title="Beneficiary Industries">
                  <TagList items={trend.beneficiaryIndustries ?? []} />
                </SubBlock>

                <SubBlock title="Potential Companies">
                  <ul className="space-y-2">
                    {(trend.potentialCompanies ?? []).map((company) => (
                      <li
                        key={company.ticker}
                        className="flex items-start justify-between gap-3"
                      >
                        <div>
                          <p className="font-mono text-[11px] text-neutral-900">
                            {company.ticker}
                          </p>
                          <p className="text-[10px] text-neutral-500">
                            {company.name}
                          </p>
                        </div>
                        <p className="max-w-[50%] text-right text-[10px] leading-relaxed text-neutral-400">
                          {company.reason}
                        </p>
                      </li>
                    ))}
                  </ul>
                </SubBlock>

                <SubBlock title="Risks">
                  <ul className="space-y-1.5">
                    {(trend.risks ?? []).map((risk) => (
                      <li
                        key={risk}
                        className="text-[10px] leading-relaxed text-neutral-500"
                      >
                        · {risk}
                      </li>
                    ))}
                  </ul>
                </SubBlock>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Watchlist">
        <ul className="space-y-2">
          {data.watchlist.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-neutral-100 px-3 py-3"
            >
              <div>
                <p className="font-mono text-[12px] text-neutral-900">
                  {item.symbol}
                </p>
                <p className="mt-0.5 text-[11px] text-neutral-500">{item.name}</p>
              </div>
              <StatusPill label={item.status} />
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Raw Signals">
        {fetchState.status === "loading" ? (
          <p className="text-[12px] text-neutral-500">Loading Alpha Signals...</p>
        ) : fetchState.status === "error" ? (
          <p className="text-[12px] text-neutral-500">Failed to load alpha report</p>
        ) : sources.length === 0 ? (
          <p className="text-[12px] text-neutral-500">No raw signals available.</p>
        ) : (
          <ul className="space-y-3">
            {sources.map((item, index) => (
              <li
                key={`${item.link}-${index}`}
                className="rounded-xl border border-neutral-100 px-3 py-3"
              >
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] font-medium leading-snug text-neutral-900 underline-offset-2 hover:underline"
                >
                  {item.title}
                </a>
                <p className="mt-2 text-[11px] text-neutral-500">
                  {item.source} · {formatPublishedAt(item.publishedAt)}
                </p>
                <StatusPill label={item.keyword} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <footer className="mt-8 text-center text-[10px] tracking-wide text-neutral-300">
        CHJ © 2026 · Theme Rotation V1.0
      </footer>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-4 rounded-2xl border border-neutral-200 bg-white px-4 py-4">
      <h2 className="text-[10px] tracking-wide text-neutral-400">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function SubBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 border-t border-neutral-100 pt-3">
      <h3 className="text-[10px] tracking-wide text-neutral-400">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function TagList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full border border-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function StatusPill({ label }: { label: string }) {
  return (
    <span className="inline-block rounded-full border border-neutral-200 px-2 py-0.5 text-[10px] tracking-wide text-neutral-500">
      {label}
    </span>
  );
}
