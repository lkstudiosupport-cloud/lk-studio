import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ShopOrderTabCounts = {
  all: number;
  pending: number;
  stitching: number;
  ready: number;
  completed: number;
};

const PENDING: OrderStatus[] = ["PENDING", "MEASURING"];
const COMPLETED: OrderStatus[] = ["DELIVERED"];

export const SHOP_STATUS_TAB_IDS = ["pending", "stitching", "ready", "completed"] as const;
export type ShopStatusTabId = (typeof SHOP_STATUS_TAB_IDS)[number];

export function orderStatusTabId(status: OrderStatus): ShopStatusTabId {
  if (PENDING.includes(status)) return "pending";
  if (status === "STITCHING") return "stitching";
  if (status === "READY") return "ready";
  return "completed";
}

export function orderMatchesTab(status: OrderStatus, tabId: string): boolean {
  if (tabId === "all") return true;
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
  const stitching = byStatus.STITCHING ?? 0;
  const ready = byStatus.READY ?? 0;
  const completed = COMPLETED.reduce((s, st) => s + (byStatus[st] ?? 0), 0);
  const cancelled = byStatus.CANCELLED ?? 0;
  const all = Object.values(byStatus).reduce((s, n) => s + n, 0) - cancelled;

  return { all, pending, stitching, ready, completed };
}

export async function shopDashboardStatusCounts(shopId: string) {
  const tabs = await shopOrderTabCounts(shopId);
  return {
    pending: tabs.pending,
    stitching: tabs.stitching,
    ready: tabs.ready,
    completed: tabs.completed,
  };
}
