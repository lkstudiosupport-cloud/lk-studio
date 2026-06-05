export function BillDetailPage({
  actions,
  children,
  extra,
}: {
  actions: React.ReactNode;
  children: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <div className="bill-detail-page">
      {actions}
      <div className="bill-detail-body">{children}</div>
      {extra}
    </div>
  );
}
