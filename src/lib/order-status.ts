import type { OrderStatus } from "@prisma/client";

export const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "MEASURING",
  "STITCHING",
  "READY",
  "DELIVERED",
  "CANCELLED",
];

export function statusLabelKey(status: OrderStatus) {
  return `status.${status.toLowerCase()}`;
}
