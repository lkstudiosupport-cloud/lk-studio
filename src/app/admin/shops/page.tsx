import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-access";

export default async function AdminShopsPage() {
  await requireAdminSession();

  const shops = await prisma.shopProfile.findMany({
    include: {
      user: { select: { name: true, phone: true, email: true } },
      _count: { select: { orders: true, designs: true, bills: true, priceRequests: true } },
    },
    orderBy: { shopName: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">All shops</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Security oversight — view any shop&apos;s designs, orders, bills, and uploaded images.
        </p>
      </div>

      {shops.length === 0 ? (
        <p className="card-premium py-10 text-center text-sm text-zinc-500">No shops registered yet.</p>
      ) : (
        <ul className="space-y-3">
          {shops.map((shop) => (
            <li key={shop.id}>
              <Link
                href={`/admin/shops/${shop.id}`}
                className="card-premium flex flex-wrap items-center justify-between gap-3 p-4 transition hover:ring-2 hover:ring-brand-gold/40"
              >
                <div>
                  <p className="font-bold text-brand-green">{shop.shopName}</p>
                  <p className="text-sm text-zinc-600">
                    {shop.shopCode}
                    {shop.phone ? ` · ${shop.phone}` : ""}
                  </p>
                  <p className="text-xs text-zinc-500">{shop.user.email}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-brand-cream px-2.5 py-1 text-brand-green">
                    {shop._count.orders} orders
                  </span>
                  <span className="rounded-full bg-brand-cream px-2.5 py-1 text-brand-green">
                    {shop._count.designs} designs
                  </span>
                  <span className="rounded-full bg-brand-cream px-2.5 py-1 text-brand-green">
                    {shop._count.bills} bills
                  </span>
                  <span className="rounded-full bg-brand-gold/20 px-2.5 py-1 text-brand-green">
                    {shop.subscriptionStatus}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
