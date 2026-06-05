import { prisma } from "@/lib/prisma";

export type ShopRatingSummary = {
  average: number;
  count: number;
};

export async function shopRatingSummaries(
  shopIds: string[]
): Promise<Map<string, ShopRatingSummary>> {
  if (shopIds.length === 0) return new Map();

  const rows = await prisma.shopRating.groupBy({
    by: ["shopId"],
    where: { shopId: { in: shopIds } },
    _avg: { rating: true },
    _count: { _all: true },
  });

  return new Map(
    rows.map((r) => [
      r.shopId,
      {
        average: r._avg.rating ?? 0,
        count: r._count._all,
      },
    ])
  );
}

export function clampRating(value: number) {
  return Math.min(5, Math.max(1, Math.round(value)));
}
