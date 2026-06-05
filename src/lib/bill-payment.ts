export function billPending(amount: number, advancePaid: number, paidAmount: number) {
  return Math.max(0, amount - advancePaid - paidAmount);
}

export function billFullyPaid(amount: number, advancePaid: number, paidAmount: number) {
  return billPending(amount, advancePaid, paidAmount) <= 0.01;
}
