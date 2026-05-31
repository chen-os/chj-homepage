import Link from "next/link";
import { headers } from "next/headers";
import { ChjControlCenter } from "./components/chj-control-center";
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

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col bg-white px-6 pb-8 pt-[max(2rem,env(safe-area-inset-top))] sm:max-w-lg">
      <div className="flex flex-1 flex-col justify-center">
        <h1 className="mt-4 text-[1.75rem] font-light leading-tight tracking-tight text-neutral-900 sm:text-3xl">
          CHJ
        </h1>

        <Link
          href="https://pony.chj.jp"
          className="mt-8 inline-flex w-full items-center justify-center rounded-lg border border-neutral-900 bg-neutral-900 px-6 py-3.5 text-[13px] font-medium tracking-wide text-white sm:w-auto sm:min-w-[220px]"
        >
          Pony Life Dashboard
        </Link>
      </div>

      <footer className="mt-12 text-center text-[10px] tracking-wide text-neutral-300">
        CHJ © 2026
      </footer>
    </main>
  );
}
