import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { billCustomerName } from "@/lib/bill-customer";
import { LIST_PAGE_SIZE } from "@/lib/limits";
import {
  formatBillsPeriodLabel,
  resolveBillsListFilter,
  shopBillsWhere,
} from "@/lib/bill-list-filter";
import { ShopBillsPanel } from "@/components/ShopBillsPanel";
import { withDbRetry } from "@/lib/safe-db";
import { ServerRetryPanel } from "@/components/ServerRetryPanel";

export default async function ShopBillsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; mode?: string; period?: string }>;
}) {
  const session = await requireSession(["SHOP"]);
  const locale = await getLocale();
  const shopId = session!.shopId!;
  const params = await searchParams;
  const { tab, mode, period } = resolveBillsListFilter(params.tab, params.mode, params.period);
  const where = shopBillsWhere(shopId, tab, mode, period);

  try {
    const [bills, total, counts] = await withDbRetry(() =>
      Promise.all([
        prisma.bill.findMany({
          where,
          include: { customer: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
          take: LIST_PAGE_SIZE,
        }),
        prisma.bill.count({ where }),
        Promise.all([
          prisma.bill.count({ where: { shopId } }),
          prisma.bill.count({ where: { shopId, paid: false } }),
          prisma.bill.count({ where: { shopId, paid: true } }),
        ]).then(([all, pending, paid]) => ({ all, pending, paid })),
      ])
    );

    const periodLabel = tab === "paid" ? formatBillsPeriodLabel(mode, period) : "";

    return (
      <ShopBillsPanel
        locale={locale}
        tab={tab}
        mode={mode}
        period={period}
        periodLabel={periodLabel}
        total={total}
        counts={counts}
        bills={bills.map((b) => ({
          ...b,
          displayName: billCustomerName(b),
        }))}
      />
    );
  } catch (err) {
    console.error("[lk-studio] shop bills error:", err);
    return <ServerRetryPanel locale={locale} />;
  }
}
