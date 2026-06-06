export const runtime = "nodejs";

import { getThemeHistoryRecords } from "../../../lib/alpha/history";

export async function GET() {
  const records = await getThemeHistoryRecords();
  return Response.json({ records });
}
