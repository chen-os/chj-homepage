export type IdentityCategory =
  | "証明書"
  | "銀行"
  | "クレジットカード"
  | "携帯"
  | "メール"
  | "その他";

export type IdentityRecord = {
  id: string;
  category: IdentityCategory;
  displayName: string;
  accountName: string;
  kanaName: string;
  email: string;
  note: string;
};

/** Mock data — replace with local JSON or Supabase later. No sensitive fields. */
export const identityRecords: IdentityRecord[] = [
  {
    id: "id-residence",
    category: "証明書",
    displayName: "在留カード",
    accountName: "CHEN JIANGHUA",
    kanaName: "チン コウカ",
    email: "",
    note: "更新時は入管へ予約",
  },
  {
    id: "id-passport",
    category: "証明書",
    displayName: "パスポート",
    accountName: "CHEN JIANGHUA",
    kanaName: "",
    email: "",
    note: "旅券番号は別管理",
  },
  {
    id: "bank-smith",
    category: "銀行",
    displayName: "三井住友銀行",
    accountName: "CHEN JIANGHUA",
    kanaName: "チン コウカ",
    email: "chen@example.com",
    note: "給与振込口座",
  },
  {
    id: "bank-paypay",
    category: "銀行",
    displayName: "PayPay銀行",
    accountName: "CHEN JIANGHUA",
    kanaName: "チン コウカ",
    email: "chen.paypay@example.com",
    note: "日常支払い",
  },
  {
    id: "card-paypay",
    category: "クレジットカード",
    displayName: "PayPayカード",
    accountName: "CHEN JIANGHUA",
    kanaName: "チン コウカ",
    email: "chen@example.com",
    note: "本人名義",
  },
  {
    id: "card-rakuten",
    category: "クレジットカード",
    displayName: "楽天カード",
    accountName: "CHEN JIANGHUA",
    kanaName: "チン コウカ",
    email: "chen.rakuten@example.com",
    note: "",
  },
  {
    id: "mobile-docomo",
    category: "携帯",
    displayName: "docomo",
    accountName: "CHEN JIANGHUA",
    kanaName: "チン コウカ",
    email: "",
    note: "契約者名義",
  },
  {
    id: "email-main",
    category: "メール",
    displayName: "メイン Gmail",
    accountName: "CHEN JIANGHUA",
    kanaName: "",
    email: "chen.main@example.com",
    note: "行政・学校連絡用",
  },
  {
    id: "other-amazon",
    category: "その他",
    displayName: "Amazon",
    accountName: "CHEN JIANGHUA",
    kanaName: "チン コウカ",
    email: "chen.amazon@example.com",
    note: "配送名義",
  },
];

export const identityCategories: IdentityCategory[] = [
  "証明書",
  "銀行",
  "クレジットカード",
  "携帯",
  "メール",
  "その他",
];

export function groupIdentityRecordsByCategory(
  records: IdentityRecord[],
): Array<{ category: IdentityCategory; items: IdentityRecord[] }> {
  return identityCategories
    .map((category) => ({
      category,
      items: records.filter((record) => record.category === category),
    }))
    .filter((group) => group.items.length > 0);
}
