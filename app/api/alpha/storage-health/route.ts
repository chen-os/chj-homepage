export const runtime = "nodejs";

import { getStorageHealthResponse } from "../../../lib/alpha/storage";

export async function GET() {
  try {
    const health = await getStorageHealthResponse();
    return Response.json(health);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to inspect alpha storage";
    return Response.json({ error: message }, { status: 500 });
  }
}
