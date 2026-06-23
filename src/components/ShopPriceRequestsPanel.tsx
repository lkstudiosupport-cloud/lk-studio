"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { replyPriceRequest } from "@/app/shop/actions";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { categoryLabelKey } from "@/lib/categories";
import type { ShopPriceRequestRow } from "@/lib/shop-price-request-types";
import type { PriceRequestStatus, ServiceCategory } from "@prisma/client";

function statusLabel(locale: Locale, status: PriceRequestStatus) {
  return status === "QUOTED" ? t(locale, "priceQuoted") : t(locale, "pricePending");
}

export function ShopPriceRequestsPanel({ locale, requests }: { locale: Locale; requests: ShopPriceRequestRow[] }) {
  if (requests.length === 0) {
    return (
      <p className="card-premium p-8 text-center text-zinc-500">{t(locale, "noPriceRequestsYet")}</p>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((req) => (
        <ShopPriceRequestCard key={req.id} locale={locale} request={req} />
      ))}
    </div>
  );
}

function ShopPriceRequestCard({ locale, request }: { locale: Locale; request: ShopPriceRequestRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <article className="card-premium overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-green/10 bg-brand-cream/50 px-4 py-3">
        <div>
          <p className="font-bold text-brand-green">{request.customer.name}</p>
          {request.customer.phone && (
            <p className="text-xs text-zinc-600">{request.customer.phone}</p>
          )}
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            request.status === "QUOTED"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-amber-100 text-amber-900"
          }`}
        >
          {statusLabel(locale, request.status)}
        </span>
      </div>

      <div className="space-y-3 p-4">
        <p className="text-xs font-medium text-zinc-500">
          {t(locale, categoryLabelKey(request.category as ServiceCategory))}
        </p>

        <div className="grid grid-cols-2 gap-3">
          {request.design && (
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-brand-green">
                {t(locale, "shopDesign")}
              </p>
              <div className="overflow-hidden rounded-lg border border-brand-green/15">
                <div className="relative aspect-square">
                  <Image
                    src={request.design.imagePath}
                    alt={request.design.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <p className="truncate px-2 py-1 text-xs font-medium">{request.design.title}</p>
              </div>
            </div>
          )}
          {request.customerImagePath && (
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-brand-green">
                {t(locale, "customerOwnPhoto")}
              </p>
              <div className="overflow-hidden rounded-lg border border-brand-green/15">
                <div className="relative aspect-square">
                  <Image
                    src={request.customerImagePath}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {request.notes && (
          <p className="rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-700">{request.notes}</p>
        )}

        {request.status === "QUOTED" && request.quotedPrice != null && (
          <p className="text-lg font-bold text-brand-green">
            ₹{request.quotedPrice.toFixed(0)}
            {request.shopReply && (
              <span className="mt-1 block text-sm font-normal text-zinc-600">{request.shopReply}</span>
            )}
          </p>
        )}

        {request.status === "PENDING" && (
          <form
            className="space-y-2 border-t border-brand-green/10 pt-3"
            onSubmit={(e) => {
              e.preventDefault();
              setError("");
              const fd = new FormData(e.currentTarget);
              startTransition(async () => {
                try {
                  await replyPriceRequest(fd);
                  router.refresh();
                } catch (err) {
                  setError(err instanceof Error ? err.message : t(locale, "sendQuoteFailed"));
                }
              });
            }}
          >
            <input type="hidden" name="requestId" value={request.id} />
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-brand-green">
                {t(locale, "quotedPrice")}
              </span>
              <input
                name="quotedPrice"
                type="number"
                min="0"
                step="1"
                required
                className="input-premium w-full"
                placeholder="₹"
              />
            </label>
            <textarea
              name="shopReply"
              rows={2}
              className="input-premium w-full text-sm"
              placeholder={t(locale, "shopReplyPlaceholder")}
            />
            <button type="submit" disabled={pending} className="btn-primary w-full text-sm">
              {pending ? t(locale, "sendingQuote") : t(locale, "sendQuote")}
            </button>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </form>
        )}
      </div>
    </article>
  );
}
