import Link from "next/link";
import {
  accidentSteps,
  emergencyContacts,
  salesContact,
} from "../data/car-emergency-contacts";

export function CarDashboard() {
  return (
    <main className="mx-auto min-h-[100dvh] max-w-md bg-white px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))] sm:max-w-lg">
      <header className="mb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium tracking-[0.24em] text-neutral-400">
              CHJ.JP
            </p>
            <h1 className="mt-2 text-3xl font-light tracking-tight text-neutral-900">
              Car Dashboard
            </h1>
            <p className="mt-2 text-[13px] tracking-wide text-neutral-500">
              GLC 350e
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

      <section aria-label="担当営業">
        <a
          href={`tel:${salesContact.tel}`}
          className="flex min-h-[88px] flex-col justify-center rounded-2xl border border-neutral-900 bg-neutral-900 px-5 py-5 text-white active:opacity-90"
        >
          <span className="text-[10px] tracking-wide text-neutral-400">
            {salesContact.label}
          </span>
          <span className="mt-2 text-[15px] font-medium tracking-tight">
            {salesContact.name}
          </span>
          <span className="mt-2 text-2xl font-light tracking-wide">
            {salesContact.phone}
          </span>
        </a>
      </section>

      <section className="mt-4 rounded-2xl border border-neutral-200 bg-white px-4 py-4">
        <h2 className="text-[10px] tracking-wide text-neutral-400">
          事故時の手順
        </h2>
        <ol className="mt-4 space-y-3">
          {accidentSteps.map((step, index) => (
            <li
              key={step}
              className="flex items-start gap-3 rounded-xl border border-neutral-100 px-3 py-3"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-[11px] font-medium text-neutral-700">
                {index + 1}
              </span>
              <span className="pt-1 text-[13px] leading-relaxed text-neutral-800">
                {step}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-4 rounded-2xl border border-neutral-200 bg-white px-4 py-4">
        <h2 className="text-[10px] tracking-wide text-neutral-400">Emergency</h2>
        <p className="mt-1 text-[12px] text-neutral-600">緊急時の連絡先</p>

        <ul className="mt-4 space-y-3">
          {emergencyContacts.map((contact) => (
            <li key={contact.id}>
              <a
                href={`tel:${contact.tel}`}
                className="flex min-h-[72px] flex-col justify-center rounded-2xl border border-neutral-900 bg-neutral-900 px-4 py-4 text-white active:opacity-90"
              >
                <span className="text-[11px] leading-relaxed text-neutral-300">
                  {contact.label}
                </span>
                <span className="mt-1.5 text-xl font-light tracking-wide">
                  {contact.phone}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-4 text-center text-[10px] leading-relaxed text-neutral-400">
        タップで電話を発信します
      </p>

      <footer className="mt-8 text-center text-[10px] tracking-wide text-neutral-300">
        CHJ © 2026
      </footer>
    </main>
  );
}
