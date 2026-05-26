import Link from "next/link";

const SCENARIOS = [
  { label: "Car Dealer", mode: "car" },
  { label: "School", mode: "school" },
  { label: "Restaurant", mode: "restaurant" },
  { label: "Travel", mode: "travel" },
  { label: "Business", mode: "business" },
] as const;

export default function Home() {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col bg-white px-6 pb-8 pt-[max(2rem,env(safe-area-inset-top))] sm:max-w-lg">
      <div className="flex flex-1 flex-col justify-center">
        <p className="text-[11px] font-medium tracking-[0.28em] text-neutral-400">
          CHJ
        </p>
        <h1 className="mt-4 text-[1.75rem] font-light leading-tight tracking-tight text-neutral-900 sm:text-3xl">
          AI Voice Translator
        </h1>
        <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-neutral-500">
          Natural real-time translation for daily life in Japan.
        </p>

        <Link
          href="/translate"
          className="mt-8 inline-flex w-full items-center justify-center rounded-lg border border-neutral-900 bg-neutral-900 px-6 py-3.5 text-[13px] font-medium tracking-wide text-white sm:w-auto sm:min-w-[220px]"
        >
          Start Conversation
        </Link>

        <p className="mt-6 text-[12px] tracking-wide text-neutral-400">
          Chinese ⇄ Japanese ⇄ English
        </p>
      </div>

      <section className="mt-10 border-t border-neutral-100 pt-8">
        <p className="text-[10px] font-medium tracking-[0.2em] text-neutral-400">
          QUICK SCENARIOS
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {SCENARIOS.map((item) => (
            <li key={item.mode}>
              <Link
                href={`/translate?mode=${item.mode}`}
                className="inline-block rounded-full border border-neutral-200 px-4 py-2 text-[12px] text-neutral-700 transition-colors hover:border-neutral-400 hover:text-neutral-900"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-12 text-center text-[10px] tracking-wide text-neutral-300">
        CHJ © 2026
      </footer>
    </main>
  );
}
