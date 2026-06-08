export function BillDetailPage({
  actions,
  receipt,
  paymentPanel,
  extra,
  children,
  receiptPrimaryOnMobile,
  receiptHero,
  receiptFullscreen,
  hideActions,
  hideExtra,
}: {
  actions?: React.ReactNode;
  /** Bill receipt — shown first on mobile when provided with payment. */
  receipt?: React.ReactNode;
  /** Payment panel — below receipt on mobile. */
  paymentPanel?: React.ReactNode;
  extra?: React.ReactNode;
  /** Legacy: single children slot (customer bill detail). */
  children?: React.ReactNode;
  /** Receipt fills mobile viewport; payment stays collapsed until user scrolls past. */
  receiptPrimaryOnMobile?: boolean;
  /** Post-create flow: receipt is the hero; chrome hidden while fullscreen. */
  receiptHero?: boolean;
  receiptFullscreen?: boolean;
  hideActions?: boolean;
  hideExtra?: boolean;
}) {
  const receiptPrimary =
    receiptHero ?? receiptPrimaryOnMobile ?? (receipt != null && paymentPanel != null);

  const pageClass = [
    "bill-detail-page",
    receiptPrimary ? "bill-detail-page--receipt-primary" : "",
    receiptHero ? "bill-detail-page--receipt-hero" : "",
    receiptFullscreen ? "bill-detail-page--receipt-fullscreen-active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={pageClass}>
      {!hideActions && actions}
      {!hideExtra && extra}
      <div className="bill-detail-body">
        {receipt != null || paymentPanel != null ? (
          <>
            {receipt}
            {paymentPanel}
          </>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
