type BillCustomerFields = {
  customerName?: string | null;
  customerPhone?: string | null;
  customer?: {
    name: string;
    phone?: string | null;
    whatsapp?: string | null;
  } | null;
};

export function billCustomerName(bill: BillCustomerFields) {
  return bill.customerName?.trim() || bill.customer?.name || "Customer";
}

export function billCustomerPhone(bill: BillCustomerFields) {
  return (
    bill.customerPhone?.trim() ||
    bill.customer?.whatsapp ||
    bill.customer?.phone ||
    null
  );
}

export function billReceiptCustomer(bill: BillCustomerFields) {
  return {
    name: billCustomerName(bill),
    phone: billCustomerPhone(bill),
  };
}
