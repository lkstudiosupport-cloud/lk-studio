/** Money received on a bill (advance + paid). */
export function billReceived(advancePaid: number, paidAmount: number) {
  return (advancePaid || 0) + (paidAmount || 0);
}

/** Total bill amount raised (full bill total, not just paid portion). */
export function billsRaisedTotal(
  bills: { amount: number; createdAt: Date }[],
  since: Date
) {
  return bills
    .filter((b) => b.createdAt >= since)
    .reduce((s, b) => s + (Number(b.amount) || 0), 0);
}

export function startOfWeek(d = new Date()) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? 6 : day - 1;
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function sumBillIncome(
  bills: { amount: number; createdAt: Date }[],
  since: Date
) {
  return billsRaisedTotal(bills, since);
}
