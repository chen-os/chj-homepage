export type StudyScheduleEntry = {
  date: string; // YYYY-MM-DD
  events: string[];
};

export const STUDY_MONTH = {
  year: 2026,
  month: 5,
} as const;

export const STUDY_SCHEDULE: StudyScheduleEntry[] = [
  {
    date: "2026-05-11",
    events: [
      "16:30 下校",
      "16:30-17:00 シャワー",
      "17:00-17:30 ご飯",
      "17:30-18:00 piano",
      "18:20-19:00 英検",
      "19:40-21:30 宿題",
      "21:30-22:00 宿題・読書",
    ],
  },
  {
    date: "2026-05-12",
    events: [
      "18:30 部活下校",
      "18:30-19:40 ご飯・piano",
      "19:40-20:10 シャワー",
      "20:20-21:30 宿題",
      "21:30-22:00 宿題・読書",
    ],
  },
  {
    date: "2026-05-13",
    events: [
      "14:50-15:30 下校",
      "15:30-16:10 シャワー",
      "16:20-16:55 piano",
      "17:00-17:30 ご飯",
      "17:40-19:00 宿題",
      "19:30-21:30 英語・国語",
      "21:30-22:00 宿題・読書",
    ],
  },
  {
    date: "2026-05-14",
    events: [
      "18:30 部活下校",
      "18:30-19:40 ご飯・piano",
      "19:40-20:10 シャワー",
      "20:20-21:30 宿題",
      "21:30-22:00 宿題・読書",
    ],
  },
  {
    date: "2026-05-15",
    events: [
      "16:30 下校",
      "16:20-16:50 シャワー",
      "17:00-17:30 ご飯",
      "17:40-19:00 宿題・piano",
      "19:30-21:30 数学・テスト",
      "21:30-22:00 宿題・読書",
    ],
  },
  {
    date: "2026-05-16",
    events: [
      "08:00-11:00 テニス",
      "14:25-15:25 村岡先生",
      "18:00-21:00 OCHABI",
    ],
  },
  {
    date: "2026-05-18",
    events: [
      "16:30 下校",
      "16:30-17:00 シャワー",
      "17:00-17:30 ご飯",
      "17:20-18:00 英検",
      "18:20-19:00 piano",
      "19:30-21:30 理科・社会",
      "21:30-22:00 宿題・読書",
    ],
  },
  {
    date: "2026-05-19",
    events: [
      "18:30 部活下校",
      "18:30-19:40 ご飯・piano",
      "19:40-20:10 シャワー",
      "20:20-21:30 宿題",
      "21:30-22:00 宿題・読書",
    ],
  },
  {
    date: "2026-05-20",
    events: [
      "14:50-15:30 下校",
      "15:30-16:10 シャワー",
      "16:20-16:55 piano",
      "17:00-17:30 ご飯",
      "17:40-19:00 宿題",
      "19:30-21:30 英語・国語",
      "21:30-22:00 宿題・読書",
    ],
  },
  {
    date: "2026-05-21",
    events: [
      "18:30 部活下校",
      "18:30-19:40 ご飯・piano",
      "19:40-20:10 シャワー",
      "20:20-21:30 宿題",
      "21:30-22:00 宿題・読書",
    ],
  },
  {
    date: "2026-05-22",
    events: [
      "16:30 下校",
      "16:20-16:50 シャワー",
      "17:00-17:30 ご飯",
      "17:40-19:00 宿題・piano",
      "19:30-21:30 数学・テスト",
      "21:30-22:00 宿題・読書",
    ],
  },
  {
    date: "2026-05-23",
    events: ["08:00-11:00 テニス", "16:35-18:30 英検試験", "試験休・OCHABI"],
  },
];

export const SCHEDULE_MAP = new Map(
  STUDY_SCHEDULE.map((entry) => [entry.date, entry.events]),
);

const TOKYO_TIME_ZONE = "Asia/Tokyo";

export function toTokyoDateString(date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TOKYO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

export function getSchedule(date: string): string[] | undefined {
  return SCHEDULE_MAP.get(date);
}

export function getTodayOrNextSchedule(date = new Date()): {
  label: "今日の予定" | "次の予定" | "予定なし";
  date?: string;
  events: string[];
} {
  const today = toTokyoDateString(date);
  const todayEvents = getSchedule(today);
  if (todayEvents) {
    return { label: "今日の予定", date: today, events: todayEvents };
  }

  const next = STUDY_SCHEDULE.find((entry) => entry.date >= today);
  if (next) {
    return { label: "次の予定", date: next.date, events: next.events };
  }

  return { label: "予定なし", events: [] };
}

export function getWeekdayJa(dateString: string): string {
  const weekday = new Date(`${dateString}T00:00:00`).getDay();
  return ["日", "月", "火", "水", "木", "金", "土"][weekday] ?? "";
}

