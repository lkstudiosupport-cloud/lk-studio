/** Attendance / weekly salary helpers. Weeks are Mon–Sun in Asia/Kolkata (IST). */

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

/** Calendar YYYY-MM-DD in IST for an instant. */
export function istDateString(d = new Date()): string {
  const ist = new Date(d.getTime() + IST_OFFSET_MS);
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, "0");
  const day = String(ist.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse YYYY-MM-DD into a UTC-midnight Date suitable for Prisma @db.Date. */
export function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (!Number.isFinite(y) || m < 0 || m > 11 || day < 1 || day > 31) return null;
  const d = new Date(Date.UTC(y, m, day));
  if (d.getUTCFullYear() !== y || d.getUTCMonth() !== m || d.getUTCDate() !== day) return null;
  return d;
}

export function formatDateOnly(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/** Monday 00:00 UTC of the IST calendar week containing `d` (or date-only string). */
export function mondayOfWeekIst(d: Date | string = new Date()): Date {
  const dateStr = typeof d === "string" ? d : istDateString(d);
  const base = parseDateOnly(dateStr);
  if (!base) throw new Error("Invalid date");
  // Treat date-only as IST calendar day; weekday via UTC components.
  const dow = base.getUTCDay(); // 0 Sun … 6 Sat
  const daysFromMon = (dow + 6) % 7;
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() - daysFromMon));
}

export function sundayOfWeekIst(weekStart: Date): Date {
  return new Date(
    Date.UTC(weekStart.getUTCFullYear(), weekStart.getUTCMonth(), weekStart.getUTCDate() + 6)
  );
}

/** Exclusive end (Monday + 7 days) for range queries. */
export function weekExclusiveEnd(weekStart: Date): Date {
  return new Date(
    Date.UTC(weekStart.getUTCFullYear(), weekStart.getUTCMonth(), weekStart.getUTCDate() + 7)
  );
}

export function defaultOvertimeRate(dailyWage: number): number {
  if (!Number.isFinite(dailyWage) || dailyWage <= 0) return 0;
  return Math.round((dailyWage / 8) * 100) / 100;
}

export function computeSalaryAmount(input: {
  presentDays: number;
  dailyWage: number;
  overtimeHours: number;
  overtimeRate: number;
}): number {
  const daysPay = Math.max(0, input.presentDays) * Math.max(0, input.dailyWage);
  const otPay = Math.max(0, input.overtimeHours) * Math.max(0, input.overtimeRate);
  return Math.round((daysPay + otPay) * 100) / 100;
}

export function buildSalaryInvoiceNumber(shopCode: string, weekStart: Date, serial: number): string {
  const code = (shopCode || "SHOP").replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase() || "SHOP";
  const y = weekStart.getUTCFullYear();
  const m = String(weekStart.getUTCMonth() + 1).padStart(2, "0");
  const day = String(weekStart.getUTCDate()).padStart(2, "0");
  return `SAL-${code}-${y}${m}${day}-${serial}`;
}

export function formatWeekLabel(weekStart: Date, weekEnd: Date, locale = "en-IN"): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  return `${fmt(weekStart)} – ${fmt(weekEnd)}`;
}

export type SalaryInvoiceShareInput = {
  shopName: string;
  staffNo: number;
  staffName: string;
  invoiceNumber: string;
  weekStart: Date;
  weekEnd: Date;
  presentDays: number;
  overtimeHours: number;
  dailyWage: number;
  overtimeRate: number;
  amount: number;
};

export function buildSalaryInvoiceWhatsAppText(inv: SalaryInvoiceShareInput): string {
  const week = formatWeekLabel(inv.weekStart, inv.weekEnd);
  const daysPay = Math.round(inv.presentDays * inv.dailyWage * 100) / 100;
  const otPay = Math.round(inv.overtimeHours * inv.overtimeRate * 100) / 100;
  return [
    `*${inv.shopName}* — Salary invoice`,
    `Invoice: ${inv.invoiceNumber}`,
    `Worker #${inv.staffNo}: ${inv.staffName}`,
    `Week: ${week}`,
    `Present days: ${inv.presentDays} × ₹${inv.dailyWage.toFixed(2)} = ₹${daysPay.toFixed(2)}`,
    `Overtime: ${inv.overtimeHours}h × ₹${inv.overtimeRate.toFixed(2)}/hr = ₹${otPay.toFixed(2)}`,
    `*Total: ₹${inv.amount.toFixed(2)}*`,
  ].join("\n");
}
