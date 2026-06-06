export const runtime = "nodejs";

import { getOrCreateWatchlistSnapshot } from "../../../lib/alpha/watchlist-snapshot";

export async function GET() {
  try {
    const date = new Date().toISOString().slice(0, 10);
    const snapshot = await getOrCreateWatchlistSnapshot(date);
    return Response.json(snapshot);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to build watchlist snapshot";
    return Response.json({ error: message }, { status: 500 });
  }
}
