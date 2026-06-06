const MOJIBAKE_REPLACEMENTS: Array<[string, string]> = [
  ["鈥檚", "'s"],
  ["鈥檝", "'ve"],
  ["鈥檒", "'ll"],
  ["鈥檙e", "'re"],
  ["鈥檛", "'t"],
  ["鈥檓", "'m"],
  ["鈥檇", "'d"],
  ["鈥", "'"],
  ["\u2019", "'"],
  ["\u2018", "'"],
  ["\u201C", '"'],
  ["\u201D", '"'],
  ["\u2014", "\u2014"],
  ["\u2013", "\u2013"],
  ["\u2026", "\u2026"],
  ["\u00E2\u20AC\u2122", "'"],
  ["\u00E2\u20AC\u02DC", "'"],
  ["\u00E2\u20AC\u0153", '"'],
  ["\u00E2\u20AC\u009D", '"'],
  ["\u00E2\u20AC\u201D", "\u2014"],
  ["\u00E2\u20AC\u201C", "\u2013"],
  ["\u00C3\u00A9", "\u00E9"],
  ["\u00C3\u00A8", "\u00E8"],
  ["\u00C3\u00A0", "\u00E0"],
  ["\u00C3\u00A2", "\u00E2"],
  ["\u00C3\u00AE", "\u00EE"],
  ["\u00C3\u00B4", "\u00F4"],
  ["\u00C3\u00BC", "\u00FC"],
  ["\u00C3\u00B1", "\u00F1"],
];

export function normalizeText(text: string): string {
  if (!text) return "";

  let result = text;

  for (const [bad, good] of MOJIBAKE_REPLACEMENTS) {
    if (bad) {
      result = result.split(bad).join(good);
    }
  }

  if (/[\u0080-\u00ff]|鈥|\u00E2/.test(result)) {
    try {
      const decoded = Buffer.from(result, "latin1").toString("utf8");
      if (!decoded.includes("\uFFFD")) {
        result = decoded;
        for (const [bad, good] of MOJIBAKE_REPLACEMENTS) {
          if (bad) {
            result = result.split(bad).join(good);
          }
        }
      }
    } catch {
      // keep best-effort replacements
    }
  }

  return result.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}
