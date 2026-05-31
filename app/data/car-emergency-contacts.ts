export type EmergencyContact = {
  id: string;
  label: string;
  phone: string;
  tel: string;
};

export type SalesContact = {
  label: string;
  name: string;
  phone: string;
  tel: string;
};

export const salesContact: SalesContact = {
  label: "担当営業",
  name: "Shizukuishi Toshiyuki",
  phone: "090-9850-9087",
  tel: "09098509087",
};

export const accidentSteps: string[] = [
  "安全確保",
  "110番通報",
  "現場写真撮影",
  "雫石さんへ連絡",
  "保険会社へ連絡",
];

export const emergencyContacts: EmergencyContact[] = [
  {
    id: "accident-support",
    label: "事故サポートセンター",
    phone: "0120-256-110",
    tel: "0120256110",
  },
  {
    id: "road-assistance",
    label: "ロードアシスタンス専用デスク",
    phone: "0120-365-110",
    tel: "0120365110",
  },
  {
    id: "mb-shinjuku",
    label: "MB新宿",
    phone: "03-3362-7552",
    tel: "0333627552",
  },
  {
    id: "sompo-japan",
    label: "損保ジャパン カスタマーセンター",
    phone: "0120-888-089",
    tel: "0120888089",
  },
];
