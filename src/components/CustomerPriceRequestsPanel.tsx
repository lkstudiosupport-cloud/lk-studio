import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { categoryLabelKey } from "@/lib/categories";
import type { Design, PriceRequest, PriceRequestStatus, ServiceCategory, ShopProfile } from "@prisma/client";

type Row = PriceRequest & {
  shop: Pick<ShopProfile, "id" | "shopName">;
  design: Pick<Design, "id" | "title" | "imagePath"> | null;
};

export function CustomerPriceRequestsPanel({ locale, requests }: { locale: Locale; requests: Row[] }) {
  if (requests.length === 0) {
    return (
      <div className="card-premium space-y-3 p-8 text-center">
        <p className="text-zinc-600">{t(locale, "noPriceRequestsCustomer")}</p>
        <Link href="/customer/shops" className="btn-primary inline-flex px-5 py-2.5 text-sm">
          {t(locale, "browseShops")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((req) => (
        <article key={req.id} className="card-premium overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-green/10 px-4 py-3">
            <p className="font-bold text-brand-green">{req.shop.shopName}</p>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                req.status === "QUOTED"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-900"
              }`}
            >
              {req.status === "QUOTED" ? t(locale, "priceQuoted") : t(locale, "pricePending")}
            </span>
          </div>
          <div className="space-y-3 p-4">
            <p className="text-xs text-zinc-500">
              {t(locale, categoryLabelKey(req.category as ServiceCategory))}
            </p>
            <div className="flex flex-wrap gap-3">
              {req.design && (
                <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-brand-green/15">
                  <Image src={req.design.imagePath} alt={req.design.title} fill className="object-cover" unoptimized />
                </div>
              )}
              {req.customerImagePath && (
                <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-brand-green/15">
                  <Image src={req.customerImagePath} alt="" fill className="object-cover" unoptimized />
                </div>
              )}
            </div>
            {req.notes && <p className="text-sm text-zinc-600">{req.notes}</p>}
            {req.status === "QUOTED" && req.quotedPrice != null ? (
              <p className="text-xl font-bold text-brand-green">
                ₹{req.quotedPrice.toFixed(0)}
                {req.shopReply && (
                  <span className="mt-1 block text-sm font-normal text-zinc-600">{req.shopReply}</span>
                )}
              </p>
            ) : (
              <p className="text-sm text-zinc-500">{t(locale, "waitingForShopQuote")}</p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
