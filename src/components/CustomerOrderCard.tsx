import Image from "next/image";
import { MeasurementListView } from "./MeasurementListView";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { statusLabelKey } from "@/lib/order-status";
import { categoryLabelKey } from "@/lib/categories";
import { stitchLabelKey } from "@/lib/stitch-types";
import { workTypeLabelKey } from "@/lib/work-types";
import { ShopRateForm } from "./ShopRateForm";
import { OrderSelectedDesigns } from "./OrderSelectedDesigns";
import { OrderImageGallery } from "./OrderImageGallery";
import { measurementTypeForCategory, pickMeasurementForType } from "@/lib/measurements";
import type { MeasurementTypeId } from "@/lib/measurements";
import {
  parseShopMeasurementsJson,
  shopMeasurementsToRecord,
} from "@/lib/shop-measurements";
import type { Design, Measurement, Order, OrderImage, OrderFavorite, Person, ShopProfile, ShopRating, ServiceCategory } from "@prisma/client";
import { designImageSrc } from "@/lib/design-images";

type DesignPreview = Pick<Design, "id" | "title" | "imagePath" | "category">;

type OrderView = Order & {
  person: (Person & { measurements: Measurement[] }) | null;
  design: DesignPreview | null;
  images: OrderImage[];
  shop: Pick<ShopProfile, "id" | "shopName" | "phone" | "whatsapp">;
  rating: Pick<ShopRating, "rating"> | null;
  orderFavorites: (OrderFavorite & {
    design: DesignPreview;
  })[];
};

function orderSubjectName(order: OrderView): string {
  if (order.person?.name) return order.person.name;
  const shopMeas = parseShopMeasurementsJson(order.shopMeasurementsJson);
  if (shopMeas?.personName) return shopMeas.personName;
  return "";
}

export function CustomerOrderCard({ order, locale }: { order: OrderView; locale: Locale }) {
  const designLabel = order.design?.title ?? t(locale, "customerOwnDesign");
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
  const shopMeas = parseShopMeasurementsJson(order.shopMeasurementsJson);
  const shopMeasureType = (shopMeas?.type ?? measureType) as MeasurementTypeId;
  const subjectName = orderSubjectName(order);
  const personMeasurement = order.person
    ? pickMeasurementForType(order.person.measurements, shopMeasureType)
    : null;

  return (
    <article className="card-premium overflow-hidden">
      <div className="brand-card-header flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div>
          <p className="font-bold">{order.orderNumber}</p>
          <p className="text-sm text-white/90">
            {order.shop.shopName}
            {subjectName ? ` · ${subjectName}` : ""}
          </p>
          <span className="mt-1 inline-block rounded-full bg-white/20 px-2 py-0.5 text-xs">
            {t(locale, workTypeLabelKey(order.workType))}
          </span>
        </div>
        <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">
          {t(locale, statusLabelKey(order.status))}
        </span>
      </div>

      <div className="space-y-4 p-4">
        <section>
          {selectedDesigns.length > 1 ? (
            <OrderSelectedDesigns items={selectedDesigns} locale={locale} />
          ) : (
            <>
              <h3 className="mb-2 text-xs font-bold uppercase text-brand-green">
                {t(locale, "customerSelectedDesign")}
              </h3>
              <div className="overflow-hidden rounded-xl border border-brand-green/15 bg-white">
                {order.design?.imagePath ? (
                  <div className="relative aspect-[4/3] max-h-48 w-full">
                    <Image
                      src={designImageSrc(order.design.imagePath)}
                      alt={designLabel}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <p className="p-6 text-center text-sm text-zinc-500">{t(locale, "noDesignYet")}</p>
                )}
                <div className="border-t border-brand-green/10 bg-brand-cream/50 px-3 py-2">
                  <p className="font-semibold text-brand-green">{designLabel}</p>
                  <p className="text-xs text-zinc-600">
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
            deletableRole="CUSTOMER"
          />
        )}

        <section>
          <h3 className="mb-2 text-xs font-bold uppercase text-brand-green">
            {t(locale, "measurementsList")}
            {subjectName ? ` — ${subjectName}` : ""}
          </h3>
          {shopMeas ? (
            <MeasurementListView
              measurement={shopMeasurementsToRecord(shopMeas)}
              measurementType={shopMeasureType}
              locale={locale}
            />
          ) : (
            <MeasurementListView
              measurement={personMeasurement}
              measurementType={shopMeasureType}
              locale={locale}
            />
          )}
        </section>

        {order.clothImagePath && (
          <section className="flex items-center gap-3 rounded-xl border border-brand-green/10 bg-brand-cream/40 p-3">
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
          </section>
        )}

        {(order.stitchType || order.clothDescription) && (
          <div className="rounded-xl bg-brand-cream p-3 text-sm">
            {order.stitchType && (
              <p>
                <strong>{t(locale, "stitchType")}:</strong> {t(locale, stitchLabelKey(order.stitchType))}
              </p>
            )}
            {order.clothDescription && (
              <p className="mt-1 text-zinc-600">{order.clothDescription}</p>
            )}
          </div>
        )}

        {order.status === "DELIVERED" && (
          <ShopRateForm
            orderId={order.id}
            shopId={order.shop.id}
            locale={locale}
            existingRating={order.rating?.rating ?? null}
          />
        )}
      </div>
    </article>
  );
}
