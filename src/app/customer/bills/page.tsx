import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import { BillCard } from "@/components/BillCard";
import { LIST_PAGE_SIZE } from "@/lib/limits";

export default async function CustomerBillsPage() {
  const session = await requireSession(["CUSTOMER"]);
  const locale = await getLocale();
  const customerId = session!.id;

  const [bills, total] = await Promise.all([
    prisma.bill.findMany({
      where: { customerId },
      include: { shop: { select: { shopName: true } } },
      orderBy: { createdAt: "desc" },
      take: LIST_PAGE_SIZE,
    }),
    prisma.bill.count({ where: { customerId } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="page-title">{t(locale, "myBills")}</h1>
      <p className="text-sm text-zinc-600">{t(locale, "myBillsHint")}</p>

      {total > bills.length && (
        <p className="text-center text-xs text-zinc-500">
          {t(locale, "showingLatestBills").replace("{n}", String(LIST_PAGE_SIZE))}
        </p>
      )}

      <div className="space-y-4">
        {bills.map((b) => (
          <BillCard key={b.id} bill={b} locale={locale} showShop href={`/customer/bills/${b.id}`} />
        ))}
        {bills.length === 0 && (
          <div className="card-premium space-y-3 p-8 text-center">
            <p className="text-zinc-600">{t(locale, "noBillsHint")}</p>
            <Link
              href="/customer/shops"
              className="btn-primary inline-flex items-center justify-center px-5 py-2.5 text-sm"
            >
              {t(locale, "browseShops")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
