import Link from "next/link";
import { getSchedule, getWeekdayJa } from "../../data/study-schedule";

type ScheduleDetailPageProps = {
  params: Promise<{ date: string }>;
};

function isDateFormatValid(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

export default async function ScheduleDetailPage({
  params,
}: ScheduleDetailPageProps) {
  const { date } = await params;
  const valid = isDateFormatValid(date);
  const events = valid ? getSchedule(date) : undefined;

  return (
    <main className="mx-auto min-h-[100dvh] max-w-md bg-neutral-50 px-4 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))] sm:max-w-lg sm:px-6">
      <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <Link
          href="/"
          className="text-[11px] tracking-wide text-neutral-500 hover:text-neutral-700"
        >
          ← Dashboard
        </Link>

        <h1 className="mt-4 text-lg font-medium text-neutral-900">日別予定</h1>
        {valid ? (
          <p className="mt-1 text-[12px] text-neutral-500">
            {date}（{getWeekdayJa(date)}）
          </p>
        ) : (
          <p className="mt-1 text-[12px] text-neutral-500">日付形式エラー</p>
        )}

        {events && events.length > 0 ? (
          <ul className="mt-4 space-y-2 border-t border-neutral-100 pt-4">
            {events.map((event) => (
              <li key={event} className="text-[12px] leading-relaxed text-neutral-700">
                {event}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 border-t border-neutral-100 pt-4 text-[12px] text-neutral-400">
            この日の予定はありません。
          </p>
        )}
      </div>
    </main>
  );
}
