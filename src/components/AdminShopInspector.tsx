import Image from "next/image";
import type { Bill, Design, Order, OrderImage, PriceRequest, ShopProfile, User } from "@prisma/client";
import { DesignImagesView } from "@/components/DesignImagesView";
import { OrderImageGallery } from "@/components/OrderImageGallery";
import { resolveDesignImageUrl } from "@/lib/design-image-url";
import { categoryLabelKey } from "@/lib/categories";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";

type OrderRow = Order & {
  customer: Pick<User, "id" | "name" | "phone">;
  images: OrderImage[];
  design: Pick<Design, "id" | "title" | "imagePath" | "category"> | null;
};

type PriceRow = PriceRequest & {
  customer: Pick<User, "id" | "name" | "phone">;
  design: Pick<Design, "id" | "title" | "imagePath"> | null;
};

function AdminImageThumb({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const url = resolveDesignImageUrl(src);
  return (
    <div
      className={`relative aspect-square overflow-hidden rounded-xl border border-brand-green/10 ${className}`}
    >
      <Image src={url} alt={alt} fill className="object-cover" unoptimized />
    </div>
  );
}

export function AdminShopInspector({
  locale,
  shop,
  owner,
  designs,
  orders,
  bills,
  priceRequests,
}: {
  locale: Locale;
  shop: ShopProfile;
  owner: Pick<User, "id" | "name" | "email" | "phone">;
  designs: Design[];
  orders: OrderRow[];
  bills: Bill[];
  priceRequests: PriceRow[];
}) {
  return (
    <div className="space-y-8">
      <section className="card-premium space-y-4 p-4">
        <h2 className="text-lg font-bold text-brand-green">Shop profile</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500">Owner</dt>
            <dd className="font-medium">{owner.name}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Email</dt>
            <dd className="font-medium">{owner.email}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Phone</dt>
            <dd className="font-medium">{shop.phone ?? owner.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Subscription</dt>
            <dd className="font-medium">{shop.subscriptionStatus}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-zinc-500">Address</dt>
            <dd className="font-medium">{shop.address ?? "—"}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-4">
          {shop.profilePhoto && (
            <div>
              <p className="mb-1 text-xs font-semibold text-zinc-500">Profile photo</p>
              <AdminImageThumb src={shop.profilePhoto} alt="Shop profile" className="h-24 w-24" />
            </div>
          )}
          {shop.upiQrImage && (
            <div>
              <p className="mb-1 text-xs font-semibold text-zinc-500">UPI QR</p>
              <AdminImageThumb src={shop.upiQrImage} alt="UPI QR" className="h-24 w-24" />
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-brand-green">
          Stitched designs ({designs.length})
        </h2>
        {designs.length === 0 ? (
          <p className="text-sm text-zinc-500">No shop-uploaded designs.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {designs.map((d) => (
              <article key={d.id} className="card-premium overflow-hidden">
                <DesignImagesView
                  imagePath={d.imagePath}
                  imagesJson={d.imagesJson}
                  alt={d.title}
                  aspectClass="aspect-[3/4]"
                />
                <p className="truncate px-2 py-2 text-xs font-medium text-brand-green">{d.title}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-brand-green">Recent orders ({orders.length})</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-zinc-500">No orders.</p>
        ) : (
          <ul className="space-y-4">
            {orders.map((order) => (
              <li key={order.id} className="card-premium p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-brand-green">{order.orderNumber}</p>
                    <p className="text-sm text-zinc-600">
                      {order.customer.name}
                      {order.customer.phone ? ` · ${order.customer.phone}` : ""}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {t(locale, categoryLabelKey(order.category))} · {order.status} ·{" "}
                      {order.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <OrderImageGallery
                  locale={locale}
                  images={order.images}
                  legacyJson={order.customerRefImages}
                  extras={{
                    cloth: order.clothImagePath,
                    workDesign: order.workDesignImagePath,
                    design: order.design?.imagePath,
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-brand-green">Recent bills ({bills.length})</h2>
        {bills.length === 0 ? (
          <p className="text-sm text-zinc-500">No bills.</p>
        ) : (
          <ul className="space-y-2">
            {bills.map((bill) => (
              <li key={bill.id} className="card-premium flex flex-wrap justify-between gap-2 p-3 text-sm">
                <span className="font-semibold text-brand-green">{bill.billNumber}</span>
                <span>
                  ₹{bill.amount.toFixed(0)} · paid ₹{bill.paidAmount.toFixed(0)}
                </span>
                <span className="text-zinc-500">{bill.createdAt.toLocaleDateString()}</span>
                {bill.customerName && (
                  <span className="w-full text-zinc-600">
                    {bill.customerName}
                    {bill.customerPhone ? ` · ${bill.customerPhone}` : ""}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-brand-green">
          Price requests ({priceRequests.length})
        </h2>
        {priceRequests.length === 0 ? (
          <p className="text-sm text-zinc-500">No price requests.</p>
        ) : (
          <ul className="space-y-3">
            {priceRequests.map((req) => (
              <li key={req.id} className="card-premium p-4">
                <p className="text-sm font-semibold text-brand-green">
                  {req.customer.name}
                  {req.customer.phone ? ` · ${req.customer.phone}` : ""}
                </p>
                <p className="text-xs text-zinc-500">
                  {t(locale, categoryLabelKey(req.category))} · {req.status} ·{" "}
                  {req.createdAt.toLocaleDateString()}
                </p>
                {req.notes && <p className="mt-1 text-sm text-zinc-600">{req.notes}</p>}
                {req.customerImagePath && (
                  <div className="mt-2 w-32">
                    <AdminImageThumb src={req.customerImagePath} alt="Customer reference" />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
