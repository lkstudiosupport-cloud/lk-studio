"use client";

import Image from "next/image";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { MeasurementListView } from "./MeasurementListView";
import { OrderShareButton } from "./OrderShareButton";
import { OrderStatusForm } from "./OrderStatusForm";
import { OrderSelectedDesigns } from "./OrderSelectedDesigns";
import { OrderImageGallery } from "./OrderImageGallery";
import { UserRound, Shirt, Ruler, ChevronDown } from "lucide-react";
import { pickMeasurementForType } from "@/lib/measurements";
import {
  parseShopMeasurementsJson,
  shopMeasurementsToRecord,
} from "@/lib/shop-measurements";
import type { ServiceCategory } from "@prisma/client";
import type { ShopOrderData, ShopOrderDesignItem } from "@/lib/shop-order-types";

export type { ShopOrderData } from "@/lib/shop-order-types";

function orderSubjectName(order: ShopOrderData): string {
  if (order.person?.name) return order.person.name;
  const shopMeas = parseShopMeasurementsJson(order.shopMeasurementsJson);
  if (shopMeas?.personName) return shopMeas.personName;
  return order.customer.name;
}

export function ShopOrderCard({
  order,
  locale,
  onStatusUpdated,
}: {
  order: ShopOrderData;
  locale: Locale;
  onStatusUpdated?: (tabId: string) => void;
}) {
  const shopMeas = parseShopMeasurementsJson(order.shopMeasurementsJson);
  const shopMeasureType = shopMeas?.type ?? "blouse";
  const personMeasurement = order.person
    ? pickMeasurementForType(order.person.measurements, shopMeasureType)
    : null;

  const favoriteDesigns = (order.orderFavorites ?? [])
    .map((of) => (of.design ? { design: of.design, category: of.category as ServiceCategory } : null))
    .filter((item): item is ShopOrderDesignItem => item != null);

  const selectedDesigns =
    favoriteDesigns.length > 0
      ? favoriteDesigns
      : order.design
        ? [{ design: order.design, category: order.category }]
        : [];

  const primaryDesignImage =
    order.design?.imagePath ?? favoriteDesigns[0]?.design.imagePath ?? null;
  const subjectName = orderSubjectName(order);
  const customerDesignLabel =
    order.design?.title ?? favoriteDesigns[0]?.design.title ?? t(locale, "customerOwnDesign");
  const activeMeasurement = shopMeas
    ? shopMeasurementsToRecord(shopMeas)
    : personMeasurement;

  return (
    <article className="card-premium order-card-perf overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-brand-green/10 bg-brand-green px-4 py-3 text-white">
        <div className="min-w-0 flex-1">
          <p className="font-bold">{order.orderNumber}</p>
          <p className="mt-0.5 text-sm text-white/90">{subjectName}</p>
          <p className="mt-0.5 text-xs text-white/75">{order.customer.name}</p>
        </div>
        <OrderShareButton
          locale={locale}
          order={order}
          subjectName={subjectName}
          shopMeasureType={shopMeasureType}
          measurement={activeMeasurement}
        />
      </div>

      <div className="p-4">
        <details className="group rounded-xl border border-brand-green/15 bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-brand-green [&::-webkit-details-marker]:hidden">
            {t(locale, "orderShowDetails")}
            <ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" />
          </summary>

          <div className="space-y-5 border-t border-brand-green/10 p-4">
            <section className="rounded-xl bg-brand-cream/80 p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <UserRound className="h-5 w-5 text-brand-green" />
                  <div>
                    <p className="text-xs font-medium text-zinc-500">{t(locale, "customer")}</p>
                    <p className="font-bold text-brand-green">{order.customer.name}</p>
                    {order.customer.phone && (
                      <p className="text-xs text-zinc-600">{order.customer.phone}</p>
                    )}
                  </div>
                </div>
                {order.person && (
                  <div className="flex items-center gap-2">
                    <Shirt className="h-5 w-5 text-brand-gold-dark" />
                    <div>
                      <p className="text-xs font-medium text-zinc-500">{t(locale, "orderForPerson")}</p>
                      <p className="font-bold text-brand-green">{order.person.name}</p>
                      {order.person.relation && (
                        <p className="text-xs text-zinc-600">{order.person.relation}</p>
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

            {(order.images.length > 0 || order.clothImagePath) && (
              <OrderImageGallery
                images={order.images}
                legacyJson={order.customerRefImages}
                extras={{
                  cloth: order.clothImagePath,
                  workDesign: order.workDesignImagePath,
                  design: order.design?.imagePath,
                }}
                locale={locale}
                deletableRole="SHOP"
              />
            )}

            <section>
              <h3 className="mb-2 flex items-center gap-1 text-sm font-bold uppercase text-brand-green">
                <Ruler className="h-4 w-4" />
                {t(locale, "measurements")} — {subjectName}
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

            {order.notes && (
              <p className="rounded-xl bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                <strong>{t(locale, "notes")}:</strong> {order.notes}
              </p>
            )}
          </div>
        </details>
      </div>

      <div className="border-t border-brand-green/10 bg-brand-green px-4 py-3">
        <OrderStatusForm
          orderId={order.id}
          status={order.status}
          locale={locale}
          onStatusUpdated={onStatusUpdated}
        />
      </div>
    </article>
  );
}
