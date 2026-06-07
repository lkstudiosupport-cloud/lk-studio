import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import { BillReceipt } from "@/components/BillReceipt";
import { BillReceiptShell } from "@/components/BillReceiptShell";
import { BillShareActions } from "@/components/BillShareActions";
import { BillDetailPage } from "@/components/BillDetailPage";
import { BillWhatsAppAutoSend } from "@/components/BillWhatsAppAutoSend";
import { BillPaymentPanel } from "@/components/BillPaymentPanel";
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

  const customerPhone = billCustomerPhone(bill);

  return (
    <BillDetailPage
      actions={
        <BillShareActions
          locale={locale}
          backHref="/shop/bills"
          customerPhone={customerPhone}
          billNumber={bill.billNumber}
          shopName={bill.shop.shopName}
          showWhatsApp
        />
      }
      extra={
        <BillWhatsAppAutoSend
          phone={customerPhone}
          billNumber={bill.billNumber}
          shopName={bill.shop.shopName}
          enabled={whatsapp === "1"}
          preparingLabel={t(locale, "sharingBill")}
        />
      }
      receipt={
        <BillReceiptShell locale={locale}>
          <BillReceipt bill={receiptData} locale={locale} />
        </BillReceiptShell>
      }
      paymentPanel={
        <BillPaymentPanel
          billId={bill.id}
          amount={bill.amount}
          advancePaid={bill.advancePaid}
          paidAmount={bill.paidAmount}
          paid={bill.paid}
          locale={locale}
        />
      }
    />
  );
}
