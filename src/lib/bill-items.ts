export type BillLineItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  amount: number;
  orderId?: string;
  personName?: string;
};

export function lineItemTotal(quantity: number, price: number) {
  const q = Number(quantity) || 0;
  const p = Number(price) || 0;
  return Math.round(q * p * 100) / 100;
}

function normalizeBillItem(raw: unknown, index: number): BillLineItem | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const name = o.name ?? o.item;
  if (typeof name !== "string" || !name.trim()) return null;

  const quantityRaw = o.quantity ?? o.qty;
  const quantity =
    quantityRaw != null && quantityRaw !== "" ? Number(quantityRaw) : 1;
  const price = Number(o.price ?? 0);
  const amountRaw = o.amount;
  let amount =
    amountRaw != null && amountRaw !== ""
      ? Number(amountRaw)
      : lineItemTotal(quantity, price);
  let unitPrice = Number.isFinite(price) ? price : 0;
  if (unitPrice <= 0 && Number.isFinite(amount) && amount > 0) {
    unitPrice = amount / (Number.isFinite(quantity) && quantity > 0 ? quantity : 1);
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    amount = lineItemTotal(quantity, unitPrice);
  }

  return {
    id: typeof o.id === "string" ? o.id : `legacy-${index}`,
    name: name.trim(),
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    price: unitPrice,
    amount: Number.isFinite(amount) ? amount : 0,
    orderId: typeof o.orderId === "string" ? o.orderId : undefined,
    personName: typeof o.personName === "string" ? o.personName : undefined,
  };
}

export function parseBillItems(json: string, billTotal?: number): BillLineItem[] {
  try {
    const arr = JSON.parse(json) as unknown[];
    if (!Array.isArray(arr)) return [];

    const items = arr
      .map((raw, i) => normalizeBillItem(raw, i))
      .filter((item): item is BillLineItem => item !== null);

    if (items.length === 1 && items[0].amount <= 0 && billTotal && billTotal > 0) {
      items[0] = {
        ...items[0],
        amount: billTotal,
        price: billTotal,
        quantity: 1,
      };
    }

    return items;
  } catch {
    return [];
  }
}

export function billItemsTotal(items: BillLineItem[]) {
  return items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
}

export function formatMoney(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

export function formatBillLineSummary(item: BillLineItem) {
  if (item.quantity > 1 || item.price > 0) {
    return `${item.name} (${item.quantity} × ₹${formatMoney(item.price)})`;
  }
  return item.name;
}
