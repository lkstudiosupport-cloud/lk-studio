"use client";

import type { Locale } from "@/lib/i18n/locales";
import type { BillReceiptData } from "@/lib/bill-receipt-text";
import { BillReceipt } from "@/components/BillReceipt";
import { BillReceiptShell } from "@/components/BillReceiptShell";
import { BillShareActions } from "@/components/BillShareActions";
import { BillDetailPage } from "@/components/BillDetailPage";
import { BillShareAutoSend } from "@/components/BillShareAutoSend";
import { BillPaymentPanel } from "@/components/BillPaymentPanel";

export function ShopBillDetailView({
  locale,
  billId,
  receiptData,
  isPostCreate,
  preparingLabel,
  errorLabel,
  fallbackHint,
}: {
  locale: Locale;
  billId: string;
  receiptData: BillReceiptData;
  /** Landed after save — receipt hero, payment deferred, share sheet in background. */
  isPostCreate: boolean;
  preparingLabel: string;
  errorLabel: string;
  fallbackHint: string;
}) {
  const shareActions = (
    <BillShareActions
      locale={locale}
      backHref="/shop/bills"
      editHref={`/shop/bills/${billId}/edit`}
      billNumber={receiptData.billNumber}
      shopName={receiptData.shop.shopName}
      itemsJson={receiptData.itemsJson}
      amount={receiptData.amount}
      receipt={receiptData}
      showShare
    />
  );

  return (
    <BillDetailPage
      receiptHero={isPostCreate}
      actions={shareActions}
      extra={
        <BillShareAutoSend
          billNumber={receiptData.billNumber}
          shopName={receiptData.shop.shopName}
          itemsJson={receiptData.itemsJson}
          amount={receiptData.amount}
          enabled={isPostCreate}
          preparingLabel={preparingLabel}
          errorLabel={errorLabel}
          fallbackHint={fallbackHint}
        />
      }
      receipt={
        <BillReceiptShell locale={locale} autoFullscreenOnMobile={false} defaultFullscreen={false}>
          <BillReceipt bill={receiptData} locale={locale} />
        </BillReceiptShell>
      }
      paymentPanel={
        <BillPaymentPanel
          billId={billId}
          amount={receiptData.amount}
          advancePaid={receiptData.advancePaid}
          paidAmount={receiptData.paidAmount}
          paid={receiptData.paid}
          locale={locale}
          collapsibleOnMobile
        />
      }
    />
  );
}
