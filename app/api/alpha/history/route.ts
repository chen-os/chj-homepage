export const runtime = "nodejs";

import { loadHistory } from "../../../lib/alpha/history";

export async function GET() {
  const data = await loadHistory();
  return Response.json({ history: data.history });
}
