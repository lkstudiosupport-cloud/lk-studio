"use client";

import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { measurementEntries, type MeasurementRecord, type MeasurementTypeId } from "@/lib/measurements";
import { allOrderImagePaths } from "@/lib/order-images";
import { ORDER_WORK_SHARE_STYLES } from "@/lib/order-work-share-styles";
import { normalizeStoredImageUrl } from "@/lib/storage-url";
import type { ShopOrderData } from "@/lib/shop-order-types";

export const ORDER_WORK_SHARE_CAPTURE_ID = "order-work-share-capture";

export const orderWorkShareElementId = (orderId: string) => `order-work-share-${orderId}`;

function fieldLabel(locale: Locale, type: MeasurementTypeId, key: string): string {
  const typedKey = `measureLabel_${type}_${key}`;
  const typed = t(locale, typedKey);
  return typed !== typedKey ? typed : t(locale, key);
}

function absoluteImageUrl(path: string): string {
  const normalized = normalizeStoredImageUrl(path);
  if (typeof window === "undefined") return normalized;
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) return normalized;
  return `${window.location.origin}${normalized.startsWith("/") ? "" : "/"}${normalized}`;
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
  const imagePaths = allOrderImagePaths(order.images, order.customerRefImages, {
    cloth: order.clothImagePath,
    workDesign: order.workDesignImagePath,
    design: order.design?.imagePath,
  });
  const photoUrls = imagePaths.map((img) => absoluteImageUrl(img.path));
  const measureRows = measurement ? measurementEntries(measurement, shopMeasureType) : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ORDER_WORK_SHARE_STYLES }} />
      <div
        id={orderWorkShareElementId(order.id)}
        aria-hidden
        className="order-work-share"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          opacity: 0.01,
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        <div className="order-work-share-header">
          <p className="order-work-share-title">{order.orderNumber}</p>
          <p className="order-work-share-sub">
            {t(locale, "orderForPerson")}: {subjectName}
          </p>
          <p className="order-work-share-meta">
            {t(locale, "customer")}: {order.customer.name}
            {order.customer.phone ? ` · ${order.customer.phone}` : ""}
          </p>
        </div>

        <div className="order-work-share-body">
          {measureRows.length > 0 && (
            <section className="order-work-share-section">
              <p className="order-work-share-label">
                {t(locale, `measurementType_${shopMeasureType}`)} {t(locale, "measurements")}
              </p>
              <ul className="order-work-share-measures">
                {measureRows.map((row) => (
                  <li key={row.key}>
                    <span className="name">{fieldLabel(locale, shopMeasureType, row.key)}</span>
                    <span className="value">{row.value}&quot;</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {photoUrls.length > 0 && (
            <section className="order-work-share-section">
              <p className="order-work-share-label">{t(locale, "workPhotos")}</p>
              <div className="order-work-share-photos">
                {photoUrls.map((url, i) => (
                  <div key={`${url}-${i}`} className="order-work-share-photo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`${t(locale, "workPhotos")} ${i + 1}`} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {order.notes?.trim() && (
            <section className="order-work-share-section order-work-share-notes">
              <p className="order-work-share-label">{t(locale, "notes")}</p>
              <p className="note-body">{order.notes.trim()}</p>
            </section>
          )}

          <p className="order-work-share-footer">{t(locale, "shareOrderWorkFooter")}</p>
        </div>
      </div>
    </>
  );
}
