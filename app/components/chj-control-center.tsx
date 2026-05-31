import Link from "next/link";
import {
  mockControlCenterData,
  type ControlCenterData,
  type SiteStatusItem,
  type VercelEnvironmentStatus,
} from "../data/admin-control-center";

const dateTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDateTime(value: string): string {
  return dateTimeFormatter.format(new Date(value));
}

function siteStatusLabel(status: SiteStatusItem["status"]): string {
  switch (status) {
    case "online":
      return "稼働中";
    case "offline":
      return "停止中";
    default:
      return "不明";
  }
}

function vercelStatusLabel(status: VercelEnvironmentStatus["status"]): string {
  switch (status) {
    case "ready":
      return "Ready";
    case "building":
      return "Building";
    default:
      return "Error";
  }
}

function dnsStatusLabel(status: "active" | "pending" | "unknown"): string {
  switch (status) {
    case "active":
      return "有効";
    case "pending":
      return "反映待ち";
    default:
      return "不明";
  }
}

type ChjControlCenterProps = {
  data?: ControlCenterData;
};

export function ChjControlCenter({
  data = mockControlCenterData,
}: ChjControlCenterProps) {
  return (
    <main className="mx-auto min-h-[100dvh] max-w-md bg-white px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))] sm:max-w-lg">
      <header className="mb-6">
        <p className="text-[11px] font-medium tracking-[0.24em] text-neutral-400">
          ADMIN.CHJ.JP
        </p>
        <h1 className="mt-2 text-3xl font-light tracking-tight text-neutral-900">
          CHJ Control Center
        </h1>
      </header>

      <Section title="サイト状態">
        <ul className="space-y-2">
          {data.sites.map((site) => (
            <li
              key={site.domain}
              className="flex items-center justify-between rounded-xl border border-neutral-100 px-3 py-3"
            >
              <span className="text-[13px] text-neutral-900">{site.domain}</span>
              <StatusPill
                tone={
                  site.status === "online"
                    ? "positive"
                    : site.status === "offline"
                      ? "negative"
                      : "neutral"
                }
                label={siteStatusLabel(site.status)}
              />
            </li>
          ))}
        </ul>
      </Section>

      <Section title="GitHub">
        <dl className="space-y-3 text-[12px] leading-relaxed text-neutral-600">
          <Row label="最新 Commit" value={data.github.latestCommit} mono />
          <Row
            label="更新日時"
            value={formatDateTime(data.github.updatedAt)}
          />
          <Row label="コメント" value={data.github.message} />
        </dl>
      </Section>

      <Section title="Vercel">
        <ul className="space-y-3">
          {data.vercel.map((deployment) => (
            <li
              key={deployment.environment}
              className="rounded-xl border border-neutral-100 px-3 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-medium text-neutral-900">
                  {deployment.label}
                </p>
                <StatusPill
                  tone={deployment.status === "ready" ? "positive" : "neutral"}
                  label={vercelStatusLabel(deployment.status)}
                />
              </div>
              <p className="mt-2 truncate text-[11px] text-neutral-400">
                {deployment.url}
              </p>
              <p className="mt-1 text-[11px] text-neutral-500">
                デプロイ日時 {formatDateTime(deployment.deployedAt)}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="DNS">
        <ul className="space-y-2">
          {data.dns.map((record) => (
            <li
              key={record.domain}
              className="rounded-xl border border-neutral-100 px-3 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] text-neutral-900">{record.domain}</p>
                <StatusPill tone="neutral" label={dnsStatusLabel(record.status)} />
              </div>
              <p className="mt-2 text-[11px] text-neutral-500">
                {record.type} · {record.value}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="開発">
        <Link
          href="/admin/dev"
          className="block rounded-xl border border-neutral-900 bg-neutral-900 px-4 py-3 text-center text-[12px] font-medium tracking-wide text-white"
        >
          開発ダッシュボード
        </Link>
      </Section>

      <Section title="プロジェクト">
        <div className="grid grid-cols-1 gap-2">
          {data.projects.map((project) =>
            project.comingSoon || !project.href ? (
              <span
                key={project.id}
                className="flex items-center justify-between rounded-xl border border-neutral-100 px-4 py-3 text-[12px] text-neutral-400"
              >
                {project.label}
                <span className="text-[10px] tracking-wide">Coming Soon</span>
              </span>
            ) : (
              <Link
                key={project.id}
                href={project.href}
                className="rounded-xl border border-neutral-900 bg-neutral-900 px-4 py-3 text-center text-[12px] font-medium tracking-wide text-white"
              >
                {project.label}
              </Link>
            ),
          )}
        </div>
      </Section>

      <footer className="mt-8 text-center text-[10px] tracking-wide text-neutral-300">
        CHJ © 2026
      </footer>
    </main>
  );
}

function Section({
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

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] tracking-wide text-neutral-400">{label}</dt>
      <dd
        className={`mt-1 text-[12px] text-neutral-800 ${mono ? "font-mono" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "positive" | "negative" | "neutral";
}) {
  const toneClass =
    tone === "positive"
      ? "border-neutral-200 text-neutral-700"
      : tone === "negative"
        ? "border-neutral-300 text-neutral-500"
        : "border-neutral-100 text-neutral-500";

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] tracking-wide ${toneClass}`}
    >
      {label}
    </span>
  );
}
