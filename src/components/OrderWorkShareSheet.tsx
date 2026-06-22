"use client";

import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { measurementEntries, type MeasurementRecord, type MeasurementTypeId } from "@/lib/measurements";
import { allOrderImagePaths } from "@/lib/order-images";
import { normalizeStoredImageUrl } from "@/lib/storage-url";
import type { ShopOrderData } from "@/lib/shop-order-types";

export const orderWorkShareElementId = (orderId: string) => `order-work-share-${orderId}`;

function fieldLabel(locale: Locale, type: MeasurementTypeId, key: string): string {
  const typedKey = `measureLabel_${type}_${key}`;
  const typed = t(locale, typedKey);
  return typed !== typedKey ? typed : t(locale, key);
}

export function OrderWorkShareSheet({
  order,
  locale,
  subjectName,
  shopMeasureType,
  measurement,
}: {
  order: ShopOrderData;
  locale: Locale;
  subjectName: string;
  shopMeasureType: MeasurementTypeId;
  measurement: MeasurementRecord | null;
}) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const imagePaths = allOrderImagePaths(order.images, order.customerRefImages, {
    cloth: order.clothImagePath,
    workDesign: order.workDesignImagePath,
    design: order.design?.imagePath,
  });
  const photoUrls = imagePaths.map((img) => `${origin}${normalizeStoredImageUrl(img.path)}`);
  const measureRows = measurement ? measurementEntries(measurement, shopMeasureType) : [];

  return (
    <div
      id={orderWorkShareElementId(order.id)}
      aria-hidden
      className="pointer-events-none fixed left-[-10000px] top-0 z-[-1] w-[400px] overflow-hidden rounded-2xl border border-[#1a4d3e]/15 bg-white font-sans text-[#1a4d3e]"
    >
      <div className="bg-[#1a4d3e] px-4 py-3 text-white">
        <p className="text-lg font-bold">{order.orderNumber}</p>
        <p className="mt-1 text-sm text-white/90">
          {t(locale, "orderForPerson")}: {subjectName}
        </p>
        <p className="text-sm text-white/80">
          {t(locale, "customer")}: {order.customer.name}
          {order.customer.phone ? ` · ${order.customer.phone}` : ""}
        </p>
      </div>

      <div className="space-y-4 p-4">
        {measureRows.length > 0 && (
          <section>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#1a4d3e]">
              {t(locale, `measurementType_${shopMeasureType}`)} {t(locale, "measurements")}
            </p>
            <ul className="space-y-1 rounded-xl bg-[#faf6ef] p-3 text-sm">
              {measureRows.map((row) => (
                <li key={row.key} className="flex justify-between gap-2">
                  <span className="text-zinc-600">{fieldLabel(locale, shopMeasureType, row.key)}</span>
                  <span className="font-bold">{row.value}&quot;</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {photoUrls.length > 0 && (
          <section>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#1a4d3e]">
              {t(locale, "workPhotos")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {photoUrls.map((url, i) => (
                <div key={url} className="overflow-hidden rounded-xl border border-[#1a4d3e]/10 bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`${t(locale, "workPhotos")} ${i + 1}`}
                    className="aspect-square w-full object-cover"
                    crossOrigin="anonymous"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {order.notes?.trim() && (
          <section className="rounded-xl bg-zinc-50 p-3 text-sm">
            <p className="font-semibold">{t(locale, "notes")}</p>
            <p className="mt-1 text-zinc-700">{order.notes.trim()}</p>
          </section>
        )}

        <p className="text-center text-xs text-zinc-500">{t(locale, "shareOrderWorkFooter")}</p>
      </div>
    </div>
  );
}
