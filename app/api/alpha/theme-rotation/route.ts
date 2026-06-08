export const runtime = "nodejs";

import { getAlphaReportDate } from "../../../lib/alpha/daily-report";
import { buildLeaderTracker } from "../../../lib/alpha/leader-tracker";
import {
  buildThemeRotationSummary,
  loadThemeRotationHistory,
} from "../../../lib/alpha/theme-rotation";
import { loadWatchlistHistory } from "../../../lib/alpha/watchlist-history";

export async function GET() {
  const reportDate = getAlphaReportDate();
  const [history, watchlistHistory] = await Promise.all([
    loadThemeRotationHistory(),
    loadWatchlistHistory(),
  ]);
  const summary = await buildThemeRotationSummary(history, reportDate);
  const leaderTracker = buildLeaderTracker(history, watchlistHistory, reportDate);

  return Response.json({
    history: history.history,
    leaderTracker,
    ...summary,
  });
}
