import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { parseBillItems, formatMoney } from "@/lib/bill-items";
import { billPending } from "@/lib/bill-payment";
import Image from "next/image";
import { BillCornerMark } from "@/components/BillCornerMark";
import type { BillReceiptData } from "@/lib/bill-receipt-text";
import { BILL_RECEIPT_CAPTURE_ID } from "@/lib/bill-receipt-capture";

function formatReceiptDate(d: Date) {
  return d.toLocaleString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BillReceipt({ bill, locale }: { bill: BillReceiptData; locale: Locale }) {
  const items = parseBillItems(bill.itemsJson, bill.amount);
  const rows =
    items.length > 0
      ? items
      : [{ id: "total", name: t(locale, "billTotal"), quantity: 1, price: bill.amount, amount: bill.amount }];
  const pending = billPending(bill.amount, bill.advancePaid, bill.paidAmount);
  const fullyPaid = bill.paid && pending <= 0.01;

  return (
    <div className="bill-receipt">
      <div id={BILL_RECEIPT_CAPTURE_ID} className="bill-receipt-paper">
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
            <h1 className="bill-receipt-shop-name">{bill.shop.shopName}</h1>
            <p className="bill-receipt-subtitle">{t(locale, "taxInvoice")}</p>
            <div className="bill-receipt-brand-row">
              <span className="bill-receipt-brand-line" />
              <span className="bill-receipt-brand-label">{t(locale, "appName")}</span>
              <span className="bill-receipt-brand-line" />
            </div>
            {bill.shop.address && <p className="bill-receipt-address">{bill.shop.address}</p>}
            {bill.shop.phone && (
              <p className="bill-receipt-header-phone">
                {t(locale, "phone")}: {bill.shop.phone}
              </p>
            )}
          </div>

          <div className="bill-receipt-meta">
            <div className="bill-receipt-row">
              <span className="bill-receipt-row-label">{t(locale, "billNo")}</span>
              <span className="bill-receipt-row-value bill-receipt-row-value--strong">{bill.billNumber}</span>
            </div>
            <div className="bill-receipt-row">
              <span className="bill-receipt-row-label">{t(locale, "billDate")}</span>
              <span className="bill-receipt-row-value">{formatReceiptDate(bill.createdAt)}</span>
            </div>
            <div className="bill-receipt-row">
              <span className="bill-receipt-row-label">{t(locale, "customer")}</span>
              <span className="bill-receipt-row-value">{bill.customer.name}</span>
            </div>
            {bill.customer.phone && (
              <div className="bill-receipt-row">
                <span className="bill-receipt-row-label">{t(locale, "phone")}</span>
                <span className="bill-receipt-row-value">{bill.customer.phone}</span>
              </div>
            )}
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
                {rows.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="bill-receipt-td-sno">{idx + 1}</td>
                    <td className="bill-receipt-td-item">{item.name}</td>
                    <td className="bill-receipt-td-qty">{item.quantity}</td>
                    <td className="bill-receipt-td-price">₹{formatMoney(item.price)}</td>
                    <td className="bill-receipt-td-total">₹{formatMoney(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bill-receipt-totals">
            <div className="bill-receipt-grand-total">
              <span>{t(locale, "billTotal")}</span>
              <span>₹{formatMoney(bill.amount)}</span>
            </div>
            <div className="bill-receipt-payments">
              <div className="bill-receipt-pay-row bill-receipt-pay-row--advance">
                <span>{t(locale, "advancePaid")}</span>
                <span>₹{formatMoney(bill.advancePaid)}</span>
              </div>
              <div className="bill-receipt-pay-row bill-receipt-pay-row--paid">
                <span>{t(locale, "amountPaid")}</span>
                <span>₹{formatMoney(bill.paidAmount)}</span>
              </div>
              <div className="bill-receipt-pay-row bill-receipt-pay-row--pending">
                <span>{t(locale, "pendingAmount")}</span>
                <span>₹{formatMoney(pending)}</span>
              </div>
            </div>
          </div>

          {fullyPaid && <div className="bill-receipt-paid-banner">{t(locale, "fullyPaid")}</div>}

          {bill.notes && (
            <div className="bill-receipt-notes">
              <strong>{t(locale, "notes")}: </strong>
              {bill.notes}
            </div>
          )}

          {bill.shop.upiId && (
            <div className="bill-receipt-upi">
              <p className="bill-receipt-upi-label">{t(locale, "upiId")}</p>
              <p className="bill-receipt-upi-value">{bill.shop.upiId}</p>
            </div>
          )}

          <div className="bill-receipt-footer">
            <p className="bill-receipt-footer-thanks">{t(locale, "thankYouVisit")}</p>
            <p className="bill-receipt-footer-sub">
              {bill.shop.shopName} · {t(locale, "appName")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
