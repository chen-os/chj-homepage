export const runtime = "nodejs";

import { getBacktestResponse } from "../../../lib/alpha/backtest";

export async function GET() {
  try {
    const response = await getBacktestResponse();
    return Response.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load alpha backtest";
    return Response.json({ error: message }, { status: 500 });
  }
}
