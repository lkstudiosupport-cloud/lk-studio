export function BillDetailPage({
  actions,
  receipt,
  paymentPanel,
  extra,
  children,
  receiptPrimaryOnMobile,
}: {
  actions: React.ReactNode;
  /** Bill receipt — shown first on mobile when provided with payment. */
  receipt?: React.ReactNode;
  /** Payment panel — below receipt on mobile. */
  paymentPanel?: React.ReactNode;
  extra?: React.ReactNode;
  /** Legacy: single children slot (customer bill detail). */
  children?: React.ReactNode;
  /** Receipt fills mobile viewport; payment stays collapsed until user scrolls past. */
  receiptPrimaryOnMobile?: boolean;
}) {
  const receiptPrimary = receiptPrimaryOnMobile ?? (receipt != null && paymentPanel != null);

  return (
    <div
      className={
        receiptPrimary ? "bill-detail-page bill-detail-page--receipt-primary" : "bill-detail-page"
      }
    >
      {actions}
      {extra}
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
