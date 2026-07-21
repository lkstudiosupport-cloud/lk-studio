import { prisma } from "@/lib/prisma";
import { DASHBOARD_ORDER_LIMIT, SHOP_ORDERS_PAGE_SIZE } from "@/lib/limits";
import { shopOrderTabCounts, shopDashboardStatusCounts } from "@/lib/order-stats";
import { startOfMonth, startOfWeek } from "@/lib/income";
import { billCustomerName } from "@/lib/bill-customer";
import {
  formatBillsPeriodLabel,
  resolveBillsListFilter,
  shopBillsWhere,
  type BillsDateMode,
  type BillsTab,
} from "@/lib/bill-list-filter";
import { parseShopMeasurementsJson } from "@/lib/shop-measurements";
import { LIST_PAGE_SIZE } from "@/lib/limits";
import { loadWorkSubmissionsForShopRequests } from "@/lib/work-requirement-sync";
import type {
  ShopBillsTabData,
  ShopDashboardTabData,
  ShopOrdersTabData,
  ShopWorkersTabData,
} from "@/lib/shop-tab-types";
import type { ShopOrderData } from "@/lib/shop-order-types";

function orderSubjectName(row: {
  customer: { name: string };
  person: { name: string } | null;
  shopMeasurementsJson: string | null;
}) {
  if (row.person?.name) return row.person.name;
  const shopMeas = parseShopMeasurementsJson(row.shopMeasurementsJson);
  if (shopMeas?.personName) return shopMeas.personName;
  return row.customer.name;
}

export async function loadShopDashboardTab(shopId: string): Promise<ShopDashboardTabData> {
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
    weeklyIncome: weeklyAgg._sum.amount ?? 0,
    monthlyIncome: monthlyAgg._sum.amount ?? 0,
    statusCounts: {
      pending: statusCounts.pending,
      ready: statusCounts.ready,
      completed: statusCounts.completed,
    },
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      customerName: o.customer.name,
      personName: o.person?.name ?? o.customer.name,
      designTitle: o.design?.title ?? null,
    })),
  };
}

export async function loadShopOrdersTab(shopId: string): Promise<ShopOrdersTabData> {
  const [orders, priceRequests, tabCounts] = await Promise.all([
    prisma.order.findMany({
      where: { shopId, status: { not: "CANCELLED" } },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        shopMeasurementsJson: true,
        customer: { select: { name: true } },
        person: { select: { name: true } },
        design: { select: { title: true } },
        orderFavorites: {
          take: 1,
          orderBy: { createdAt: "asc" },
          select: { design: { select: { title: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: SHOP_ORDERS_PAGE_SIZE,
    }),
    prisma.priceRequest.findMany({
      where: { shopId },
      select: {
        id: true,
        status: true,
        category: true,
        quotedPrice: true,
        shopReply: true,
        notes: true,
        customerImagePath: true,
        customer: { select: { id: true, name: true, phone: true } },
        design: { select: { id: true, title: true, imagePath: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    shopOrderTabCounts(shopId),
  ]);

  return {
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      customerName: o.customer.name,
      subjectName: orderSubjectName(o),
      designTitle:
        o.design?.title ?? o.orderFavorites[0]?.design?.title ?? null,
    })),
    priceRequests,
    tabCounts,
    truncated: orders.length >= SHOP_ORDERS_PAGE_SIZE,
    pageSize: SHOP_ORDERS_PAGE_SIZE,
  };
}

/** Full order payload for expand / WhatsApp share — loaded only when needed. */
export async function loadShopOrderDetail(
  shopId: string,
  orderId: string
): Promise<ShopOrderData | null> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, shopId, status: { not: "CANCELLED" } },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      person: { include: { measurements: true } },
      design: { select: { id: true, title: true, imagePath: true, category: true } },
      orderFavorites: {
        include: {
          design: { select: { id: true, title: true, imagePath: true, category: true } },
        },
      },
      images: { orderBy: { createdAt: "asc" }, take: 8 },
    },
  });
  return order as ShopOrderData | null;
}

export async function loadShopBillsTab(
  shopId: string,
  tabRaw?: string | null,
  modeRaw?: string | null,
  periodRaw?: string | null
): Promise<ShopBillsTabData> {
  const { tab, mode, period } = resolveBillsListFilter(
    tabRaw ?? undefined,
    modeRaw ?? undefined,
    periodRaw ?? undefined
  );
  const where = shopBillsWhere(shopId, tab as BillsTab, mode as BillsDateMode, period);
  const [bills, total, all, pending, paid] = await Promise.all([
    prisma.bill.findMany({
      where,
      include: { customer: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: LIST_PAGE_SIZE,
    }),
    prisma.bill.count({ where }),
    prisma.bill.count({ where: { shopId } }),
    prisma.bill.count({ where: { shopId, paid: false } }),
    prisma.bill.count({ where: { shopId, paid: true } }),
  ]);

  return {
    tab,
    mode,
    period,
    periodLabel: tab === "paid" ? formatBillsPeriodLabel(mode, period) : "",
    total,
    counts: { all, pending, paid },
    bills: bills.map((b) => ({
      id: b.id,
      billNumber: b.billNumber,
      amount: b.amount,
      advancePaid: b.advancePaid,
      paidAmount: b.paidAmount,
      paid: b.paid,
      itemsJson: b.itemsJson,
      notes: b.notes,
      createdAt: b.createdAt.toISOString(),
      displayName: billCustomerName(b),
    })),
  };
}

export async function loadShopWorkersTab(shopId: string): Promise<ShopWorkersTabData> {
  const requests = await prisma.workerPartnerRequest.findMany({
    where: {
      shopId,
      /** Shop list: open + accepted only — cancelled stay hidden. */
      status: { in: ["OPEN", "FILLED"] },
    },
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
      acceptedAt: true,
      acceptedPartner: {
        select: {
          id: true,
          name: true,
          phone: true,
          city: true,
          address: true,
          locationLink: true,
          yearsExperience: true,
          ratingSum: true,
          ratingCount: true,
        },
      },
      ratings: {
        where: { shopId },
        select: { rating: true },
        take: 1,
      },
    },
  });

  const requestIds = requests.map((r) => r.id);
  const submissionRows = await loadWorkSubmissionsForShopRequests(shopId, requestIds);
  const appsByRequest = new Map<string, typeof submissionRows>();
  for (const row of submissionRows) {
    const list = appsByRequest.get(row.workerPartnerRequestId) ?? [];
    list.push(row);
    appsByRequest.set(row.workerPartnerRequestId, list);
  }

  return {
    requests: requests.map((r) => {
      const partner = r.acceptedPartner;
      const applications = (appsByRequest.get(r.id) ?? []).map((a) => ({
        id: a.id,
        status: a.status,
        notes: a.notes,
        createdAt: a.createdAt.toISOString(),
        workerId: a.workerId,
        workerName: a.workerName,
        workerPhone: a.workerPhone,
        workerCity: a.workerCity,
        jobsCompleted: a.jobsCompleted,
        ratingQualityAvg: a.ratingQualityAvg,
        ratingPerformanceAvg: a.ratingPerformanceAvg,
        profilePhoto: a.profilePhoto,
      }));
      return {
        id: r.id,
        role: r.role,
        customRole: r.customRole,
        neededFrom: r.neededFrom.toISOString().slice(0, 10),
        durationType: r.durationType,
        customDays: r.customDays,
        notes: r.notes,
        city: r.city,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        acceptedAt: r.acceptedAt?.toISOString() ?? null,
        acceptedPartner: partner
          ? {
              id: partner.id,
              name: partner.name,
              phone: partner.phone,
              city: partner.city,
              address: partner.address,
              locationLink: partner.locationLink,
              yearsExperience: partner.yearsExperience,
              ratingAvg:
                partner.ratingCount > 0
                  ? Math.round((partner.ratingSum / partner.ratingCount) * 10) / 10
                  : null,
              ratingCount: partner.ratingCount,
            }
          : null,
        shopRating: r.ratings[0]?.rating ?? null,
        applications,
      };
    }),
  };
}
