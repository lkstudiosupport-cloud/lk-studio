import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import { ShopBillDetailView } from "@/components/ShopBillDetailView";
import { billCustomerPhone, billReceiptCustomer } from "@/lib/bill-customer";

export default async function ShopBillDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ whatsapp?: string }>;
}) {
  const session = await requireSession(["SHOP"]);
  const locale = await getLocale();
  const { id } = await params;
  const { whatsapp } = await searchParams;

  const bill = await prisma.bill.findFirst({
    where: { id, shopId: session!.shopId! },
    include: {
      customer: { select: { name: true, phone: true, whatsapp: true } },
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
    <ShopBillDetailView
      locale={locale}
      billId={bill.id}
      receiptData={receiptData}
      customerPhone={billCustomerPhone(bill)}
      isPostCreate={whatsapp === "1"}
      preparingLabel={t(locale, "sharingBill")}
      errorLabel={t(locale, "shareBillFailed")}
      fallbackHint={t(locale, "shareBillFallback")}
    />
  );
}
