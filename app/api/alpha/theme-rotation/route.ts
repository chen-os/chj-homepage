export const runtime = "nodejs";

import {
  buildThemeRotationSummary,
  loadThemeRotationHistory,
} from "../../../lib/alpha/theme-rotation";

export async function GET() {
  const history = await loadThemeRotationHistory();
  const summary = await buildThemeRotationSummary(history);
  return Response.json({
    history: history.history,
    ...summary,
  });
}
