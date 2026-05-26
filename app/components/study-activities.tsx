import Link from "next/link";
import {
  STUDY_MONTH,
  SCHEDULE_MAP,
  getTodayOrNextSchedule,
  getWeekdayJa,
} from "../data/study-schedule";

const WEEK_DAYS = ["日", "月", "火", "水", "木", "金", "土"];

function buildCalendarDays(year: number, month: number): Array<number | null> {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: Array<number | null> = Array.from({ length: firstDay }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }
  return cells;
}

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function StudyActivities() {
  const current = getTodayOrNextSchedule();
  const calendarDays = buildCalendarDays(STUDY_MONTH.year, STUDY_MONTH.month);

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-[12px] font-medium text-neutral-900">{current.label}</h3>
        {current.date ? (
          <p className="mt-1 text-[11px] text-neutral-500">
            {current.date}（{getWeekdayJa(current.date)}）
          </p>
        ) : null}
        {current.events.length > 0 ? (
          <ul className="mt-3 space-y-1 rounded-xl border border-neutral-100 p-3">
            {current.events.map((event) => (
              <li key={event} className="text-[11px] leading-relaxed text-neutral-600">
                {event}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-[11px] text-neutral-400">予定なし</p>
        )}
      </section>

      <section className="border-t border-neutral-100 pt-5">
        <h3 className="text-[12px] font-medium text-neutral-900">5月カレンダー</h3>
        <div className="mt-3 grid grid-cols-7 gap-1">
          {WEEK_DAYS.map((day) => (
            <span
              key={day}
              className="text-center text-[10px] font-medium text-neutral-400"
            >
              {day}
            </span>
          ))}

          {calendarDays.map((day, index) => {
            if (!day) {
              return <span key={`empty-${index}`} className="h-8 rounded-md" />;
            }

            const dateKey = toDateKey(STUDY_MONTH.year, STUDY_MONTH.month, day);
            const hasSchedule = SCHEDULE_MAP.has(dateKey);
            const baseClass =
              "flex h-8 items-center justify-center rounded-md border text-[11px]";

            if (!hasSchedule) {
              return (
                <span
                  key={dateKey}
                  className={`${baseClass} border-neutral-100 text-neutral-300`}
                >
                  {day}
                </span>
              );
            }

            return (
              <Link
                key={dateKey}
                href={`/schedule/${dateKey}`}
                className={`${baseClass} border-neutral-300 text-neutral-800 hover:bg-neutral-50`}
              >
                {day}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
