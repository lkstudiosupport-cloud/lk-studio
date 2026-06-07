export function BillDetailPage({
  actions,
  receipt,
  paymentPanel,
  extra,
  children,
}: {
  actions: React.ReactNode;
  /** Bill receipt — shown first on mobile when provided with payment. */
  receipt?: React.ReactNode;
  /** Payment panel — below receipt on mobile. */
  paymentPanel?: React.ReactNode;
  extra?: React.ReactNode;
  /** Legacy: single children slot (customer bill detail). */
  children?: React.ReactNode;
}) {
  return (
    <div className="bill-detail-page">
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
