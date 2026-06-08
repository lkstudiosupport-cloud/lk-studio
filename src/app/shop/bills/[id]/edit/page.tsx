import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { MultiPieceBillForm } from "@/components/MultiPieceBillForm";
import { parseBillItems } from "@/lib/bill-items";
import { billReceiptCustomer } from "@/lib/bill-customer";

export default async function ShopEditBillPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession(["SHOP"]);
  const locale = await getLocale();
  const { id } = await params;

  const bill = await prisma.bill.findFirst({
    where: { id, shopId: session!.shopId! },
    select: {
      id: true,
      customerName: true,
      customerPhone: true,
      amount: true,
      advancePaid: true,
      paidAmount: true,
      itemsJson: true,
      customer: { select: { name: true, phone: true, whatsapp: true } },
    },
  });

  if (!bill) notFound();

  const customer = billReceiptCustomer(bill);
  const items = parseBillItems(bill.itemsJson, bill.amount);

  return (
    <MultiPieceBillForm
      locale={locale}
      customers={[]}
      editBillId={bill.id}
      initialCustomerName={customer.name}
      initialCustomerPhone={customer.phone ?? ""}
      initialLines={items}
      initialAdvancePaid={bill.advancePaid}
      initialPaidAmount={bill.paidAmount}
      hideCustomerSection
    />
  );
}
