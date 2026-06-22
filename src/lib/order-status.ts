import type { OrderStatus } from "@prisma/client";

export const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "MEASURING",
  "STITCHING",
  "READY",
  "DELIVERED",
  "CANCELLED",
];

/** Status options shown in shop order status dropdown. */
export const SHOP_ORDER_STATUSES: OrderStatus[] = ["PENDING", "READY", "DELIVERED"];

export function statusLabelKey(status: OrderStatus) {
  return `status.${status.toLowerCase()}`;
}

export function shopStatusLabelKey(status: OrderStatus): string {
  if (status === "READY") return "status.readyToPick";
  return statusLabelKey(status);
}
