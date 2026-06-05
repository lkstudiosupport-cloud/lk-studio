"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Download, FileText, IndianRupee } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { formatMoney } from "@/lib/bill-items";
import type { ReportMode } from "@/lib/report-period";
import { currentMonthValue, currentWeekValue } from "@/lib/report-period";
import type { ReportBillRow, ReportSummary } from "@/lib/shop-report";
import { billBalance } from "@/lib/shop-report";
import { billReceived } from "@/lib/income";
import { downloadEarningsReportPdf } from "@/lib/download-earnings-report-pdf";

export function ShopReportPanel({
  locale,
  shopName,
  mode,
  period,
  periodLabel,
  summary,
  bills,
}: {
  locale: Locale;
  shopName: string;
  mode: ReportMode;
  period: string;
  periodLabel: string;
  summary: ReportSummary;
  bills: ReportBillRow[];
}) {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);
  const [, startTransition] = useTransition();

  function updateReport(nextMode: ReportMode, nextPeriod: string) {
    const params = new URLSearchParams({ mode: nextMode, period: nextPeriod });
    startTransition(() => {
      router.push(`/shop/reports?${params.toString()}`);
    });
  }

  async function onDownloadPdf() {
    setDownloading(true);
    try {
      await downloadEarningsReportPdf({
        shopName,
        periodLabel,
        modeLabel: t(locale, mode === "week" ? "reportWeekly" : "reportMonthly"),
        summary,
        bills,
        labels: {
          title: t(locale, "earningsReport"),
          billNo: t(locale, "billNo"),
          date: t(locale, "billDate"),
          customer: t(locale, "customer"),
          amount: t(locale, "amount"),
          advance: t(locale, "advancePaid"),
          paid: t(locale, "amountPaid"),
          received: t(locale, "reportReceived"),
          pending: t(locale, "pendingAmount"),
          totalRaised: t(locale, "reportTotalRaised"),
          totalReceived: t(locale, "reportTotalReceived"),
          totalPending: t(locale, "reportTotalPending"),
          billCount: t(locale, "reportBillCount"),
          noBills: t(locale, "reportNoBills"),
          total: t(locale, "billTotal"),
        },
        appName: t(locale, "appName"),
      });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t(locale, "earningsReport")}</h1>
        <p className="mt-2 text-sm text-zinc-600">{t(locale, "earningsReportHint")}</p>
      </div>

      <div className="card-premium space-y-4 p-4">
        <div className="flex gap-2">
          {(["week", "month"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() =>
                updateReport(m, m === "week" ? currentWeekValue() : currentMonthValue())
              }
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                mode === m
                  ? "bg-brand-green text-brand-gold"
                  : "bg-brand-cream text-brand-green ring-1 ring-brand-green/15"
              }`}
            >
              {t(locale, m === "week" ? "reportWeekly" : "reportMonthly")}
            </button>
          ))}
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase text-brand-green-soft">
            {t(locale, mode === "week" ? "reportPickWeek" : "reportPickMonth")}
          </span>
          {mode === "week" ? (
            <input
              type="week"
              value={period}
              onChange={(e) => e.target.value && updateReport("week", e.target.value)}
              className="input-premium w-full max-w-xs"
            />
          ) : (
            <input
              type="month"
              value={period}
              onChange={(e) => e.target.value && updateReport("month", e.target.value)}
              className="input-premium w-full max-w-xs"
            />
          )}
        </label>

        <p className="text-sm font-medium text-brand-green">{periodLabel}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label={t(locale, "reportTotalRaised")} value={summary.totalRaised} />
        <SummaryCard label={t(locale, "reportTotalReceived")} value={summary.totalReceived} highlight />
        <SummaryCard label={t(locale, "reportTotalPending")} value={summary.totalPending} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm text-zinc-600">
          <FileText className="h-4 w-4" />
          {t(locale, "reportBillCount")}: <strong>{summary.billCount}</strong>
        </p>
        <button
          type="button"
          onClick={() => void onDownloadPdf()}
          disabled={downloading}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          {downloading ? t(locale, "reportPreparingPdf") : t(locale, "reportDownloadPdf")}
        </button>
      </div>

      <div id="shop-earnings-report" className="card-premium overflow-hidden">
        <div className="space-y-3 p-3 sm:hidden">
          {bills.map((bill) => {
            const received = billReceived(bill.advancePaid, bill.paidAmount);
            const pending = billBalance(bill.amount, bill.advancePaid, bill.paidAmount);
            return (
              <div key={bill.id} className="rounded-xl border border-brand-green/10 bg-white p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-medium text-brand-green">{bill.billNumber}</p>
                    <p className="mt-1 truncate font-medium">{bill.customerName}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {bill.createdAt.toLocaleDateString(locale === "en" ? "en-IN" : locale, {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <p className="shrink-0 font-bold text-brand-green">₹{formatMoney(bill.amount)}</p>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 border-t border-brand-green/5 pt-2 text-xs">
                  <div>
                    <p className="text-zinc-500">{t(locale, "reportReceived")}</p>
                    <p className="font-semibold text-brand-green">₹{formatMoney(received)}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">{t(locale, "pendingAmount")}</p>
                    <p className="font-semibold text-amber-800">
                      {pending > 0 ? `₹${formatMoney(pending)}` : "—"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          {bills.length === 0 && (
            <p className="p-6 text-center text-zinc-500">{t(locale, "reportNoBills")}</p>
          )}
        </div>

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="bg-brand-green text-left text-xs uppercase text-white">
                <th className="px-3 py-3 font-semibold">{t(locale, "billDate")}</th>
                <th className="px-3 py-3 font-semibold">{t(locale, "billNo")}</th>
                <th className="px-3 py-3 font-semibold">{t(locale, "customer")}</th>
                <th className="px-3 py-3 font-semibold text-right">{t(locale, "amount")}</th>
                <th className="px-3 py-3 font-semibold text-right">{t(locale, "reportReceived")}</th>
                <th className="px-3 py-3 font-semibold text-right">{t(locale, "pendingAmount")}</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill, i) => {
                const received = billReceived(bill.advancePaid, bill.paidAmount);
                const pending = billBalance(bill.amount, bill.advancePaid, bill.paidAmount);
                return (
                  <tr
                    key={bill.id}
                    className={`border-b border-brand-green/5 ${i % 2 === 1 ? "bg-brand-cream/40" : "bg-white"}`}
                  >
                    <td className="px-3 py-3 whitespace-nowrap text-zinc-600">
                      {bill.createdAt.toLocaleDateString(locale === "en" ? "en-IN" : locale, {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs font-medium text-brand-green">
                      {bill.billNumber}
                    </td>
                    <td className="px-3 py-3">{bill.customerName}</td>
                    <td className="px-3 py-3 text-right tabular-nums">₹{formatMoney(bill.amount)}</td>
                    <td className="px-3 py-3 text-right tabular-nums font-medium text-brand-green">
                      ₹{formatMoney(received)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-amber-800">
                      {pending > 0 ? `₹${formatMoney(pending)}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {bills.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-brand-green/20 bg-brand-cream font-bold text-brand-green">
                  <td colSpan={3} className="px-3 py-3 text-right">
                    {t(locale, "billTotal")}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">₹{formatMoney(summary.totalRaised)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    ₹{formatMoney(summary.totalReceived)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">₹{formatMoney(summary.totalPending)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        {bills.length === 0 && (
          <p className="hidden p-8 text-center text-zinc-500 sm:block">{t(locale, "reportNoBills")}</p>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className={`card-premium p-4 ${highlight ? "ring-2 ring-brand-gold/40" : ""}`}>
      <p className="text-xs font-semibold uppercase text-brand-green-soft">{label}</p>
      <p className="mt-2 flex items-center text-xl font-bold text-brand-green">
        <IndianRupee className="h-5 w-5 text-brand-gold" />
        {formatMoney(value)}
      </p>
    </div>
  );
}
