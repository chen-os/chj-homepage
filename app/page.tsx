import { headers } from "next/headers";
import { ChjAlphaDashboard } from "./components/chj-alpha-dashboard";
import { ChjControlCenter } from "./components/chj-control-center";
import { ChjHome } from "./components/chj-home";
import { PonyWalkLog } from "./components/pony-walk-log";

function normalizeHost(host: string): string {
  return host.split(":")[0].toLowerCase();
}

function isLocalHost(host: string): boolean {
  const normalized = normalizeHost(host);
  return normalized === "localhost" || normalized === "127.0.0.1";
}

function isAdminHost(host: string): boolean {
  const lower = host.toLowerCase();
  const normalized = normalizeHost(host);
  return lower.includes("admin.chj.jp") || normalized.startsWith("admin.");
}

function isPonyHost(host: string): boolean {
  const lower = host.toLowerCase();
  const normalized = normalizeHost(host);
  return lower.includes("pony.chj.jp") || normalized.startsWith("pony.");
}

function isAlphaHost(host: string): boolean {
  const lower = host.toLowerCase();
  const normalized = normalizeHost(host);
  return lower.includes("alpha.chj.jp") || normalized.startsWith("alpha.");
}

type HomeProps = {
  searchParams: Promise<{ view?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { view } = await searchParams;
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "";

  if (isLocalHost(host) && view) {
    if (view === "alpha") return <ChjAlphaDashboard />;
    if (view === "pony") return <PonyWalkLog />;
    if (view === "admin") return <ChjControlCenter />;
  }

  if (isAdminHost(host)) {
    return <ChjControlCenter />;
  }

  if (isPonyHost(host)) {
    return <PonyWalkLog />;
  }

  if (isAlphaHost(host)) {
    return <ChjAlphaDashboard />;
  }

  return <ChjHome />;
}
