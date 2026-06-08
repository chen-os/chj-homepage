export const ALPHA_NA_LABEL = "N/A";

export function formatSignedDelta(value: number, suffix = ""): string {
  const rounded = Math.round(value);
  if (rounded > 0) return `+${rounded}${suffix}`;
  if (rounded < 0) return `${rounded}${suffix}`;
  return `0${suffix}`;
}

export function formatConvictionChangeLabel(change: number): string {
  return formatSignedDelta(change, " (7D)");
}

export function formatIncreaseLabel(change: number): string {
  return formatSignedDelta(change);
}

export function formatPercentChange(rate: number | null): string {
  if (rate === null) return ALPHA_NA_LABEL;
  const rounded = Math.round(rate * 10) / 10;
  if (rounded > 0) return `+${rounded.toFixed(1)}%`;
  if (rounded < 0) return `${rounded.toFixed(1)}%`;
  return "0.0%";
}

export function formatBacktestPercent(value: number | null): string {
  return formatPercentChange(value);
}
