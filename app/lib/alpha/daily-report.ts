import { syncDailyBacktest } from "./backtest";
import { buildTrendConfirmations, type TrendConfirmation } from "./conviction-engine";
import {
  appendTodaySnapshot,
  buildInMemoryHistoryWithTodayEvidence,
  loadHistory,
} from "./history";
import { fetchGoogleTrendsByTheme, type GoogleTrendThemeResult } from "./google-trends";
import { normalizeText } from "./normalize-text";
import { buildEmergingThemes, type TrendMomentum } from "./momentum-engine";
import { buildTrends, type AlphaTrend } from "./trend-engine";
import { buildThemeSnapshots } from "./theme-persistence";
import {
  buildThemeMomentum,
  buildTrendLeaderboard,
  type ThemeMomentum,
  type TrendLeaderboardEntry,
} from "./theme-momentum-engine";
import { appendDailyThemeRotation } from "./theme-rotation";
import {
  buildThemeStockPerformanceFile,
  saveThemeStockPerformance,
} from "./theme-stock-performance";
import {
  buildThemeDivergenceReport,
  type AlphaOpportunity,
  type ThemeDivergence,
} from "./theme-divergence-engine";
import {
  buildTrendLifecycles,
  type TrendLifecycle,
} from "./trend-lifecycle-engine";
import { buildThemeWinners, type ThemeWinner } from "./theme-winners-engine";
import { getOrCreateWatchlistSnapshot } from "./watchlist-snapshot";
import { loadWatchlistHistory } from "./watchlist-history";
import { StorageWriteError } from "./storage";

const KEYWORDS = [
  "AI data center power",
  "artificial intelligence infrastructure",
  "nuclear energy AI",
  "small modular reactor",
  "humanoid robot",
  "robotics startup funding",
  "GPU cluster",
  "inference compute",
] as const;

const ITEMS_PER_KEYWORD = 5;

export type DailyReportSource = {
  keyword: string;
  title: string;
  source: string;
  publishedAt: string;
  link: string;
};

export type DailyReport = {
  date: string;
  sources: DailyReportSource[];
  trends: AlphaTrend[];
  emergingThemes: TrendMomentum[];
  googleTrends: GoogleTrendThemeResult[];
  trendConfirmations: TrendConfirmation[];
  themeMomentum: ThemeMomentum[];
  trendLeaderboard: TrendLeaderboardEntry[];
  themeWinners: ThemeWinner[];
  trendLifecycles: TrendLifecycle[];
  themeDivergence: ThemeDivergence[];
  alphaOpportunities: AlphaOpportunity[];
};

export function getAlphaReportDate(timeZone = "Asia/Tokyo"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function extractTag(block: string, tag: string): string {
  const cdata = block.match(
    new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i"),
  );
  if (cdata?.[1]) return cdata[1].trim();

  const plain = block.match(
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"),
  );
  if (!plain?.[1]) return "";
  return plain[1].replace(/<[^>]+>/g, "").trim();
}

function parseGoogleNewsRss(xml: string, keyword: string): DailyReportSource[] {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];

  return items.slice(0, ITEMS_PER_KEYWORD).map((item) => {
    const rawTitle = extractTag(item, "title");
    const title = normalizeText(rawTitle);
    const link = extractTag(item, "link");
    const pubDate = extractTag(item, "pubDate");
    let source = normalizeText(extractTag(item, "source"));

    if (!source && title.includes(" - ")) {
      source = normalizeText(title.split(" - ").pop()?.trim() ?? "Unknown");
    }

    return {
      keyword,
      title: normalizeText(title.replace(/\s*-\s*[^-]+$/, "").trim() || title),
      source: source || "Unknown",
      publishedAt: pubDate
        ? new Date(pubDate).toISOString()
        : new Date().toISOString(),
      link,
    };
  });
}

async function fetchKeywordNews(keyword: string): Promise<DailyReportSource[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=en-US&gl=US&ceid=US:en`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; CHJ-AlphaDashboard/1.2)",
      Accept: "application/rss+xml, application/xml, text/xml",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`RSS fetch failed for "${keyword}": ${response.status}`);
  }

  const xml = await response.text();
  return parseGoogleNewsRss(xml, keyword);
}

function dedupeSources(sources: DailyReportSource[]): DailyReportSource[] {
  const seen = new Set<string>();
  return sources.filter((item) => {
    const key = item.link || `${item.keyword}:${item.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function buildDailyReport(
  date: string = getAlphaReportDate(),
): Promise<DailyReport> {
  const [newsResults, googleTrends] = await Promise.all([
    Promise.allSettled(KEYWORDS.map((keyword) => fetchKeywordNews(keyword))),
    fetchGoogleTrendsByTheme(),
  ]);

  const sources = dedupeSources(
    newsResults.flatMap((result) =>
      result.status === "fulfilled" ? result.value : [],
    ),
  );

  const failedCount = newsResults.filter((r) => r.status === "rejected").length;
  if (sources.length === 0) {
    throw new Error(
      failedCount > 0
        ? `All RSS fetches failed (${failedCount}/${KEYWORDS.length})`
        : "No news items returned",
    );
  }

  try {
    const priorHistory = await loadHistory();
    const trends = buildTrends(sources, googleTrends);
    const inMemoryHistory = buildInMemoryHistoryWithTodayEvidence(
      priorHistory,
      date,
      trends,
    );
    const emergingThemes = buildEmergingThemes(inMemoryHistory, date);
    const trendConfirmations = buildTrendConfirmations(
      emergingThemes,
      googleTrends,
      trends,
      priorHistory,
      date,
    );
    const themeSnapshots = buildThemeSnapshots(trends, trendConfirmations);
    const history = await appendTodaySnapshot(date, themeSnapshots);
    const themeMomentum = buildThemeMomentum(history, date, trendConfirmations);
    const trendLeaderboard = buildTrendLeaderboard(themeMomentum);
    const trendLifecycles = buildTrendLifecycles(
      trendConfirmations,
      themeMomentum,
      trends,
    );
    const { themeDivergence, alphaOpportunities } =
      await buildThemeDivergenceReport(trendLifecycles);
    const [watchlistSnapshot, watchlistHistory] = await Promise.all([
      getOrCreateWatchlistSnapshot(date),
      loadWatchlistHistory(),
    ]);
    const themeWinners = buildThemeWinners(
      trends,
      watchlistHistory,
      date,
      trendConfirmations,
    );
    await saveThemeStockPerformance(buildThemeStockPerformanceFile(themeWinners));

    await syncDailyBacktest(
      {
        date,
        trends,
        trendConfirmations,
      },
      watchlistSnapshot,
    );
    await appendDailyThemeRotation(date, trendConfirmations);

    return {
      date,
      sources,
      trends,
      emergingThemes,
      googleTrends,
      trendConfirmations,
      themeMomentum,
      trendLeaderboard,
      themeWinners,
      trendLifecycles,
      themeDivergence,
      alphaOpportunities,
    };
  } catch (error) {
    if (error instanceof StorageWriteError) {
      throw new Error(`Alpha persistence failed for ${error.key}`);
    }
    throw error;
  }
}

export type DailyReportPersistence = {
  alphaHistory: boolean;
  watchlistHistory: boolean;
  alphaBacktest: boolean;
  themeRotation: boolean;
};

export function getDailyReportPersistenceTargets(): DailyReportPersistence {
  return {
    alphaHistory: true,
    watchlistHistory: true,
    alphaBacktest: true,
    themeRotation: true,
  };
}
