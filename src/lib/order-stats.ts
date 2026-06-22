import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ShopOrderTabCounts = {
  pending: number;
  ready: number;
  completed: number;
};

const PENDING: OrderStatus[] = ["PENDING", "MEASURING", "STITCHING"];
const COMPLETED: OrderStatus[] = ["DELIVERED"];

export const SHOP_STATUS_TAB_IDS = ["pending", "ready", "completed"] as const;
export type ShopStatusTabId = (typeof SHOP_STATUS_TAB_IDS)[number];

export function orderStatusTabId(status: OrderStatus): ShopStatusTabId {
  if (PENDING.includes(status)) return "pending";
  if (status === "READY") return "ready";
  return "completed";
}

export function orderMatchesTab(status: OrderStatus, tabId: string): boolean {
  return orderStatusTabId(status) === tabId;
}

export async function shopOrderTabCounts(shopId: string): Promise<ShopOrderTabCounts> {
  const rows = await prisma.order.groupBy({
    by: ["status"],
    where: { shopId },
    _count: { _all: true },
  });

  const byStatus = Object.fromEntries(rows.map((r) => [r.status, r._count._all])) as Partial<
    Record<OrderStatus, number>
  >;

  const pending = PENDING.reduce((s, st) => s + (byStatus[st] ?? 0), 0);
  const ready = byStatus.READY ?? 0;
  const completed = COMPLETED.reduce((s, st) => s + (byStatus[st] ?? 0), 0);

  return { pending, ready, completed };
}

export async function shopDashboardStatusCounts(shopId: string) {
  return shopOrderTabCounts(shopId);
}
