"use client";

import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import type { MeasurementRecord, MeasurementTypeId } from "@/lib/measurements";
import { shareOrderWork } from "@/lib/share-order-work";
import { preloadBillCaptureLib } from "@/lib/bill-receipt-capture";
import { OrderWorkShareSheet, orderWorkShareElementId } from "@/components/OrderWorkShareSheet";
import type { ShopOrderData } from "@/lib/shop-order-types";

export function OrderShareButton({
  locale,
  order,
  subjectName,
  shopMeasureType,
  measurement,
}: {
  locale: Locale;
  order: ShopOrderData;
  subjectName: string;
  shopMeasureType: MeasurementTypeId;
  measurement: MeasurementRecord | null;
}) {
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    preloadBillCaptureLib();
  }, []);

  async function onShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (sharing) return;
    setSharing(true);
    setError("");
    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await shareOrderWork({
        order,
        locale,
        subjectName,
        shopMeasureType,
        measurement,
        captureElementId: orderWorkShareElementId(order.id),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t(locale, "shareOrderWorkFailed"));
    } finally {
      setSharing(false);
    }
  }

  return (
    <>
      <OrderWorkShareSheet
        order={order}
        locale={locale}
        subjectName={subjectName}
        shopMeasureType={shopMeasureType}
        measurement={measurement}
      />
      <button
        type="button"
        onClick={(e) => void onShare(e)}
        disabled={sharing}
        aria-label={t(locale, "shareOrderWork")}
        title={t(locale, "shareOrderWorkHint")}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 disabled:opacity-60"
      >
        <Share2 className="h-5 w-5" />
      </button>
      {error && <span className="sr-only">{error}</span>}
    </>
  );
}
