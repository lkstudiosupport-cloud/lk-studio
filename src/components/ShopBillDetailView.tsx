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
import { BillReadAloudButton } from "@/components/BillReadAloudButton";

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
    setReceiptFullscreen(fullscreen);
  };

  const hideChromeWhileFullscreen = isPostCreate && receiptFullscreen;

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

  const shareActionsCompact = (
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
      compact
    />
  );

  return (
    <>
      <BillDetailPage
        receiptHero={isPostCreate}
        receiptFullscreen={receiptFullscreen}
        actions={shareActions}
        extra={
          <BillShareAutoSend
            billNumber={receiptData.billNumber}
            shopName={receiptData.shop.shopName}
            itemsJson={receiptData.itemsJson}
            amount={receiptData.amount}
            enabled={isPostCreate}
            silent={hideChromeWhileFullscreen}
            preparingLabel={preparingLabel}
            errorLabel={errorLabel}
            fallbackHint={fallbackHint}
          />
        }
        /* Page-level actions sit under the fullscreen overlay — keep chrome for
           non-fullscreen; fullscreen always embeds Share/Edit/Back in the toolbar. */
        hideActions={receiptFullscreen}
        hideExtra={hideChromeWhileFullscreen}
        receipt={
          <BillReceiptShell
            locale={locale}
            defaultFullscreen={isPostCreate}
            autoFullscreenOnMobile={!isPostCreate}
            onFullscreenChange={handleFullscreenChange}
            embedActionsInFullscreen
            fullscreenActions={shareActionsCompact}
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
      {/* Always-visible speaker on the bill page (including fullscreen). */}
      <BillReadAloudButton locale={locale} bill={receiptData} floating />
    </>
  );
}
