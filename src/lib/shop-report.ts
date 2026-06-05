import { billReceived } from "@/lib/income";

export type ReportBillRow = {
  id: string;
  billNumber: string;
  createdAt: Date;
  customerName: string;
  amount: number;
  advancePaid: number;
  paidAmount: number;
};

export type ReportSummary = {
  billCount: number;
  totalRaised: number;
  totalReceived: number;
  totalPending: number;
};

export function billBalance(amount: number, advancePaid: number, paidAmount: number) {
  const balance = amount - billReceived(advancePaid, paidAmount);
  return balance > 0 ? balance : 0;
}

export function summarizeReportBills(bills: ReportBillRow[]): ReportSummary {
  let totalRaised = 0;
  let totalReceived = 0;
  let totalPending = 0;

  for (const bill of bills) {
    totalRaised += bill.amount;
    const received = billReceived(bill.advancePaid, bill.paidAmount);
    totalReceived += received;
    totalPending += billBalance(bill.amount, bill.advancePaid, bill.paidAmount);
  }

  return {
    billCount: bills.length,
    totalRaised: Math.round(totalRaised * 100) / 100,
    totalReceived: Math.round(totalReceived * 100) / 100,
    totalPending: Math.round(totalPending * 100) / 100,
  };
}
