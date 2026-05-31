import Link from "next/link";

export type HomeModule = {
  id: string;
  title: string;
  description: string;
  status: string;
  href: string;
};

export const homeModules: HomeModule[] = [
  {
    id: "pony",
    title: "Pony",
    description: "Pony Life",
    status: "今日の散歩を記録",
    href: "/pony",
  },
  {
    id: "car",
    title: "Car",
    description: "GLC 350e",
    status: "車両管理",
    href: "/car",
  },
  {
    id: "finance",
    title: "Finance",
    description: "Money & FX",
    status: "為替・資産管理",
    href: "/finance",
  },
  {
    id: "family",
    title: "Family",
    description: "Family Schedule",
    status: "予定・部活・習い事",
    href: "/family",
  },
  {
    id: "translate",
    title: "Translate",
    description: "AI Translator",
    status: "音声翻訳",
    href: "/translate",
  },
  {
    id: "admin",
    title: "Admin",
    description: "Control Center",
    status: "システム管理",
    href: "/admin",
  },
];

export function ChjHome() {
  return (
    <main className="mx-auto min-h-[100dvh] max-w-md bg-white px-5 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))] sm:max-w-lg">
      <header className="mb-8">
        <p className="text-[11px] font-medium tracking-[0.24em] text-neutral-400">
          CHJ.JP
        </p>
        <h1 className="mt-3 text-4xl font-light tracking-tight text-neutral-900">
          CHJ
        </h1>
        <p className="mt-2 text-[13px] tracking-wide text-neutral-500">
          Personal Life Dashboard
        </p>
      </header>

      <section aria-label="モジュール一覧">
        <ul className="grid grid-cols-1 gap-3">
          {homeModules.map((module) => (
            <li key={module.id}>
              <Link
                href={module.href}
                className="group block rounded-2xl border border-neutral-200 bg-white px-4 py-4 transition-colors active:border-neutral-400"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[15px] font-medium tracking-tight text-neutral-900">
                      {module.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-neutral-400">
                      {module.description}
                    </p>
                  </div>
                  <span
                    className="mt-0.5 text-neutral-300 transition-transform group-active:translate-x-0.5"
                    aria-hidden
                  >
                    →
                  </span>
                </div>
                <p className="mt-3 text-[12px] text-neutral-600">{module.status}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-10 text-center text-[10px] tracking-wide text-neutral-300">
        CHJ © 2026
      </footer>
    </main>
  );
}
