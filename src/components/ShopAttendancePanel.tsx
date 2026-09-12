"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Calendar, MessageCircle, Pencil, UserPlus, Eye } from "lucide-react";
import { t } from "@/lib/i18n";
import { useShopShell } from "@/components/ShopShellProvider";
import { PageLoadingSkeleton } from "@/components/PageLoadingSkeleton";
import { formatMoney } from "@/lib/bill-items";
import { openWhatsApp } from "@/lib/whatsapp";
import { preloadBillCaptureLib, shareSalaryInvoiceImage } from "@/lib/share-salary-invoice";
import { SalaryInvoiceReceipt } from "@/components/SalaryInvoiceReceipt";
import {
  defaultOvertimeRate,
  formatWeekLabel,
  istDateString,
  mondayOfWeekIst,
  parseDateOnly,
  sundayOfWeekIst,
} from "@/lib/shop-attendance";
import {
  generateWeeklySalaryInvoices,
  getAttendanceForDate,
  listSalaryInvoices,
  listShopStaff,
  loadAttendanceBootstrap,
  markSalaryInvoiceShared,
  saveAttendanceForDate,
  setShopStaffActive,
  upsertShopStaff,
  type SalaryInvoiceRow,
  type StaffRow,
} from "@/app/shop/attendance-actions";

type PanelTab = "staff" | "attendance" | "invoices";

type AttendanceDraft = {
  present: boolean;
  overtimeHours: string;
};

function weekInputValue(fromDate = istDateString()): string {
  return mondayOfWeekIst(fromDate).toISOString().slice(0, 10);
}

export function ShopAttendancePanel() {
  const { locale } = useShopShell();
  const [tab, setTab] = useState<PanelTab>("staff");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [showInactive, setShowInactive] = useState(false);

  const [attDate, setAttDate] = useState(istDateString);
  const [attDrafts, setAttDrafts] = useState<Record<string, AttendanceDraft>>({});
  const [attStaff, setAttStaff] = useState<
    (StaffRow & { present: boolean; overtimeHours: number; note: string | null })[]
  >([]);

  const [weekStart, setWeekStart] = useState(weekInputValue);
  const [invoices, setInvoices] = useState<SalaryInvoiceRow[]>([]);
  const [viewInvoice, setViewInvoice] = useState<SalaryInvoiceRow | null>(null);

  const [editing, setEditing] = useState<StaffRow | null>(null);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formWage, setFormWage] = useState("");
  const [formOt, setFormOt] = useState("");
  const [formError, setFormError] = useState("");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const [sharingId, setSharingId] = useState<string | null>(null);

  const loadStaff = useCallback(async (inactive: boolean) => {
    const rows = await listShopStaff(inactive);
    setStaff(rows);
  }, []);

  const loadAttendance = useCallback(async (date: string) => {
    const data = await getAttendanceForDate(date);
    setAttDate(data.date);
    setAttStaff(data.rows);
    const drafts: Record<string, AttendanceDraft> = {};
    for (const r of data.rows) {
      drafts[r.id] = {
        present: r.present,
        overtimeHours: r.overtimeHours ? String(r.overtimeHours) : "",
      };
    }
    setAttDrafts(drafts);
  }, []);

  const loadInvoices = useCallback(async (ws: string) => {
    const data = await listSalaryInvoices(ws);
    setWeekStart(data.weekStart);
    setInvoices(data.invoices);
  }, []);

  const applyAttendanceRows = useCallback(
    (rows: (StaffRow & { present: boolean; overtimeHours: number; note: string | null })[]) => {
      setAttStaff(rows);
      const drafts: Record<string, AttendanceDraft> = {};
      for (const r of rows) {
        drafts[r.id] = {
          present: r.present,
          overtimeHours: r.overtimeHours ? String(r.overtimeHours) : "",
        };
      }
      setAttDrafts(drafts);
    },
    []
  );

  const reloadAll = useCallback(async () => {
    setError("");
    const data = await loadAttendanceBootstrap({
      includeInactive: showInactive,
      date: attDate || istDateString(),
      weekStart: weekStart || weekInputValue(),
    });
    setStaff(data.staff);
    setAttDate(data.attendance.date);
    applyAttendanceRows(data.attendance.rows);
    setWeekStart(data.invoices.weekStart);
    setInvoices(data.invoices.invoices);
  }, [applyAttendanceRows, attDate, showInactive, weekStart]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        // One server action — parallel POSTs break Next.js action responses.
        const data = await loadAttendanceBootstrap({
          includeInactive: showInactive,
          date: istDateString(),
          weekStart: weekInputValue(),
        });
        if (cancelled) return;
        setStaff(data.staff);
        setAttDate(data.attendance.date);
        applyAttendanceRows(data.attendance.rows);
        setWeekStart(data.invoices.weekStart);
        setInvoices(data.invoices.invoices);
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "Failed to load";
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Initial load only; tab toggles use dedicated loaders.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount + showInactive refresh
  }, [showInactive, applyAttendanceRows]);

  const weekEndLabel = useMemo(() => {
    const start = parseDateOnly(weekStart);
    if (!start) return "";
    return formatWeekLabel(start, sundayOfWeekIst(start));
  }, [weekStart]);

  function resetForm() {
    setEditing(null);
    setFormName("");
    setFormPhone("");
    setFormWage("");
    setFormOt("");
    setFormError("");
  }

  function startEdit(row: StaffRow) {
    setEditing(row);
    setFormName(row.name);
    setFormPhone(row.phone);
    setFormWage(String(row.dailyWage));
    setFormOt(String(row.overtimeRatePerHour));
    setFormError("");
    setTab("staff");
  }

  function onWageBlur() {
    const wage = Number(formWage);
    if (!formOt.trim() && Number.isFinite(wage) && wage > 0) {
      setFormOt(String(defaultOvertimeRate(wage)));
    }
  }

  function saveStaff() {
    setFormError("");
    setMessage("");
    startTransition(async () => {
      const wage = Number(formWage);
      const otRaw = formOt.trim() ? Number(formOt) : null;
      const result = await upsertShopStaff({
        id: editing?.id,
        name: formName,
        phone: formPhone,
        dailyWage: wage,
        overtimeRatePerHour: otRaw,
      });
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      resetForm();
      setMessage(t(locale, "attendanceStaffSaved"));
      await loadStaff(showInactive);
      if (tab === "attendance") await loadAttendance(attDate);
    });
  }

  function toggleActive(row: StaffRow) {
    setMessage("");
    startTransition(async () => {
      const result = await setShopStaffActive(row.id, !row.active);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await loadStaff(showInactive);
      await loadAttendance(attDate);
    });
  }

  function saveAttendance() {
    setMessage("");
    startTransition(async () => {
      const entries = attStaff.map((s) => {
        const d = attDrafts[s.id] ?? { present: false, overtimeHours: "" };
        return {
          staffId: s.id,
          present: d.present,
          overtimeHours: Number(d.overtimeHours) || 0,
        };
      });
      const result = await saveAttendanceForDate({ date: attDate, entries });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(t(locale, "attendanceSaved"));
      await loadAttendance(attDate);
    });
  }

  function generateInvoices() {
    setMessage("");
    startTransition(async () => {
      const result = await generateWeeklySalaryInvoices(weekStart);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setInvoices(result.invoices);
      setMessage(
        t(locale, "attendanceInvoicesGenerated", {
          created: result.created,
          skipped: result.skipped,
        })
      );
    });
  }

  async function shareInvoice(inv: SalaryInvoiceRow) {
    setMessage("");
    setSharingId(inv.id);
    // Ensure the bill-style paper is mounted for capture.
    setViewInvoice(inv);
    try {
      preloadBillCaptureLib();
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      await shareSalaryInvoiceImage({
        fileName: `${inv.invoiceNumber}.jpg`,
        shopName: inv.shopName,
        caption: inv.shareText,
      });
      await markSalaryInvoiceShared(inv.id);
      await loadInvoices(weekStart);
    } catch {
      // Fallback: WhatsApp text to worker phone (same as before).
      openWhatsApp(inv.staffPhone, inv.shareText);
      startTransition(async () => {
        await markSalaryInvoiceShared(inv.id);
        await loadInvoices(weekStart);
      });
    } finally {
      setSharingId(null);
    }
  }

  const tabs: { id: PanelTab; label: string }[] = [
    { id: "staff", label: t(locale, "attendanceTabStaff") },
    { id: "attendance", label: t(locale, "attendanceTabMark") },
    { id: "invoices", label: t(locale, "attendanceTabInvoices") },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">{t(locale, "attendanceSalary")}</h1>
          <p className="mt-1 text-sm text-zinc-600">{t(locale, "attendanceSalaryHint")}</p>
        </div>
        <PageLoadingSkeleton />
      </div>
    );
  }

  if (error && staff.length === 0 && attStaff.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">{t(locale, "attendanceSalary")}</h1>
        </div>
        <div className="card-premium mx-auto max-w-md space-y-4 p-6 text-center">
          <h2 className="text-lg font-bold text-brand-green">{t(locale, "serverTemporaryErrorTitle")}</h2>
          <p className="text-sm text-zinc-600">{error || t(locale, "serverTemporaryErrorHint")}</p>
          <button
            type="button"
            className="btn-primary w-full py-3"
            onClick={() => {
              setLoading(true);
              void reloadAll()
                .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
                .finally(() => setLoading(false));
            }}
          >
            {t(locale, "tryAgain")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t(locale, "attendanceSalary")}</h1>
        <p className="mt-1 text-sm text-zinc-600">{t(locale, "attendanceSalaryHint")}</p>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
              tab === item.id
                ? "bg-brand-green text-brand-gold"
                : "bg-brand-cream text-brand-green ring-1 ring-brand-green/15"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {message ? (
        <p className="rounded-lg bg-brand-cream/80 px-3 py-2 text-sm text-brand-green ring-1 ring-brand-green/10">
          {message}
        </p>
      ) : null}

      {tab === "staff" ? (
        <div className="space-y-4">
          <form
            className="card-premium space-y-4 p-4 sm:p-6"
            onSubmit={(e) => {
              e.preventDefault();
              saveStaff();
            }}
          >
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-brand-green" aria-hidden />
              <h2 className="text-lg font-bold text-brand-green">
                {editing ? t(locale, "attendanceEditStaff") : t(locale, "attendanceAddStaff")}
              </h2>
              {editing ? (
                <span className="rounded-full bg-brand-green/10 px-2.5 py-0.5 text-xs font-bold text-brand-green">
                  {t(locale, "attendanceStaffNo")}
                  {editing.staffNo}
                </span>
              ) : (
                <span className="rounded-full bg-brand-green/10 px-2.5 py-0.5 text-xs font-bold text-brand-green">
                  {t(locale, "attendanceStaffNo")}
                  {staff.reduce((max, s) => Math.max(max, s.staffNo), 0) + 1}
                </span>
              )}
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-brand-green">
                {t(locale, "attendanceStaffName")}
              </span>
              <input
                className="input-premium w-full"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                autoComplete="name"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-brand-green">
                {t(locale, "phone")}
              </span>
              <input
                className="input-premium w-full"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                required
                inputMode="tel"
                placeholder="9876543210"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-brand-green">
                  {t(locale, "attendanceDailyWage")}
                </span>
                <input
                  className="input-premium w-full"
                  type="number"
                  min={0}
                  step="0.01"
                  value={formWage}
                  onChange={(e) => setFormWage(e.target.value)}
                  onBlur={onWageBlur}
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-brand-green">
                  {t(locale, "attendanceOtRate")}
                </span>
                <input
                  className="input-premium w-full"
                  type="number"
                  min={0}
                  step="0.01"
                  value={formOt}
                  onChange={(e) => setFormOt(e.target.value)}
                  placeholder={t(locale, "attendanceOtRateHint")}
                />
              </label>
            </div>

            {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

            <div className="flex flex-wrap gap-2">
              <button type="submit" className="btn-primary px-5 py-2.5" disabled={pending}>
                {t(locale, "save")}
              </button>
              {editing ? (
                <button type="button" className="btn-secondary px-5 py-2.5" onClick={resetForm}>
                  {t(locale, "cancel")}
                </button>
              ) : null}
            </div>
          </form>

          <label className="flex items-center gap-2 text-sm text-zinc-600">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => {
                setShowInactive(e.target.checked);
              }}
            />
            {t(locale, "attendanceShowInactive")}
          </label>

          {staff.length === 0 ? (
            <p className="card-premium p-6 text-center text-sm text-zinc-500">
              {t(locale, "attendanceNoStaff")}
            </p>
          ) : (
            <ul className="space-y-3">
              {staff.map((row) => (
                <li key={row.id} className="card-premium flex flex-wrap items-start justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold text-brand-green">
                      <span className="mr-1.5 text-brand-gold">#{row.staffNo}</span>
                      {row.name}
                      {!row.active ? (
                        <span className="ml-2 text-xs font-medium text-zinc-500">
                          ({t(locale, "attendanceInactive")})
                        </span>
                      ) : null}
                    </p>
                    <p className="text-sm text-zinc-600">{row.phone}</p>
                    <p className="mt-1 text-sm text-zinc-700">
                      {t(locale, "attendanceDailyWage")}: ₹{formatMoney(row.dailyWage)} ·{" "}
                      {t(locale, "attendanceOtRate")}: ₹{formatMoney(row.overtimeRatePerHour)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-secondary inline-flex items-center gap-1 px-3 py-2 text-sm"
                      onClick={() => startEdit(row)}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                      {t(locale, "editShort")}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary px-3 py-2 text-sm"
                      disabled={pending}
                      onClick={() => toggleActive(row)}
                    >
                      {row.active ? t(locale, "attendanceDeactivate") : t(locale, "attendanceActivate")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === "attendance" ? (
        <div className="space-y-4">
          <div className="card-premium space-y-4 p-4 sm:p-6">
            <div className="flex flex-wrap items-end gap-3">
              <label className="block min-w-[12rem] flex-1">
                <span className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-brand-green">
                  <Calendar className="h-4 w-4" aria-hidden />
                  {t(locale, "attendanceDate")}
                </span>
                <input
                  type="date"
                  className="input-premium w-full"
                  value={attDate}
                  onChange={(e) => {
                    const next = e.target.value;
                    setAttDate(next);
                    startTransition(() => {
                      void loadAttendance(next);
                    });
                  }}
                />
              </label>
              <button
                type="button"
                className="btn-primary px-5 py-2.5"
                disabled={pending || attStaff.length === 0}
                onClick={saveAttendance}
              >
                {t(locale, "attendanceSaveDay")}
              </button>
            </div>

            {attStaff.length === 0 ? (
              <p className="text-sm text-zinc-500">{t(locale, "attendanceNoStaff")}</p>
            ) : (
              <ul className="space-y-3">
                {attStaff.map((row) => {
                  const draft = attDrafts[row.id] ?? { present: false, overtimeHours: "" };
                  return (
                    <li key={row.id} className="rounded-xl bg-brand-cream/60 p-3 ring-1 ring-brand-green/10">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-brand-green">
                            <span className="mr-1.5 text-brand-gold">#{row.staffNo}</span>
                            {row.name}
                          </p>
                          <p className="text-xs text-zinc-500">
                            ₹{formatMoney(row.dailyWage)}/{t(locale, "attendancePerDay")}
                          </p>
                        </div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-brand-green">
                          <input
                            type="checkbox"
                            checked={draft.present}
                            onChange={(e) =>
                              setAttDrafts((prev) => ({
                                ...prev,
                                [row.id]: { ...draft, present: e.target.checked },
                              }))
                            }
                          />
                          {t(locale, "attendancePresent")}
                        </label>
                      </div>
                      <label className="mt-3 block">
                        <span className="mb-1 block text-xs font-semibold text-brand-green">
                          {t(locale, "attendanceOtHours")}
                        </span>
                        <input
                          type="number"
                          min={0}
                          step="0.5"
                          className="input-premium w-full"
                          value={draft.overtimeHours}
                          onChange={(e) =>
                            setAttDrafts((prev) => ({
                              ...prev,
                              [row.id]: { ...draft, overtimeHours: e.target.value },
                            }))
                          }
                          placeholder="0"
                        />
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {tab === "invoices" ? (
        <div className="space-y-4">
          <div className="card-premium space-y-4 p-4 sm:p-6">
            <div className="flex flex-wrap items-end gap-3">
              <label className="block min-w-[12rem] flex-1">
                <span className="mb-1 block text-sm font-semibold text-brand-green">
                  {t(locale, "attendanceWeekStart")}
                </span>
                <input
                  type="date"
                  className="input-premium w-full"
                  value={weekStart}
                  onChange={(e) => {
                    const monday = weekInputValue(e.target.value);
                    setWeekStart(monday);
                    startTransition(() => {
                      void loadInvoices(monday);
                    });
                  }}
                />
                <p className="mt-1 text-xs text-zinc-500">
                  {t(locale, "attendanceWeekHint")}: {weekEndLabel}
                </p>
              </label>
              <button
                type="button"
                className="btn-primary px-5 py-2.5"
                disabled={pending}
                onClick={generateInvoices}
              >
                {t(locale, "attendanceGenerateInvoices")}
              </button>
            </div>
          </div>

          {invoices.length === 0 ? (
            <p className="card-premium p-6 text-center text-sm text-zinc-500">
              {t(locale, "attendanceNoInvoices")}
            </p>
          ) : (
            <ul className="space-y-3">
              {invoices.map((inv) => (
                <li key={inv.id} className="card-premium space-y-3 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-brand-green">
                        <span className="mr-1.5 text-brand-gold">#{inv.staffNo}</span>
                        {inv.staffName}
                      </p>
                      <p className="text-xs text-zinc-500">{inv.invoiceNumber}</p>
                      <p className="mt-1 text-sm text-zinc-700">
                        {formatWeekLabel(parseDateOnly(inv.weekStart)!, parseDateOnly(inv.weekEnd)!)}
                      </p>
                      <p className="mt-1 text-sm text-zinc-700">
                        {t(locale, "attendancePresentDays")}: {inv.presentDays} ·{" "}
                        {t(locale, "attendanceOtHours")}: {inv.overtimeHours}
                      </p>
                      <p className="mt-1 text-base font-bold text-brand-green">
                        ₹{formatMoney(inv.amount)}
                      </p>
                      <p className="text-xs uppercase tracking-wide text-zinc-500">{inv.status}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn-secondary inline-flex items-center gap-1 px-3 py-2 text-sm"
                        onClick={() => setViewInvoice(inv)}
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden />
                        {t(locale, "attendanceViewInvoice")}
                      </button>
                      <button
                        type="button"
                        className="btn-primary inline-flex items-center gap-1 px-3 py-2 text-sm"
                        onClick={() => void shareInvoice(inv)}
                        disabled={sharingId === inv.id}
                      >
                        <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                        {sharingId === inv.id ? t(locale, "sharingBill") : t(locale, "attendanceShareWhatsApp")}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {viewInvoice ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={() => setViewInvoice(null)}
        >
          <div
            className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-brand-cream p-3 shadow-xl sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <SalaryInvoiceReceipt
              invoice={viewInvoice}
              locale={locale}
              shop={{
                shopName: viewInvoice.shopName,
                address: viewInvoice.shopAddress,
                phone: viewInvoice.shopPhone,
              }}
            />
            <div className="mt-3 flex flex-wrap gap-2 px-1 pb-1">
              <button
                type="button"
                className="btn-primary inline-flex items-center gap-1 px-4 py-2"
                disabled={sharingId === viewInvoice.id}
                onClick={() => void shareInvoice(viewInvoice)}
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                {sharingId === viewInvoice.id
                  ? t(locale, "sharingBill")
                  : t(locale, "attendanceShareWhatsApp")}
              </button>
              <button type="button" className="btn-secondary px-4 py-2" onClick={() => setViewInvoice(null)}>
                {t(locale, "cancel")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
