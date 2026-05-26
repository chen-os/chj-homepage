"use client";

import { useCallback, useState } from "react";

const REMINDER =
  "上海へ戻る前に、東京でVPN / VPS環境を事前に構築しておく";

export function TravelReadiness() {
  const [done, setDone] = useState(false);

  const toggle = useCallback(() => {
    setDone((prev) => !prev);
  }, []);

  const reset = useCallback(() => {
    setDone(false);
  }, []);

  return (
    <section className="rounded-2xl border border-neutral-300/80 bg-neutral-50/90 px-4 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <span className="inline-block rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[9px] font-medium tracking-[0.08em] text-neutral-500">
            固定
          </span>
          <h2 className="mt-1.5 text-[13px] font-medium tracking-wide text-neutral-900">
            出発前リマインダー
          </h2>
          <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-400">
            次回、東京から上海へ行く前に確認すること
          </p>
        </div>
        <p className="shrink-0 text-[10px] tabular-nums text-neutral-400">
          {done ? 1 : 0}/1
        </p>
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-neutral-100 bg-white px-3 py-2.5 transition-colors hover:border-neutral-200">
        <input
          type="checkbox"
          checked={done}
          onChange={toggle}
          className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-400"
        />
        <span
          className={`text-[11px] leading-relaxed ${
            done ? "text-neutral-400 line-through" : "text-neutral-600"
          }`}
        >
          {REMINDER}
        </span>
      </label>

      <button
        type="button"
        onClick={reset}
        className="mt-3 w-full rounded-lg border border-neutral-200 bg-white py-1.5 text-[11px] tracking-wide text-neutral-500 transition-colors hover:border-neutral-300 hover:text-neutral-700"
      >
        リセット
      </button>
    </section>
  );
}
