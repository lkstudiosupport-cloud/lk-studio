"use client";

import Image from "next/image";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { formatMoney } from "@/lib/bill-items";
import { BillCornerMark } from "@/components/BillCornerMark";
import { BILL_RECEIPT_STYLES } from "@/lib/bill-receipt-styles";
import { formatWeekLabel, parseDateOnly, SALARY_INVOICE_CAPTURE_ID } from "@/lib/shop-attendance";
import type { SalaryInvoiceRow } from "@/app/shop/attendance-actions";

export { SALARY_INVOICE_CAPTURE_ID };

export function SalaryInvoiceReceipt({
  invoice,
  locale,
  shop,
}: {
  invoice: SalaryInvoiceRow;
  locale: Locale;
  shop: { shopName: string; address?: string | null; phone?: string | null };
}) {
  const weekStart = parseDateOnly(invoice.weekStart);
  const weekEnd = parseDateOnly(invoice.weekEnd);
  const weekLabel =
    weekStart && weekEnd ? formatWeekLabel(weekStart, weekEnd) : `${invoice.weekStart} – ${invoice.weekEnd}`;
  const daysPay = Math.round(invoice.presentDays * invoice.dailyWage * 100) / 100;
  const otPay = Math.round(invoice.overtimeHours * invoice.overtimeRate * 100) / 100;
  const lines = [
    {
      sno: 1,
      item: t(locale, "attendancePresentDays"),
      qty: invoice.presentDays,
      price: invoice.dailyWage,
      total: daysPay,
    },
    {
      sno: 2,
      item: t(locale, "attendanceOtHours"),
      qty: invoice.overtimeHours,
      price: invoice.overtimeRate,
      total: otPay,
    },
  ].filter((l) => l.qty > 0 || l.sno === 1);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: BILL_RECEIPT_STYLES }} />
      <div className="bill-receipt">
        <div id={SALARY_INVOICE_CAPTURE_ID} className="bill-receipt-paper">
          <div className="bill-receipt-corners" aria-hidden>
            {(["tl", "tr", "bl", "br"] as const).map((pos) => (
              <BillCornerMark key={pos} position={pos} appName={t(locale, "appName")} />
            ))}
          </div>

          <div className="bill-receipt-content">
            <div className="bill-receipt-header">
              <div className="bill-receipt-icon-wrap">
                <Image
                  src="/logo.png"
                  alt={t(locale, "appName")}
                  width={56}
                  height={56}
                  className="bill-receipt-logo"
                  unoptimized
                />
              </div>
              <h1 className="bill-receipt-shop-name">{shop.shopName}</h1>
              <p className="bill-receipt-subtitle">{t(locale, "salaryInvoiceTitle")}</p>
              <div className="bill-receipt-brand-row">
                <span className="bill-receipt-brand-line" />
                <span className="bill-receipt-brand-label">{t(locale, "appName")}</span>
                <span className="bill-receipt-brand-line" />
              </div>
              {shop.address ? <p className="bill-receipt-address">{shop.address}</p> : null}
              {shop.phone ? (
                <p className="bill-receipt-header-phone">
                  {t(locale, "phone")}: {shop.phone}
                </p>
              ) : null}
            </div>

            <div className="bill-receipt-meta">
              <div className="bill-receipt-row">
                <span className="bill-receipt-row-label">{t(locale, "billNo")}</span>
                <span className="bill-receipt-row-value bill-receipt-row-value--strong">
                  {invoice.invoiceNumber}
                </span>
              </div>
              <div className="bill-receipt-row">
                <span className="bill-receipt-row-label">{t(locale, "attendanceWeekHint")}</span>
                <span className="bill-receipt-row-value">{weekLabel}</span>
              </div>
              <div className="bill-receipt-row">
                <span className="bill-receipt-row-label">{t(locale, "attendanceStaffNo")}</span>
                <span className="bill-receipt-row-value bill-receipt-row-value--strong">
                  #{invoice.staffNo}
                </span>
              </div>
              <div className="bill-receipt-row">
                <span className="bill-receipt-row-label">{t(locale, "attendanceStaffName")}</span>
                <span className="bill-receipt-row-value">{invoice.staffName}</span>
              </div>
              {invoice.staffPhone ? (
                <div className="bill-receipt-row">
                  <span className="bill-receipt-row-label">{t(locale, "phone")}</span>
                  <span className="bill-receipt-row-value">{invoice.staffPhone}</span>
                </div>
              ) : null}
            </div>

            <div className="bill-receipt-items">
              <table className="bill-receipt-table">
                <thead>
                  <tr>
                    <th className="bill-receipt-th-sno">{t(locale, "sno")}</th>
                    <th>{t(locale, "itemDescription")}</th>
                    <th className="bill-receipt-th-qty">{t(locale, "qty")}</th>
                    <th className="bill-receipt-th-price">{t(locale, "unitPrice")}</th>
                    <th className="bill-receipt-th-total">{t(locale, "lineTotal")}</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => (
                    <tr key={line.sno}>
                      <td className="bill-receipt-td-sno">{line.sno}</td>
                      <td>{line.item}</td>
                      <td className="bill-receipt-td-qty">{line.qty}</td>
                      <td className="bill-receipt-td-price">₹{formatMoney(line.price)}</td>
                      <td className="bill-receipt-td-total">₹{formatMoney(line.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bill-receipt-totals">
              <div className="bill-receipt-grand-total">
                <span>{t(locale, "billTotal")}</span>
                <span>₹{formatMoney(invoice.amount)}</span>
              </div>
            </div>

            <div className="bill-receipt-footer">
              <p className="bill-receipt-footer-thanks">{t(locale, "salaryInvoiceThanks")}</p>
              <p className="bill-receipt-footer-sub">
                {shop.shopName} · {t(locale, "appName")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
