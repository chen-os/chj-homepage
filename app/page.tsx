import { headers } from "next/headers";
import { ChjControlCenter } from "./components/chj-control-center";
import { ChjHome } from "./components/chj-home";
import { PonyWalkLog } from "./components/pony-walk-log";

function normalizeHost(host: string): string {
  return host.split(":")[0].toLowerCase();
}

function isAdminHost(host: string): boolean {
  const normalized = normalizeHost(host);
  return normalized === "admin.chj.jp" || normalized.startsWith("admin.");
}

function isPonyHost(host: string): boolean {
  const normalized = normalizeHost(host);
  return normalized === "pony.chj.jp" || normalized.startsWith("pony.");
}

export default async function Home() {
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "";

  if (isAdminHost(host)) {
    return <ChjControlCenter />;
  }

  if (isPonyHost(host)) {
    return <PonyWalkLog />;
  }

  return <ChjHome />;
}
