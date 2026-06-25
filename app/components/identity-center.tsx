import Link from "next/link";
import {
  groupIdentityRecordsByCategory,
  identityRecords,
  type IdentityRecord,
} from "../data/identity-center";

function Field({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  if (!value.trim()) return null;

  return (
    <div>
      <p className="text-[10px] tracking-wide text-neutral-400">{label}</p>
      <p className="mt-1 text-[13px] text-neutral-800">{value}</p>
    </div>
  );
}

function IdentityCard({ record }: { record: IdentityRecord }) {
  return (
    <li className="rounded-2xl border border-neutral-200 bg-white px-4 py-4">
      <p className="text-[15px] font-medium tracking-tight text-neutral-900">
        {record.displayName}
      </p>
      <div className="mt-3 grid gap-3">
        <Field label="名義 / ローマ字" value={record.accountName} />
        <Field label="カナ" value={record.kanaName} />
        <Field label="メール" value={record.email} />
        <Field label="メモ" value={record.note} />
      </div>
    </li>
  );
}

export function IdentityCenter() {
  const groups = groupIdentityRecordsByCategory(identityRecords);

  return (
    <main className="mx-auto min-h-[100dvh] max-w-md bg-white px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))] sm:max-w-lg">
      <header className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium tracking-[0.24em] text-neutral-400">
              CHJ.JP
            </p>
            <h1 className="mt-2 text-3xl font-light tracking-tight text-neutral-900">
              Identity Center
            </h1>
            <p className="mt-2 text-[13px] tracking-wide text-neutral-500">
              身分証・銀行・カード名義の管理
            </p>
          </div>
          <Link
            href="/"
            className="shrink-0 rounded-full border border-neutral-200 px-3 py-1.5 text-[10px] tracking-wide text-neutral-500"
          >
            ホーム
          </Link>
        </div>
      </header>

      <p className="mb-5 rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2.5 text-[11px] leading-relaxed text-neutral-500">
        カード番号・口座番号・パスワード・住所などの機密情報は表示しません。
      </p>

      <div className="space-y-6">
        {groups.map((group) => (
          <section key={group.category} aria-label={group.category}>
            <h2 className="text-[10px] font-medium tracking-[0.2em] text-neutral-400">
              {group.category}
            </h2>
            <ul className="mt-3 space-y-3">
              {group.items.map((record) => (
                <IdentityCard key={record.id} record={record} />
              ))}
            </ul>
          </section>
        ))}
      </div>

      <footer className="mt-10 text-center text-[10px] tracking-wide text-neutral-300">
        CHJ © 2026
      </footer>
    </main>
  );
}
