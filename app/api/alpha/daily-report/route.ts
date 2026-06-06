export const runtime = "nodejs";

import { buildDailyReport } from "../../../lib/alpha/daily-report";

export async function GET() {
  try {
    const report = await buildDailyReport();
    return Response.json(report);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to build daily report";
    return Response.json({ error: message }, { status: 500 });
  }
}
