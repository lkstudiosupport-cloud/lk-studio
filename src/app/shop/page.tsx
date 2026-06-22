import { prisma } from "@/lib/prisma";
import { ShopDashboard } from "@/components/ShopDashboard";
import { startOfMonth, startOfWeek } from "@/lib/income";
import { shopDashboardStatusCounts } from "@/lib/order-stats";
import { DASHBOARD_ORDER_LIMIT } from "@/lib/limits";
import { cachedLocale, cachedShopSession } from "@/lib/cached-server";

export default async function ShopDashboardPage() {
  const session = await cachedShopSession();
  const locale = await cachedLocale();
  const shopId = session!.shopId!;
  const weekStart = startOfWeek();
  const monthStart = startOfMonth();

  const [orders, weeklyAgg, monthlyAgg, statusCounts] = await Promise.all([
    prisma.order.findMany({

      where: { shopId, status: { not: "CANCELLED" } },

      select: {

        id: true,

        orderNumber: true,

        status: true,

        customer: { select: { name: true } },

        person: { select: { name: true } },

        design: { select: { title: true } },

      },

      orderBy: { createdAt: "desc" },

      take: DASHBOARD_ORDER_LIMIT,

    }),

    prisma.bill.aggregate({

      where: { shopId, createdAt: { gte: weekStart } },

      _sum: { amount: true },

    }),

    prisma.bill.aggregate({

      where: { shopId, createdAt: { gte: monthStart } },

      _sum: { amount: true },

    }),

    shopDashboardStatusCounts(shopId),

  ]);



  const weeklyIncome = weeklyAgg._sum.amount ?? 0;

  const monthlyIncome = monthlyAgg._sum.amount ?? 0;



  return (
    <ShopDashboard
      locale={locale}
      weeklyIncome={weeklyIncome}
      monthlyIncome={monthlyIncome}
      statusCounts={statusCounts}
      orders={orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        customerName: o.customer.name,
        personName: o.person?.name ?? o.customer.name,
        designTitle: o.design?.title ?? null,
      }))}
    />
  );
}
