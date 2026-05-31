import Link from "next/link";
import type { DevReportData } from "../lib/dev-report";

type DevReportDashboardProps = {
  data: DevReportData;
};

export function DevReportDashboard({ data }: DevReportDashboardProps) {
  if (!data.exists) {
    return (
      <Shell>
        <EmptyState message="DEV_REPORT が見つかりません" />
      </Shell>
    );
  }

  return (
    <Shell meta={data}>
      <section className="mt-4 grid grid-cols-1 gap-2">
        <MetricCard
          label="ビルド状態"
          value={data.buildStatus.label}
          tone={data.buildStatus.success ? "positive" : "neutral"}
        />
      </section>

      <Panel title="現在の目標">
        <p className="text-[12px] leading-relaxed text-neutral-700">
          {data.currentGoal || "—"}
        </p>
      </Panel>

      <Panel title="変更ファイル">
        {data.modifiedFiles.length === 0 ? (
          <p className="text-[12px] text-neutral-400">記録なし</p>
        ) : (
          <ul className="space-y-1.5">
            {data.modifiedFiles.map((file) => (
              <li
                key={file}
                className="font-mono text-[11px] leading-relaxed text-neutral-600"
              >
                {file}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="現在のルート">
        {data.routes.length === 0 ? (
          <p className="text-[12px] text-neutral-400">記録なし</p>
        ) : (
          <ul className="space-y-1.5">
            {data.routes.map((route) => (
              <li
                key={route}
                className="font-mono text-[11px] text-neutral-700"
              >
                {route}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="既知の問題">
        {data.knownIssues.length === 0 ? (
          <p className="text-[12px] text-neutral-400">記録なし</p>
        ) : (
          <ul className="space-y-2">
            {data.knownIssues.map((issue) => (
              <li
                key={issue}
                className="text-[12px] leading-relaxed text-neutral-600"
              >
                {issue}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="次のステップ">
        {data.nextSteps.length === 0 ? (
          <p className="text-[12px] text-neutral-400">記録なし</p>
        ) : (
          <ol className="space-y-2">
            {data.nextSteps.map((step, index) => (
              <li
                key={step}
                className="flex gap-2 text-[12px] leading-relaxed text-neutral-600"
              >
                <span className="font-mono text-[11px] text-neutral-400">
                  {index + 1}.
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        )}
      </Panel>

      {data.buildStatus.detail ? (
        <Panel title="ビルド詳細">
          <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-neutral-500">
            {data.buildStatus.detail}
          </pre>
        </Panel>
      ) : null}
    </Shell>
  );
}

function Shell({
  children,
  meta,
}: {
  children: React.ReactNode;
  meta?: DevReportData;
}) {
  return (
    <main className="mx-auto min-h-[100dvh] max-w-md bg-white px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))] sm:max-w-lg">
      <header className="mb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium tracking-[0.24em] text-neutral-400">
              ADMIN.CHJ.JP
            </p>
            <h1 className="mt-2 text-3xl font-light tracking-tight text-neutral-900">
              開発ダッシュボード
            </h1>
          </div>
          <Link
            href="/admin"
            className="shrink-0 rounded-full border border-neutral-200 px-3 py-1.5 text-[10px] tracking-wide text-neutral-500"
          >
            戻る
          </Link>
        </div>
        {meta ? (
          <p className="mt-3 text-[11px] leading-relaxed text-neutral-400">
            {meta.reportId && <span>{meta.reportId}</span>}
            {meta.lastUpdated && <span> · 更新 {meta.lastUpdated}</span>}
            {meta.branch && <span> · {meta.branch}</span>}
          </p>
        ) : null}
      </header>

      {children}

      <footer className="mt-8 text-center text-[10px] tracking-wide text-neutral-300">
        DEV_REPORT.md
      </footer>
    </main>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <section className="mt-8 rounded-2xl border border-neutral-200 px-4 py-10 text-center">
      <p className="text-[13px] text-neutral-500">{message}</p>
      <Link
        href="/admin"
        className="mt-6 inline-block rounded-xl border border-neutral-900 bg-neutral-900 px-5 py-2.5 text-[12px] font-medium tracking-wide text-white"
      >
        Control Center へ
      </Link>
    </section>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-4 rounded-2xl border border-neutral-200 bg-white px-4 py-4">
      <h2 className="text-[10px] tracking-wide text-neutral-400">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "positive" | "neutral";
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3">
      <p className="text-[10px] text-neutral-400">{label}</p>
      <p
        className={`mt-1 text-lg font-light tracking-tight ${
          tone === "positive" ? "text-neutral-900" : "text-neutral-600"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
