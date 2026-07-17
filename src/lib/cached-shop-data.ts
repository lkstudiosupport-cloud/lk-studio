import { revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  LIST_PAGE_SIZE,
  DASHBOARD_ORDER_LIMIT,
  SHOP_ORDERS_PAGE_SIZE,
} from "@/lib/limits";
import { shopOrderTabCounts, shopDashboardStatusCounts } from "@/lib/order-stats";
import { startOfMonth, startOfWeek } from "@/lib/income";
import type { BillsDateMode, BillsTab } from "@/lib/bill-list-filter";
import { resolveBillsListFilter, shopBillsWhere } from "@/lib/bill-list-filter";

const SHOP_TAB_REVALIDATE_SEC = 45;

export type ShopWarmTab = "dashboard" | "orders" | "bills" | "workers" | "all";

export function shopTabCacheTag(shopId: string) {
  return `shop-tabs-${shopId}`;
}

export function revalidateShopTabCache(shopId: string) {
  revalidateTag(shopTabCacheTag(shopId));
}

export function shopWarmTabFromHref(href: string): ShopWarmTab {
  if (href === "/shop" || href.startsWith("/shop?")) return "dashboard";
  if (href.startsWith("/shop/orders")) return "orders";
  if (href.startsWith("/shop/bills")) return "bills";
  if (href.startsWith("/shop/workers")) return "workers";
  return "all";
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
    ["shop-dashboard-v2", shopId],
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
            images: { orderBy: { createdAt: "asc" }, take: 4 },
          },
          orderBy: { createdAt: "desc" },
          take: SHOP_ORDERS_PAGE_SIZE,
        }),
        prisma.priceRequest.findMany({
          where: { shopId },
          include: {
            customer: { select: { id: true, name: true, phone: true } },
            design: { select: { id: true, title: true, imagePath: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
        shopOrderTabCounts(shopId),
      ]);
      return { orders, priceRequests, tabCounts };
    },
    ["shop-orders-page-v2", shopId],
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
    ["shop-bills-counts-v2", shopId],
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
    ["shop-bills-list-v2", shopId, tab, mode, period],
    { revalidate: SHOP_TAB_REVALIDATE_SEC, tags: [shopTabCacheTag(shopId)] }
  )();
}

export async function getCachedShopWorkerRequests(shopId: string) {
  return unstable_cache(
    async () =>
      prisma.workerPartnerRequest.findMany({
        where: { shopId },
        orderBy: { createdAt: "desc" },
        take: 40,
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
    ["shop-workers-v2", shopId],
    { revalidate: SHOP_TAB_REVALIDATE_SEC, tags: [shopTabCacheTag(shopId)] }
  )();
}

async function warmOne(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    return true;
  } catch (err) {
    console.error(`[lk-studio] warm ${label} failed:`, err);
    return false;
  }
}

/** Warm one or all shop tab caches. Failures are isolated so one slow tab does not block others. */
export async function warmShopTabCaches(shopId: string, tab: ShopWarmTab = "all") {
  const { tab: billsTab, mode, period } = resolveBillsListFilter(undefined, undefined, undefined);

  if (tab === "dashboard") {
    await warmOne("dashboard", () => getCachedShopDashboard(shopId));
    return;
  }
  if (tab === "orders") {
    await warmOne("orders", () => getCachedShopOrdersPage(shopId));
    return;
  }
  if (tab === "bills") {
    await Promise.all([
      warmOne("bills-counts", () => getCachedShopBillsCounts(shopId)),
      warmOne("bills-list", () => getCachedShopBillsList(shopId, billsTab, mode, period)),
    ]);
    return;
  }
  if (tab === "workers") {
    await warmOne("workers", () => getCachedShopWorkerRequests(shopId));
    return;
  }

  // Priority: light tabs first, heavy orders last — allSettled so one failure doesn't kill the rest.
  await warmOne("dashboard", () => getCachedShopDashboard(shopId));
  await Promise.all([
    warmOne("workers", () => getCachedShopWorkerRequests(shopId)),
    warmOne("bills-counts", () => getCachedShopBillsCounts(shopId)),
    warmOne("bills-list", () => getCachedShopBillsList(shopId, billsTab, mode, period)),
  ]);
  await warmOne("orders", () => getCachedShopOrdersPage(shopId));
}
