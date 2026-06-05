import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import { CustomerOrderCard } from "@/components/CustomerOrderCard";
import { LIST_PAGE_SIZE } from "@/lib/limits";

export default async function CustomerOrdersPage() {
  const session = await requireSession(["CUSTOMER"]);
  const locale = await getLocale();
  const customerId = session!.id;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { customerId },
      include: {
        person: { include: { measurements: true } },
        design: { select: { id: true, title: true, imagePath: true, category: true } },
        shop: { select: { id: true, shopName: true, phone: true, whatsapp: true } },
        rating: { select: { rating: true } },
        orderFavorites: {
          include: {
            design: { select: { id: true, title: true, imagePath: true, category: true } },
          },
        },
        images: { orderBy: { createdAt: "asc" }, take: 12 },
      },
      orderBy: { createdAt: "desc" },
      take: LIST_PAGE_SIZE,
    }),
    prisma.order.count({ where: { customerId } }),
  ]);

  return (
    <div>
      <h1 className="page-title mb-2">{t(locale, "myOrders")}</h1>
      <p className="mb-6 text-sm text-zinc-600">{t(locale, "myOrdersHint")}</p>

      {total > orders.length && (
        <p className="mb-4 text-center text-xs text-zinc-500">
          {t(locale, "showingLatestOrders").replace("{n}", String(LIST_PAGE_SIZE))}
        </p>
      )}

      <div className="space-y-5">
        {orders.map((o) => (
          <CustomerOrderCard key={o.id} order={o} locale={locale} />
        ))}
        {orders.length === 0 && (
          <div className="card-premium space-y-3 p-8 text-center">
            <p className="text-zinc-600">{t(locale, "noOrdersHint")}</p>
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
