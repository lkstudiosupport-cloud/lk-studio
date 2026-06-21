import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-access";
import { getLocale } from "@/lib/locale-server";
import { AdminShopInspector } from "@/components/AdminShopInspector";
import { LIST_PAGE_SIZE } from "@/lib/limits";

export default async function AdminShopDetailPage({
  params,
}: {
  params: Promise<{ shopId: string }>;
}) {
  await requireAdminSession();
  const locale = await getLocale();
  const { shopId } = await params;

  const shop = await prisma.shopProfile.findUnique({
    where: { id: shopId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  });
  if (!shop) notFound();

  const [designs, orders, bills, priceRequests] = await Promise.all([
    prisma.design.findMany({
      where: { shopId, isCatalog: false, active: true },
      orderBy: { createdAt: "desc" },
      take: LIST_PAGE_SIZE,
    }),
    prisma.order.findMany({
      where: { shopId },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        design: { select: { id: true, title: true, imagePath: true, category: true } },
        images: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      take: LIST_PAGE_SIZE,
    }),
    prisma.bill.findMany({
      where: { shopId },
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
      take: LIST_PAGE_SIZE,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/shops" className="text-sm text-brand-green underline">
          ← All shops
        </Link>
        <h1 className="page-title mt-2">{shop.shopName}</h1>
        <p className="text-sm text-zinc-600">
          {shop.shopCode} · Security view (read-only)
        </p>
      </div>

      <AdminShopInspector
        locale={locale}
        shop={shop}
        owner={shop.user}
        designs={designs}
        orders={orders}
        bills={bills}
        priceRequests={priceRequests}
      />
    </div>
  );
}
