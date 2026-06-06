import Image from "next/image";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { categoryLabelKey } from "@/lib/categories";
import { stitchLabelKey } from "@/lib/stitch-types";
import { MeasurementListView } from "./MeasurementListView";
import { ShopOrderWorkForm } from "./ShopOrderWorkForm";
import { OrderStatusForm } from "./OrderStatusForm";
import { OrderSelectedDesigns } from "./OrderSelectedDesigns";
import { OrderImageGallery } from "./OrderImageGallery";
import { workTypeLabelKey } from "@/lib/work-types";
import { UserRound, Shirt, Ruler, ChevronDown } from "lucide-react";
import { measurementTypeForCategory, pickMeasurementForType } from "@/lib/measurements";
import type { Design, Measurement, Order, Person, User, OrderImage, OrderFavorite, ServiceCategory } from "@prisma/client";

type DesignPreview = Pick<Design, "id" | "title" | "imagePath" | "category">;

export type ShopOrderData = Order & {
  customer: Pick<User, "id" | "name" | "phone">;
  person: Person & { measurements: Measurement[] };
  design: DesignPreview | null;
  images: OrderImage[];
  orderFavorites: (OrderFavorite & {
    design: DesignPreview;
  })[];
};

function stitchLabel(order: ShopOrderData, locale: Locale) {
  if (order.stitchType) return t(locale, stitchLabelKey(order.stitchType));
  return t(locale, categoryLabelKey(order.category));
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
  const designImg = order.design?.imagePath ?? null;
  const customerDesignLabel = order.design?.title ?? t(locale, "customerOwnDesign");
  const selectedDesigns =
    (order.orderFavorites?.length ?? 0) > 0
      ? order.orderFavorites!.map((of) => ({
          design: of.design,
          category: of.category as ServiceCategory,
        }))
      : order.design
        ? [{ design: order.design, category: order.category }]
        : [];

  const measureType = measurementTypeForCategory(order.category);
  const personMeasurement = pickMeasurementForType(order.person.measurements, measureType);

  return (
    <article className="card-premium order-card-perf overflow-hidden">
      <div className="border-b border-brand-green/10 bg-brand-green px-4 py-3 text-white">
        <p className="font-bold">{order.orderNumber}</p>
        <p className="mt-0.5 text-sm text-white/90">{order.person.name}</p>
        <p className="mt-0.5 text-xs text-white/75">
          {t(locale, workTypeLabelKey(order.workType))} · {stitchLabel(order, locale)}
        </p>
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
              </div>
            </section>

            <section>
              {selectedDesigns.length > 1 ? (
                <OrderSelectedDesigns items={selectedDesigns} locale={locale} />
              ) : (
                <>
                  <h3 className="mb-2 flex items-center gap-1 text-sm font-bold uppercase text-brand-green">
                    {t(locale, "customerSelectedDesign")}
                  </h3>
                  <div className="overflow-hidden rounded-2xl border-2 border-brand-gold/40 bg-white">
                    {designImg ? (
                      <div className="relative aspect-[4/3] max-h-72 w-full">
                        <Image
                          src={designImg}
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
                      <p className="text-xs text-zinc-600">
                        {t(locale, workTypeLabelKey(order.workType))} ·{" "}
                        {t(locale, categoryLabelKey(order.category))}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </section>

            {order.images.length > 0 && (
              <OrderImageGallery
                images={order.images}
                legacyJson={order.customerRefImages}
                extras={{
                  cloth: order.clothImagePath,
                  workDesign: order.workDesignImagePath,
                  design: order.design?.imagePath,
                }}
                locale={locale}
              />
            )}

            <section>
              <h3 className="mb-2 flex items-center gap-1 text-sm font-bold uppercase text-brand-green">
                <Ruler className="h-4 w-4" />
                {t(locale, "measurements")} — {order.person.name}
              </h3>
              {personMeasurement ? (
                <MeasurementListView
                  measurement={personMeasurement}
                  measurementType={measureType}
                  locale={locale}
                />
              ) : (
                <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {t(locale, "noMeasurements")}
                </p>
              )}
            </section>
          </div>
        </details>

        <details className="group mt-3 rounded-xl border border-brand-green/15 bg-brand-cream/30">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-semibold text-brand-green [&::-webkit-details-marker]:hidden">
            {t(locale, "shopWorkSection")}
            <ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" />
          </summary>
          <div className="space-y-4 border-t border-brand-green/10 p-4">
            {order.clothImagePath && (
              <div className="flex items-center gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-brand-green/15">
                  <Image
                    src={order.clothImagePath}
                    alt={t(locale, "uploadClothPhoto")}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <p className="text-xs font-medium text-zinc-600">{t(locale, "uploadClothPhoto")}</p>
              </div>
            )}

            {(order.stitchType || order.clothDescription) && (
              <div className="rounded-xl bg-zinc-50 px-3 py-2 text-sm">
                {order.stitchType && (
                  <p>
                    <strong>{t(locale, "stitchType")}:</strong>{" "}
                    {t(locale, stitchLabelKey(order.stitchType))}
                  </p>
                )}
                {order.clothDescription && (
                  <p className="mt-1">
                    <strong>{t(locale, "clothNote")}:</strong> {order.clothDescription}
                  </p>
                )}
              </div>
            )}

            <ShopOrderWorkForm
              orderId={order.id}
              personName={order.person.name}
              locale={locale}
              stitchType={order.stitchType}
              clothDescription={order.clothDescription}
              workType={order.workType}
            />
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
