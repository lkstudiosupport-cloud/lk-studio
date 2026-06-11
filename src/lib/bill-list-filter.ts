import type { Prisma } from "@prisma/client";
import {
  monthRangeFromValue,
  currentMonthValue,
} from "@/lib/report-period";

export { currentMonthValue };

export type BillsTab = "all" | "pending" | "paid";
export type BillsDateMode = "month" | "day";

export function currentDayValue(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function dayRangeFromValue(value: string): { start: Date; end: Date } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (!Number.isFinite(year) || month < 0 || month > 11 || day < 1 || day > 31) return null;

  const start = new Date(year, month, day, 0, 0, 0, 0);
  const end = new Date(year, month, day + 1, 0, 0, 0, 0);
  if (start.getMonth() !== month) return null;
  return { start, end };
}

export function resolveBillsListFilter(
  tabRaw: string | undefined,
  modeRaw: string | undefined,
  periodRaw: string | undefined,
  now = new Date()
) {
  const tab: BillsTab =
    tabRaw === "pending" || tabRaw === "paid" ? tabRaw : "all";
  const mode: BillsDateMode = modeRaw === "day" ? "day" : "month";

  let period = periodRaw?.trim() ?? "";
  if (tab === "paid") {
    if (mode === "day") {
      period = period && dayRangeFromValue(period) ? period : currentDayValue(now);
    } else {
      period = period && monthRangeFromValue(period) ? period : currentMonthValue(now);
    }
  }

  return { tab, mode, period };
}

export function billsDateRange(mode: BillsDateMode, period: string) {
  return mode === "day" ? dayRangeFromValue(period) : monthRangeFromValue(period);
}

export function formatBillsPeriodLabel(
  mode: BillsDateMode,
  period: string,
  locale = "en-IN"
) {
  const range = billsDateRange(mode, period);
  if (!range) return period;

  if (mode === "month") {
    return range.start.toLocaleDateString(locale, { month: "long", year: "numeric" });
  }

  return range.start.toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Prisma filter for shop bills list. */
export function shopBillsWhere(
  shopId: string,
  tab: BillsTab,
  mode: BillsDateMode,
  period: string
): Prisma.BillWhereInput {
  const where: Prisma.BillWhereInput = { shopId };

  if (tab === "paid") {
    where.paid = true;
    const range = billsDateRange(mode, period);
    if (range) {
      where.OR = [
        { paidAt: { gte: range.start, lt: range.end } },
        {
          paidAt: null,
          createdAt: { gte: range.start, lt: range.end },
        },
      ];
    }
  } else if (tab === "pending") {
    where.paid = false;
  }

  return where;
}
