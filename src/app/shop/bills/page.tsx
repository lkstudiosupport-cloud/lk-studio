import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import { BillCard } from "@/components/BillCard";
import { LIST_PAGE_SIZE } from "@/lib/limits";
import { billCustomerName } from "@/lib/bill-customer";
import { Plus } from "lucide-react";

export default async function ShopBillsPage() {
  const session = await requireSession(["SHOP"]);
  const locale = await getLocale();
  const shopId = session!.shopId!;

  const [bills, billTotal] = await Promise.all([
    prisma.bill.findMany({
      where: { shopId },
      include: { customer: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: LIST_PAGE_SIZE,
    }),
    prisma.bill.count({ where: { shopId } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">{t(locale, "payments")}</h1>
        <Link
          href="/shop/bills/new"
          className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-sm"
        >
          <Plus className="h-4 w-4" />
          {t(locale, "createBill")}
        </Link>
      </div>

      {billTotal > bills.length && (
        <p className="text-center text-xs text-zinc-500">
          {t(locale, "showingLatestBills").replace("{n}", String(LIST_PAGE_SIZE))}
        </p>
      )}

      <div className="space-y-4">
        {bills.map((b) => (
          <BillCard
            key={b.id}
            bill={{
              ...b,
              displayName: billCustomerName(b),
            }}
            locale={locale}
            href={`/shop/bills/${b.id}`}
            shopMode
          />
        ))}
        {bills.length === 0 && (
          <div className="card-premium space-y-4 p-8 text-center">
            <p className="text-zinc-600">{t(locale, "noBills")}</p>
            <Link
              href="/shop/bills/new"
              className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm"
            >
              <Plus className="h-4 w-4" />
              {t(locale, "createBill")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
