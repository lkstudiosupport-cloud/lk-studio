"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsePhone } from "@/lib/phone";
import {
  buildSalaryInvoiceNumber,
  buildSalaryInvoiceWhatsAppText,
  computeSalaryAmount,
  defaultOvertimeRate,
  formatDateOnly,
  istDateString,
  mondayOfWeekIst,
  parseDateOnly,
  sundayOfWeekIst,
  weekExclusiveEnd,
} from "@/lib/shop-attendance";

export type StaffRow = {
  id: string;
  staffNo: number;
  name: string;
  phone: string;
  dailyWage: number;
  overtimeRatePerHour: number;
  active: boolean;
  createdAt: string;
};

export type AttendanceRow = {
  staffId: string;
  present: boolean;
  overtimeHours: number;
  note: string | null;
};

export type SalaryInvoiceRow = {
  id: string;
  invoiceNumber: string;
  staffId: string;
  staffNo: number;
  staffName: string;
  staffPhone: string;
  weekStart: string;
  weekEnd: string;
  presentDays: number;
  overtimeHours: number;
  dailyWage: number;
  overtimeRate: number;
  amount: number;
  status: string;
  createdAt: string;
  shareText: string;
};

function revalidateAttendance() {
  revalidatePath("/shop/attendance");
}

function requireShopId() {
  return requireSession(["SHOP"]).then((s) => {
    if (!s?.shopId) throw new Error("Shop session required");
    return s.shopId;
  });
}

function parseMoney(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : Number(String(raw ?? "").trim());
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

function toStaffRow(r: {
  id: string;
  staffNo: number;
  name: string;
  phone: string;
  dailyWage: number;
  overtimeRatePerHour: number;
  active: boolean;
  createdAt: Date;
}): StaffRow {
  return {
    id: r.id,
    staffNo: r.staffNo,
    name: r.name,
    phone: r.phone,
    dailyWage: r.dailyWage,
    overtimeRatePerHour: r.overtimeRatePerHour,
    active: r.active,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function listShopStaff(includeInactive = false): Promise<StaffRow[]> {
  const shopId = await requireShopId();
  const rows = await prisma.shopStaff.findMany({
    where: includeInactive ? { shopId } : { shopId, active: true },
    orderBy: [{ active: "desc" }, { staffNo: "asc" }],
  });
  return rows.map(toStaffRow);
}

export async function upsertShopStaff(input: {
  id?: string;
  name: string;
  phone: string;
  dailyWage: number;
  overtimeRatePerHour?: number | null;
}): Promise<{ ok: true; staff: StaffRow } | { ok: false; error: string }> {
  const shopId = await requireShopId();
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Name is required" };

  const parsed = parsePhone(input.phone);
  if (!parsed) return { ok: false, error: "Enter a valid phone number" };

  const dailyWage = parseMoney(input.dailyWage);
  if (dailyWage == null || dailyWage <= 0) return { ok: false, error: "Daily wage must be greater than 0" };

  let ot = input.overtimeRatePerHour != null ? parseMoney(input.overtimeRatePerHour) : null;
  if (ot == null || ot <= 0) ot = defaultOvertimeRate(dailyWage);

  if (input.id) {
    const existing = await prisma.shopStaff.findFirst({ where: { id: input.id, shopId } });
    if (!existing) return { ok: false, error: "Staff not found" };
    const updated = await prisma.shopStaff.update({
      where: { id: existing.id },
      data: {
        name,
        phone: parsed.e164,
        dailyWage,
        overtimeRatePerHour: ot,
      },
    });
    revalidateAttendance();
    return { ok: true, staff: toStaffRow(updated) };
  }

  const maxNo = await prisma.shopStaff.aggregate({
    where: { shopId },
    _max: { staffNo: true },
  });
  const staffNo = (maxNo._max.staffNo ?? 0) + 1;

  const created = await prisma.shopStaff.create({
    data: {
      shopId,
      staffNo,
      name,
      phone: parsed.e164,
      dailyWage,
      overtimeRatePerHour: ot,
    },
  });
  revalidateAttendance();
  return { ok: true, staff: toStaffRow(created) };
}

export async function setShopStaffActive(
  staffId: string,
  active: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const shopId = await requireShopId();
  const existing = await prisma.shopStaff.findFirst({ where: { id: staffId, shopId } });
  if (!existing) return { ok: false, error: "Staff not found" };
  await prisma.shopStaff.update({ where: { id: staffId }, data: { active } });
  revalidateAttendance();
  return { ok: true };
}

export async function getAttendanceForDate(dateStr?: string): Promise<{
  date: string;
  rows: (StaffRow & { present: boolean; overtimeHours: number; note: string | null })[];
}> {
  const shopId = await requireShopId();
  const date = parseDateOnly(dateStr?.trim() || istDateString()) ?? parseDateOnly(istDateString())!;
  const dateKey = formatDateOnly(date);

  const [staff, attendance] = await Promise.all([
    prisma.shopStaff.findMany({
      where: { shopId, active: true },
      orderBy: { staffNo: "asc" },
    }),
    prisma.shopAttendance.findMany({
      where: { shopId, date },
    }),
  ]);

  const byStaff = new Map(attendance.map((a) => [a.staffId, a]));

  return {
    date: dateKey,
    rows: staff.map((s) => {
      const a = byStaff.get(s.id);
      return {
        ...toStaffRow(s),
        present: a?.present ?? false,
        overtimeHours: a?.overtimeHours ?? 0,
        note: a?.note ?? null,
      };
    }),
  };
}

export async function saveAttendanceForDate(input: {
  date: string;
  entries: { staffId: string; present: boolean; overtimeHours: number; note?: string }[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const shopId = await requireShopId();
  const date = parseDateOnly(input.date);
  if (!date) return { ok: false, error: "Invalid date" };

  const staffIds = input.entries.map((e) => e.staffId);
  const owned = await prisma.shopStaff.findMany({
    where: { shopId, id: { in: staffIds } },
    select: { id: true },
  });
  const ownedSet = new Set(owned.map((s) => s.id));

  await prisma.$transaction(
    input.entries
      .filter((e) => ownedSet.has(e.staffId))
      .map((e) => {
        const overtimeHours = Math.max(0, Number(e.overtimeHours) || 0);
        const note = e.note?.trim() || null;
        return prisma.shopAttendance.upsert({
          where: { staffId_date: { staffId: e.staffId, date } },
          create: {
            shopId,
            staffId: e.staffId,
            date,
            present: Boolean(e.present),
            overtimeHours,
            note,
          },
          update: {
            present: Boolean(e.present),
            overtimeHours,
            note,
          },
        });
      })
  );

  revalidateAttendance();
  return { ok: true };
}

function toInvoiceRow(
  inv: {
    id: string;
    invoiceNumber: string;
    staffId: string;
    weekStart: Date;
    weekEnd: Date;
    presentDays: number;
    overtimeHours: number;
    dailyWage: number;
    overtimeRate: number;
    amount: number;
    status: string;
    createdAt: Date;
    staff: { staffNo: number; name: string; phone: string };
  },
  shopName: string
): SalaryInvoiceRow {
  return {
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    staffId: inv.staffId,
    staffNo: inv.staff.staffNo,
    staffName: inv.staff.name,
    staffPhone: inv.staff.phone,
    weekStart: formatDateOnly(inv.weekStart),
    weekEnd: formatDateOnly(inv.weekEnd),
    presentDays: inv.presentDays,
    overtimeHours: inv.overtimeHours,
    dailyWage: inv.dailyWage,
    overtimeRate: inv.overtimeRate,
    amount: inv.amount,
    status: inv.status,
    createdAt: inv.createdAt.toISOString(),
    shareText: buildSalaryInvoiceWhatsAppText({
      shopName,
      staffNo: inv.staff.staffNo,
      staffName: inv.staff.name,
      invoiceNumber: inv.invoiceNumber,
      weekStart: inv.weekStart,
      weekEnd: inv.weekEnd,
      presentDays: inv.presentDays,
      overtimeHours: inv.overtimeHours,
      dailyWage: inv.dailyWage,
      overtimeRate: inv.overtimeRate,
      amount: inv.amount,
    }),
  };
}

export async function listSalaryInvoices(weekStartStr?: string): Promise<{
  weekStart: string;
  weekEnd: string;
  invoices: SalaryInvoiceRow[];
}> {
  const shopId = await requireShopId();
  const weekStart = mondayOfWeekIst(weekStartStr?.trim() || istDateString());
  const weekEnd = sundayOfWeekIst(weekStart);

  const [shop, invoices] = await Promise.all([
    prisma.shopProfile.findUnique({ where: { id: shopId }, select: { shopName: true } }),
    prisma.shopSalaryInvoice.findMany({
      where: { shopId, weekStart },
      include: { staff: { select: { staffNo: true, name: true, phone: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const shopName = shop?.shopName ?? "Shop";
  return {
    weekStart: formatDateOnly(weekStart),
    weekEnd: formatDateOnly(weekEnd),
    invoices: invoices.map((inv) => toInvoiceRow(inv, shopName)),
  };
}

export async function generateWeeklySalaryInvoices(weekStartStr?: string): Promise<
  | { ok: true; created: number; skipped: number; invoices: SalaryInvoiceRow[] }
  | { ok: false; error: string }
> {
  const shopId = await requireShopId();
  const weekStart = mondayOfWeekIst(weekStartStr?.trim() || istDateString());
  const weekEnd = sundayOfWeekIst(weekStart);
  const rangeEnd = weekExclusiveEnd(weekStart);

  const [shop, staff, attendance, existing] = await Promise.all([
    prisma.shopProfile.findUnique({
      where: { id: shopId },
      select: { shopName: true, shopCode: true },
    }),
    prisma.shopStaff.findMany({ where: { shopId, active: true }, orderBy: { staffNo: "asc" } }),
    prisma.shopAttendance.findMany({
      where: {
        shopId,
        date: { gte: weekStart, lt: rangeEnd },
      },
    }),
    prisma.shopSalaryInvoice.findMany({
      where: { shopId, weekStart },
      select: { staffId: true },
    }),
  ]);

  const existingSet = new Set(existing.map((e) => e.staffId));
  const byStaff = new Map<string, typeof attendance>();
  for (const row of attendance) {
    const list = byStaff.get(row.staffId) ?? [];
    list.push(row);
    byStaff.set(row.staffId, list);
  }

  const shopName = shop?.shopName ?? "Shop";
  const shopCode = shop?.shopCode ?? "SHOP";
  let created = 0;
  let skipped = 0;
  let nextSerial = (await prisma.shopSalaryInvoice.count({ where: { shopId } })) + 1;

  for (const s of staff) {
    if (existingSet.has(s.id)) {
      skipped += 1;
      continue;
    }
    const rows = byStaff.get(s.id) ?? [];
    const presentDays = rows.filter((r) => r.present).length;
    const overtimeHours =
      Math.round(rows.reduce((sum, r) => sum + (r.overtimeHours || 0), 0) * 100) / 100;
    if (presentDays <= 0 && overtimeHours <= 0) continue;

    const dailyWage = s.dailyWage;
    const overtimeRate = s.overtimeRatePerHour > 0 ? s.overtimeRatePerHour : defaultOvertimeRate(dailyWage);
    const amount = computeSalaryAmount({ presentDays, dailyWage, overtimeHours, overtimeRate });

    const invoiceNumber = buildSalaryInvoiceNumber(shopCode, weekStart, nextSerial);
    nextSerial += 1;

    try {
      await prisma.shopSalaryInvoice.create({
        data: {
          shopId,
          staffId: s.id,
          weekStart,
          weekEnd,
          presentDays,
          overtimeHours,
          dailyWage,
          overtimeRate,
          amount,
          invoiceNumber,
        },
      });
      created += 1;
    } catch {
      // Unique race on staffId+weekStart or invoiceNumber — treat as skip
      skipped += 1;
    }
  }

  const invoices = await prisma.shopSalaryInvoice.findMany({
    where: { shopId, weekStart },
    include: { staff: { select: { staffNo: true, name: true, phone: true } } },
    orderBy: { createdAt: "desc" },
  });

  revalidateAttendance();
  return {
    ok: true,
    created,
    skipped,
    invoices: invoices.map((inv) => toInvoiceRow(inv, shopName)),
  };
}

export async function markSalaryInvoiceShared(
  invoiceId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const shopId = await requireShopId();
  const inv = await prisma.shopSalaryInvoice.findFirst({ where: { id: invoiceId, shopId } });
  if (!inv) return { ok: false, error: "Invoice not found" };
  if (inv.status === "GENERATED") {
    await prisma.shopSalaryInvoice.update({
      where: { id: invoiceId },
      data: { status: "SHARED" },
    });
    revalidateAttendance();
  }
  return { ok: true };
}
