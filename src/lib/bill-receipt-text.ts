import { parseBillItems, formatMoney, formatBillLineSummary } from "@/lib/bill-items";
import { billPending } from "@/lib/bill-payment";

export type BillReceiptData = {
  billNumber: string;
  amount: number;
  advancePaid: number;
  paidAmount: number;
  paid: boolean;
  itemsJson: string;
  notes: string | null;
  createdAt: Date;
  shop: {
    shopName: string;
    address?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    upiId?: string | null;
  };
  customer: { name: string; phone?: string | null };
};

function formatBillDate(d: Date) {
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function buildBillWhatsAppMessage(bill: BillReceiptData) {
  const items = parseBillItems(bill.itemsJson, bill.amount);
  const pending = billPending(bill.amount, bill.advancePaid, bill.paidAmount);
  const lines: string[] = [];

  lines.push(`🧾 *${bill.shop.shopName}*`);
  lines.push(`Bill: *${bill.billNumber}*`);
  lines.push(`Date: ${formatBillDate(bill.createdAt)}`);
  lines.push(`Customer: ${bill.customer.name}`);
  lines.push("");
  lines.push("*Items*");

  const rows =
    items.length > 0
      ? items
      : [{ id: "t", name: "Total", quantity: 1, price: bill.amount, amount: bill.amount }];
  rows.forEach((item, i) => {
    lines.push(`${i + 1}. ${formatBillLineSummary(item)} — ₹${formatMoney(item.amount)}`);
  });

  lines.push("");
  lines.push(`*Total:* ₹${formatMoney(bill.amount)}`);
  lines.push(`Advance: ₹${formatMoney(bill.advancePaid)}`);
  lines.push(`Paid: ₹${formatMoney(bill.paidAmount)}`);
  lines.push(`*Balance:* ₹${formatMoney(pending)}`);

  if (bill.paid && pending <= 0.01) lines.push("✅ Fully paid");
  if (bill.notes) lines.push(`Note: ${bill.notes}`);
  if (bill.shop.upiId) lines.push(`UPI: ${bill.shop.upiId}`);
  if (bill.shop.phone) lines.push(`Shop: ${bill.shop.phone}`);

  lines.push("");
  lines.push("Thank you — LK Studio");

  return lines.join("\n");
}
