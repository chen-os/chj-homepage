export const runtime = "nodejs";

import {
  buildDailyReport,
  getAlphaReportDate,
  getDailyReportPersistenceTargets,
} from "../../../../lib/alpha/daily-report";
import { StorageWriteError, getStorageMode } from "../../../../lib/alpha/storage";

function isAuthorizedCronRequest(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const date = getAlphaReportDate();
    const report = await buildDailyReport(date);

    return Response.json({
      ok: true,
      triggeredBy: "vercel-cron",
      storageMode: getStorageMode(),
      date: report.date,
      persisted: getDailyReportPersistenceTargets(),
      summary: {
        sources: report.sources.length,
        trends: report.trends.length,
        topTheme: report.trendConfirmations[0]?.displayName ?? null,
        topConviction: report.trendConfirmations[0]?.convictionScore ?? null,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to run alpha daily cron";
    const persisted = error instanceof StorageWriteError ? false : undefined;
    return Response.json({ ok: false, error: message, persisted }, { status: 500 });
  }
}
