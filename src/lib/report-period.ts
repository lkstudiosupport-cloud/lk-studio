export type ReportMode = "week" | "month";

export type ReportRange = {
  mode: ReportMode;
  period: string;
  start: Date;
  end: Date;
};

export function currentWeekValue(d = new Date()) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 4 - (date.getDay() || 7));
  const yearStart = new Date(date.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function currentMonthValue(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function isoWeekStart(year: number, week: number) {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const start = new Date(simple);
  if (dow <= 4) start.setDate(simple.getDate() - simple.getDay() + 1);
  else start.setDate(simple.getDate() + 8 - simple.getDay());
  start.setHours(0, 0, 0, 0);
  return start;
}

export function weekRangeFromValue(value: string): { start: Date; end: Date } | null {
  const match = /^(\d{4})-W(\d{1,2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  if (!Number.isFinite(year) || week < 1 || week > 53) return null;

  const start = isoWeekStart(year, week);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

export function monthRangeFromValue(value: string): { start: Date; end: Date } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  if (!Number.isFinite(year) || month < 0 || month > 11) return null;

  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 1, 0, 0, 0, 0);
  return { start, end };
}

export function resolveReportRange(
  mode: ReportMode,
  period: string | undefined,
  now = new Date()
): ReportRange {
  if (mode === "week") {
    const value = period && weekRangeFromValue(period) ? period : currentWeekValue(now);
    const range = weekRangeFromValue(value)!;
    return { mode: "week", period: value, ...range };
  }

  const value = period && monthRangeFromValue(period) ? period : currentMonthValue(now);
  const range = monthRangeFromValue(value)!;
  return { mode: "month", period: value, ...range };
}

export function formatRangeLabel(mode: ReportMode, start: Date, end: Date, locale = "en-IN") {
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    d.toLocaleDateString(locale, opts);

  if (mode === "month") {
    return fmt(start, { month: "long", year: "numeric" });
  }

  const lastDay = new Date(end);
  lastDay.setDate(lastDay.getDate() - 1);
  return `${fmt(start, { day: "numeric", month: "short", year: "numeric" })} – ${fmt(lastDay, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}
