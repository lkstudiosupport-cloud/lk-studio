import type { WorkerPartnerDurationType } from "@prisma/client";

export const WORKER_PARTNER_DURATION_TYPES: WorkerPartnerDurationType[] = [
  "ONE_DAY",
  "TWO_DAYS",
  "CUSTOM_DAYS",
];

export function workerPartnerDurationLabelKey(type: WorkerPartnerDurationType): string {
  const map: Record<WorkerPartnerDurationType, string> = {
    ONE_DAY: "workerPartnerDuration.oneDay",
    TWO_DAYS: "workerPartnerDuration.twoDays",
    CUSTOM_DAYS: "workerPartnerDuration.customDays",
  };
  return map[type];
}

export function parseWorkerPartnerDurationType(
  raw: string | null | undefined
): WorkerPartnerDurationType | null {
  const u = raw?.trim().toUpperCase();
  if (u === "ONE_DAY" || u === "TWO_DAYS" || u === "CUSTOM_DAYS") return u;
  return null;
}

export function workerPartnerDayCount(
  durationType: WorkerPartnerDurationType,
  customDays: number | null
): number {
  if (durationType === "ONE_DAY") return 1;
  if (durationType === "TWO_DAYS") return 2;
  return customDays ?? 1;
}

export function workerPartnerEndDate(
  neededFrom: Date,
  durationType: WorkerPartnerDurationType,
  customDays: number | null
): Date {
  const days = workerPartnerDayCount(durationType, customDays);
  const end = new Date(neededFrom);
  end.setUTCDate(end.getUTCDate() + days - 1);
  return end;
}

/** YYYY-MM-DD for <input type="date" min> — today in local time. */
export function todayDateInputValue(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseNeededFromDate(raw: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
  if (!m) throw new Error("Select a date");
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (Number.isNaN(date.getTime())) throw new Error("Select a valid date");
  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  if (date.getTime() < todayUtc) throw new Error("Date cannot be in the past");
  return date;
}

export function formatWorkerPartnerSchedule(
  neededFrom: Date,
  durationType: WorkerPartnerDurationType,
  customDays: number | null,
  locale: string
): string {
  const days = workerPartnerDayCount(durationType, customDays);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  const from = neededFrom.toLocaleDateString(locale, { ...opts, timeZone: "UTC" });
  if (days === 1) return from;
  const end = workerPartnerEndDate(neededFrom, durationType, customDays);
  const to = end.toLocaleDateString(locale, { ...opts, timeZone: "UTC" });
  return `${from} — ${to} (${days} days)`;
}
