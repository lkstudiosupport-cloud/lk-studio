import { revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { LIST_PAGE_SIZE, DASHBOARD_ORDER_LIMIT } from "@/lib/limits";
import { shopOrderTabCounts, shopDashboardStatusCounts } from "@/lib/order-stats";
import { startOfMonth, startOfWeek } from "@/lib/income";
import type { BillsDateMode, BillsTab } from "@/lib/bill-list-filter";
import { resolveBillsListFilter, shopBillsWhere } from "@/lib/bill-list-filter";

const SHOP_TAB_REVALIDATE_SEC = 25;

export function shopTabCacheTag(shopId: string) {
  return `shop-tabs-${shopId}`;
}

export function revalidateShopTabCache(shopId: string) {
  revalidateTag(shopTabCacheTag(shopId));
}

export async function getCachedShopDashboard(shopId: string) {
  return unstable_cache(
    async () => {
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
      return {
        orders,
        weeklyIncome: weeklyAgg._sum.amount ?? 0,
        monthlyIncome: monthlyAgg._sum.amount ?? 0,
        statusCounts,
      };
    },
    ["shop-dashboard", shopId],
    { revalidate: SHOP_TAB_REVALIDATE_SEC, tags: [shopTabCacheTag(shopId)] }
  )();
}

export async function getCachedShopOrdersPage(shopId: string) {
  return unstable_cache(
    async () => {
      const [orders, priceRequests, tabCounts] = await Promise.all([
        prisma.order.findMany({
          where: { shopId, status: { not: "CANCELLED" } },
          include: {
            customer: { select: { id: true, name: true, phone: true } },
            person: { include: { measurements: true } },
            design: { select: { id: true, title: true, imagePath: true, category: true } },
            orderFavorites: {
              include: {
                design: { select: { id: true, title: true, imagePath: true, category: true } },
              },
            },
            images: { orderBy: { createdAt: "asc" }, take: 6 },
          },
          orderBy: { createdAt: "desc" },
          take: LIST_PAGE_SIZE,
        }),
        prisma.priceRequest.findMany({
          where: { shopId },
          include: {
            customer: { select: { id: true, name: true, phone: true } },
            design: { select: { id: true, title: true, imagePath: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 40,
        }),
        shopOrderTabCounts(shopId),
      ]);
      return { orders, priceRequests, tabCounts };
    },
    ["shop-orders-page", shopId],
    { revalidate: SHOP_TAB_REVALIDATE_SEC, tags: [shopTabCacheTag(shopId)] }
  )();
}

export async function getCachedShopBillsCounts(shopId: string) {
  return unstable_cache(
    async () => {
      const [all, pending, paid] = await Promise.all([
        prisma.bill.count({ where: { shopId } }),
        prisma.bill.count({ where: { shopId, paid: false } }),
        prisma.bill.count({ where: { shopId, paid: true } }),
      ]);
      return { all, pending, paid };
    },
    ["shop-bills-counts", shopId],
    { revalidate: SHOP_TAB_REVALIDATE_SEC, tags: [shopTabCacheTag(shopId)] }
  )();
}

export async function getCachedShopBillsList(
  shopId: string,
  tab: BillsTab,
  mode: BillsDateMode,
  period: string
) {
  const where = shopBillsWhere(shopId, tab, mode, period);
  return unstable_cache(
    async () => {
      const [bills, total] = await Promise.all([
        prisma.bill.findMany({
          where,
          include: { customer: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
          take: LIST_PAGE_SIZE,
        }),
        prisma.bill.count({ where }),
      ]);
      return { bills, total };
    },
    ["shop-bills-list", shopId, tab, mode, period],
    { revalidate: SHOP_TAB_REVALIDATE_SEC, tags: [shopTabCacheTag(shopId)] }
  )();
}

export async function getCachedShopWorkerRequests(shopId: string) {
  return unstable_cache(
    async () =>
      prisma.workerPartnerRequest.findMany({
        where: { shopId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          role: true,
          customRole: true,
          neededFrom: true,
          durationType: true,
          customDays: true,
          notes: true,
          city: true,
          status: true,
          createdAt: true,
        },
      }),
    ["shop-workers", shopId],
    { revalidate: SHOP_TAB_REVALIDATE_SEC, tags: [shopTabCacheTag(shopId)] }
  )();
}

/** Warm all shop tab caches in parallel (call once after shop login). */
export async function warmShopTabCaches(shopId: string) {
  const { tab, mode, period } = resolveBillsListFilter(undefined, undefined, undefined);
  await Promise.all([
    getCachedShopDashboard(shopId),
    getCachedShopOrdersPage(shopId),
    getCachedShopBillsCounts(shopId),
    getCachedShopBillsList(shopId, tab, mode, period),
    getCachedShopWorkerRequests(shopId),
  ]);
}
