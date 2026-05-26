export type LangCode = "en" | "ja" | "zh";

export type ScenarioMode =
  | "car"
  | "school"
  | "restaurant"
  | "travel"
  | "business"
  | "default";

export type MockTranslation = {
  scenarioLabel: string;
  detectedLang: LangCode;
  transcript: string;
  translations: Record<LangCode, string>;
};

export const LANG_LABELS: Record<LangCode, string> = {
  en: "English",
  ja: "Japanese",
  zh: "Chinese",
};

const MOCKS: Record<string, MockTranslation> = {
  default: {
    scenarioLabel: "General",
    detectedLang: "en",
    transcript: "Excuse me, could you help me with this form?",
    translations: {
      en: "Excuse me, could you help me with this form?",
      ja: "すみません、この書類を手伝っていただけますか？",
      zh: "不好意思，可以请您帮我看一下这份表格吗？",
    },
  },
  car: {
    scenarioLabel: "Car Dealer",
    detectedLang: "en",
    transcript: "I would like to schedule a test drive this weekend.",
    translations: {
      en: "I would like to schedule a test drive this weekend.",
      ja: "今週末に試乗の予約をしたいのですが。",
      zh: "我想预约这周末的试驾。",
    },
  },
  school: {
    scenarioLabel: "School",
    detectedLang: "en",
    transcript: "Could you confirm tomorrow's pickup time?",
    translations: {
      en: "Could you confirm tomorrow's pickup time?",
      ja: "明日のお迎え時間を確認させてください。",
      zh: "可以确认一下明天的接送时间吗？",
    },
  },
  restaurant: {
    scenarioLabel: "Restaurant",
    detectedLang: "ja",
    transcript: "予約なしで二人の席はありますか？",
    translations: {
      en: "Do you have a table for two without a reservation?",
      ja: "予約なしで二人の席はありますか？",
      zh: "没有预约的话，有两人位吗？",
    },
  },
  travel: {
    scenarioLabel: "Travel",
    detectedLang: "en",
    transcript: "Which platform should I use for the next train?",
    translations: {
      en: "Which platform should I use for the next train?",
      ja: "次の電車はどのホームですか？",
      zh: "下一班电车应该去哪个站台？",
    },
  },
  business: {
    scenarioLabel: "Business",
    detectedLang: "ja",
    transcript: "署名前に契約条件を確認しましょう。",
    translations: {
      en: "Let's review the contract terms before signing.",
      ja: "署名前に契約条件を確認しましょう。",
      zh: "签署前我们先确认一下合同条款。",
    },
  },
};

export function getMockForMode(mode: string | undefined): MockTranslation {
  if (mode && mode in MOCKS) {
    return MOCKS[mode];
  }
  return MOCKS.default;
}
