import Link from "next/link";

type ComingSoonPageProps = {
  pageName: string;
};

export function ComingSoonPage({ pageName }: ComingSoonPageProps) {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col bg-white px-5 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))] sm:max-w-lg">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="text-[11px] font-medium tracking-[0.24em] text-neutral-400">
          CHJ.JP
        </p>
        <h1 className="mt-4 text-2xl font-light tracking-tight text-neutral-900">
          {pageName}
        </h1>
        <p className="mt-3 text-[13px] tracking-wide text-neutral-400">
          Coming Soon
        </p>
      </div>

      <Link
        href="/"
        className="rounded-xl border border-neutral-900 bg-neutral-900 px-4 py-3 text-center text-[12px] font-medium tracking-wide text-white"
      >
        ホームに戻る
      </Link>

      <footer className="mt-8 text-center text-[10px] tracking-wide text-neutral-300">
        CHJ © 2026
      </footer>
    </main>
  );
}
