"use client";

import { useLayoutEffect, useState } from "react";
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
  const [receiptFullscreen, setReceiptFullscreen] = useState(false);

  useLayoutEffect(() => {
    if (isPostCreate && window.matchMedia("(max-width: 639px)").matches) {
      setReceiptFullscreen(true);
    }
  }, [isPostCreate]);

  const handleFullscreenChange = (fullscreen: boolean) => {
    if (isPostCreate) {
      if (!fullscreen) setReceiptFullscreen(false);
      return;
    }
    setReceiptFullscreen(fullscreen);
  };

  const hideChromeWhileFullscreen = isPostCreate && receiptFullscreen;

  return (
    <BillDetailPage
      receiptHero={isPostCreate}
      receiptFullscreen={receiptFullscreen}
      actions={
        <BillShareActions
          locale={locale}
          backHref="/shop/bills"
          billNumber={receiptData.billNumber}
          shopName={receiptData.shop.shopName}
          showShare
        />
      }
      extra={
        <BillShareAutoSend
          billNumber={receiptData.billNumber}
          shopName={receiptData.shop.shopName}
          enabled={isPostCreate}
          silent={hideChromeWhileFullscreen}
          preparingLabel={preparingLabel}
          errorLabel={errorLabel}
          fallbackHint={fallbackHint}
        />
      }
      hideActions={hideChromeWhileFullscreen}
      hideExtra={hideChromeWhileFullscreen}
      receipt={
        <BillReceiptShell
          locale={locale}
          defaultFullscreen={isPostCreate}
          autoFullscreenOnMobile={!isPostCreate}
          onFullscreenChange={handleFullscreenChange}
          embedActionsInFullscreen={isPostCreate}
          fullscreenActions={
            <BillShareActions
              locale={locale}
              backHref="/shop/bills"
              billNumber={receiptData.billNumber}
              shopName={receiptData.shop.shopName}
              showShare
              compact
            />
          }
        >
          <BillReceipt bill={receiptData} locale={locale} />
        </BillReceiptShell>
      }
      paymentPanel={
        hideChromeWhileFullscreen ? null : (
          <BillPaymentPanel
            billId={billId}
            amount={receiptData.amount}
            advancePaid={receiptData.advancePaid}
            paidAmount={receiptData.paidAmount}
            paid={receiptData.paid}
            locale={locale}
            collapsibleOnMobile
          />
        )
      }
    />
  );
}
