import { PonyGrowthChart, type WeightPoint } from "./components/pony-growth-chart";

const PONY_WEIGHTS: WeightPoint[] = [
  { date: "2026-02-07", label: "2/7", weight: 1.15 },
  { date: "2026-02-16", label: "2/16", weight: 1.3 },
  { date: "2026-04-30", label: "4/30", weight: 2.1 },
  { date: "2026-05-19", label: "5/19", weight: 2.3 },
];

const LATEST_WEIGHT = PONY_WEIGHTS[PONY_WEIGHTS.length - 1].weight;

function DashboardCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white px-5 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="mb-4">
        <h2 className="text-[13px] font-medium tracking-wide text-neutral-900">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
            {subtitle}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export default function Home() {
  return (
    <main className="mx-auto min-h-[100dvh] max-w-md bg-neutral-50 px-4 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))] sm:max-w-lg sm:px-6">
      <header className="mb-8 pt-2">
        <p className="text-[11px] font-medium tracking-[0.2em] text-neutral-400">
          CHJ.JP
        </p>
        <h1 className="mt-3 text-3xl font-light tracking-tight text-neutral-900">
          CHJ
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          Personal Dashboard
        </p>
        <p className="mt-1 text-[11px] text-neutral-400">
          Private workspace · Tokyo
        </p>
      </header>

      <div className="flex flex-col gap-4">
        <DashboardCard title="Pony" subtitle="チワマル · Growth">
          <div className="space-y-3 text-[12px] leading-relaxed text-neutral-500">
            <p>
              母犬 马尔济斯 3.0kg · 父犬 吉娃娃 2.6kg
            </p>
            <p className="flex flex-wrap gap-x-4 gap-y-1">
              <span>生日 2025-11-09</span>
              <span className="text-neutral-900">
                当前 {LATEST_WEIGHT} kg
              </span>
            </p>
          </div>
          <div className="mt-5">
            <PonyGrowthChart data={PONY_WEIGHTS} />
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-2 border-t border-neutral-100 pt-4 sm:grid-cols-4">
            {PONY_WEIGHTS.map((row) => (
              <li key={row.date} className="text-center">
                <p className="text-[10px] text-neutral-400">{row.date}</p>
                <p className="mt-0.5 text-sm font-medium text-neutral-900">
                  {row.weight} kg
                </p>
              </li>
            ))}
          </ul>
        </DashboardCard>

        <DashboardCard title="Exchange" subtitle="Static · JPY / RMB">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-4xl font-light tracking-tight text-neutral-900">
              4.98
            </p>
            <p className="text-right text-[11px] leading-relaxed text-neutral-400">
              RMB per
              <br />
              100 JPY
            </p>
          </div>
          <p className="mt-4 border-t border-neutral-100 pt-4 text-[11px] text-neutral-400">
            1 JPY ≈ 0.0498 RMB · Updated manually
          </p>
        </DashboardCard>

        <DashboardCard
          title="Flights"
          subtitle="Tokyo ⇄ Shanghai · Last 3 years"
        >
          <div className="flex min-h-[88px] flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50/80">
            <p className="text-sm font-medium tracking-wide text-neutral-400">
              Coming soon
            </p>
            <p className="mt-1 text-[11px] text-neutral-300">
              Route history &amp; frequency
            </p>
          </div>
        </DashboardCard>
      </div>

      <footer className="mt-10 text-center text-[10px] tracking-[0.15em] text-neutral-300">
        CHJ Dashboard v1
      </footer>
    </main>
  );
}
