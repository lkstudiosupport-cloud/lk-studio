"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { MeasurementListView } from "./MeasurementListView";
import { OrderStatusForm } from "./OrderStatusForm";
import { OrderSelectedDesigns } from "./OrderSelectedDesigns";
import { OrderImageGallery } from "./OrderImageGallery";
import { UserRound, Shirt, Ruler, ChevronDown, Share2 } from "lucide-react";
import { pickMeasurementForType } from "@/lib/measurements";
import {
  parseShopMeasurementsJson,
  shopMeasurementsToRecord,
} from "@/lib/shop-measurements";
import type { ServiceCategory } from "@prisma/client";
import type { ShopOrderData, ShopOrderDesignItem } from "@/lib/shop-order-types";
import type { ShopOrderListItem } from "@/lib/shop-tab-types";
import { shareOrderWorkViaWhatsApp } from "@/lib/share-order-work";
import { clearShopTabCache } from "@/lib/shop-tab-client-cache";

const detailCache = new Map<string, ShopOrderData>();

async function fetchOrderDetail(orderId: string): Promise<ShopOrderData> {
  const cached = detailCache.get(orderId);
  if (cached) return cached;
  const res = await fetch(`/api/shop/tabs/orders/${orderId}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load order");
  const json = (await res.json()) as { ok: boolean; order: ShopOrderData };
  if (!json.ok || !json.order) throw new Error("Failed to load order");
  detailCache.set(orderId, json.order);
  return json.order;
}

export function clearShopOrderDetailCache(orderId?: string) {
  if (orderId) detailCache.delete(orderId);
  else detailCache.clear();
}

export function ShopOrderLightCard({
  order,
  locale,
  onStatusUpdated,
}: {
  order: ShopOrderListItem;
  locale: Locale;
  onStatusUpdated?: (tabId: string) => void;
}) {
  const [detail, setDetail] = useState<ShopOrderData | null>(
    () => detailCache.get(order.id) ?? null
  );
  const [open, setOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [shareError, setShareError] = useState("");
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const ensureDetail = useCallback(async () => {
    if (detail) return detail;
    setLoadingDetail(true);
    try {
      const full = await fetchOrderDetail(order.id);
      setDetail(full);
      return full;
    } finally {
      setLoadingDetail(false);
    }
  }, [detail, order.id]);

  async function onToggle(e: React.SyntheticEvent<HTMLDetailsElement>) {
    const nextOpen = e.currentTarget.open;
    setOpen(nextOpen);
    if (nextOpen) {
      try {
        await ensureDetail();
      } catch {
        e.currentTarget.open = false;
        setOpen(false);
      }
    }
  }

  async function onShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setShareError("");
    try {
      const full = await ensureDetail();
      const shopMeas = parseShopMeasurementsJson(full.shopMeasurementsJson);
      const shopMeasureType = shopMeas?.type ?? "blouse";
      const personMeasurement = full.person
        ? pickMeasurementForType(full.person.measurements, shopMeasureType)
        : null;
      const subjectName = full.person?.name
        ? full.person.name
        : shopMeas?.personName || full.customer.name;
      const activeMeasurement = shopMeas
        ? shopMeasurementsToRecord(shopMeas)
        : personMeasurement;
      shareOrderWorkViaWhatsApp({
        order: full,
        locale,
        subjectName,
        shopMeasureType,
        measurement: activeMeasurement,
      });
    } catch (err) {
      setShareError(err instanceof Error ? err.message : t(locale, "shareOrderWorkFailed"));
    }
  }

  function handleStatusUpdated(tabId: string) {
    clearShopTabCache("orders");
    clearShopTabCache("dashboard");
    clearShopOrderDetailCache(order.id);
    onStatusUpdated?.(tabId);
  }

  const shopMeas = detail ? parseShopMeasurementsJson(detail.shopMeasurementsJson) : null;
  const shopMeasureType = shopMeas?.type ?? "blouse";
  const personMeasurement =
    detail?.person != null
      ? pickMeasurementForType(detail.person.measurements, shopMeasureType)
      : null;
  const favoriteDesigns = (detail?.orderFavorites ?? [])
    .map((of) => (of.design ? { design: of.design, category: of.category as ServiceCategory } : null))
    .filter((item): item is ShopOrderDesignItem => item != null);
  const selectedDesigns =
    favoriteDesigns.length > 0
      ? favoriteDesigns
      : detail?.design
        ? [{ design: detail.design, category: detail.category }]
        : [];
  const primaryDesignImage =
    detail?.design?.imagePath ?? favoriteDesigns[0]?.design.imagePath ?? null;
  const customerDesignLabel =
    detail?.design?.title ??
    favoriteDesigns[0]?.design.title ??
    order.designTitle ??
    t(locale, "customerOwnDesign");

  return (
    <article className="card-premium order-card-perf overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-brand-green/10 bg-brand-green px-4 py-3 text-white">
        <div className="min-w-0 flex-1">
          <p className="font-bold">{order.orderNumber}</p>
          <p className="mt-0.5 text-sm text-white/90">{order.subjectName}</p>
          <p className="mt-0.5 text-xs text-white/75">{order.customerName}</p>
        </div>
        <div className="relative flex shrink-0 flex-col items-end">
          <button
            type="button"
            onClick={onShare}
            disabled={loadingDetail}
            aria-label={t(locale, "shareOrderWork")}
            title={t(locale, "shareOrderWorkHint")}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 disabled:opacity-60"
          >
            <Share2 className="h-5 w-5" />
          </button>
          {shareError && (
            <p className="absolute right-0 top-full z-20 mt-1 max-w-[14rem] rounded-lg bg-red-600 px-2 py-1 text-xs text-white shadow-lg">
              {shareError}
            </p>
          )}
        </div>
      </div>

      <div className="p-4">
        <details ref={detailsRef} className="group rounded-xl border border-brand-green/15 bg-white" onToggle={onToggle}>
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-brand-green [&::-webkit-details-marker]:hidden">
            {t(locale, "orderShowDetails")}
            <ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" />
          </summary>

          <div className="space-y-5 border-t border-brand-green/10 p-4">
            {loadingDetail && !detail ? (
              <p className="text-sm text-zinc-500">{t(locale, "loadingDesigns")}</p>
            ) : detail ? (
              <>
                <section className="rounded-xl bg-brand-cream/80 p-4">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <UserRound className="h-5 w-5 text-brand-green" />
                      <div>
                        <p className="text-xs font-medium text-zinc-500">{t(locale, "customer")}</p>
                        <p className="font-bold text-brand-green">{detail.customer.name}</p>
                        {detail.customer.phone && (
                          <p className="text-xs text-zinc-600">{detail.customer.phone}</p>
                        )}
                      </div>
                    </div>
                    {detail.person && (
                      <div className="flex items-center gap-2">
                        <Shirt className="h-5 w-5 text-brand-gold-dark" />
                        <div>
                          <p className="text-xs font-medium text-zinc-500">{t(locale, "orderForPerson")}</p>
                          <p className="font-bold text-brand-green">{detail.person.name}</p>
                          {detail.person.relation && (
                            <p className="text-xs text-zinc-600">{detail.person.relation}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {selectedDesigns.length > 0 && (
                  <section>
                    {selectedDesigns.length > 1 ? (
                      <OrderSelectedDesigns items={selectedDesigns} locale={locale} />
                    ) : (
                      <>
                        <h3 className="mb-2 flex items-center gap-1 text-sm font-bold uppercase text-brand-green">
                          {t(locale, "referencePhotos")}
                        </h3>
                        <div className="overflow-hidden rounded-2xl border-2 border-brand-gold/40 bg-white">
                          {primaryDesignImage ? (
                            <div className="relative aspect-[4/3] max-h-72 w-full">
                              <Image
                                src={primaryDesignImage}
                                alt={customerDesignLabel}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <p className="p-8 text-center text-sm text-zinc-500">{t(locale, "noDesignYet")}</p>
                          )}
                          <div className="border-t border-brand-green/10 bg-brand-cream/50 px-3 py-2">
                            <p className="font-semibold text-brand-green">{customerDesignLabel}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </section>
                )}

                {(detail.images.length > 0 || detail.clothImagePath) && (
                  <OrderImageGallery
                    images={detail.images}
                    legacyJson={detail.customerRefImages}
                    extras={{
                      cloth: detail.clothImagePath,
                      workDesign: detail.workDesignImagePath,
                      design: detail.design?.imagePath,
                    }}
                    locale={locale}
                    deletableRole="SHOP"
                  />
                )}

                <section>
                  <h3 className="mb-2 flex items-center gap-1 text-sm font-bold uppercase text-brand-green">
                    <Ruler className="h-4 w-4" />
                    {t(locale, "measurements")} — {order.subjectName}
                  </h3>
                  {shopMeas ? (
                    <MeasurementListView
                      measurement={shopMeasurementsToRecord(shopMeas)}
                      measurementType={shopMeasureType}
                      locale={locale}
                    />
                  ) : personMeasurement ? (
                    <MeasurementListView
                      measurement={personMeasurement}
                      measurementType={shopMeasureType}
                      locale={locale}
                    />
                  ) : (
                    <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      {t(locale, "noMeasurements")}
                    </p>
                  )}
                </section>

                {detail.notes && (
                  <p className="rounded-xl bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                    <strong>{t(locale, "notes")}:</strong> {detail.notes}
                  </p>
                )}
              </>
            ) : open ? (
              <p className="text-sm text-red-600">{t(locale, "serverTemporaryErrorHint")}</p>
            ) : null}
          </div>
        </details>
      </div>

      <div className="border-t border-brand-green/10 bg-brand-green px-4 py-3">
        <OrderStatusForm
          orderId={order.id}
          status={order.status}
          locale={locale}
          onStatusUpdated={handleStatusUpdated}
        />
      </div>
    </article>
  );
}
