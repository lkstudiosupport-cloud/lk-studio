import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { BillReceipt } from "@/components/BillReceipt";
import { BillShareActions } from "@/components/BillShareActions";
import { BillDetailPage } from "@/components/BillDetailPage";
import { billReceiptCustomer } from "@/lib/bill-customer";

export default async function CustomerBillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession(["CUSTOMER"]);
  const locale = await getLocale();
  const { id } = await params;

  const bill = await prisma.bill.findFirst({
    where: { id, customerId: session!.id },
    include: {
      customer: { select: { name: true, phone: true } },
      shop: {
        select: {
          shopName: true,
          address: true,
          phone: true,
          whatsapp: true,
          upiId: true,
        },
      },
    },
  });

  if (!bill) notFound();

  const receiptData = {
    billNumber: bill.billNumber,
    amount: bill.amount,
    advancePaid: bill.advancePaid,
    paidAmount: bill.paidAmount,
    paid: bill.paid,
    itemsJson: bill.itemsJson,
    notes: bill.notes,
    createdAt: bill.createdAt,
    shop: bill.shop,
    customer: billReceiptCustomer(bill),
  };

  return (
    <BillDetailPage
      actions={<BillShareActions locale={locale} backHref="/customer/bills" />}
    >
      <BillReceipt bill={receiptData} locale={locale} />
    </BillDetailPage>
  );
}
