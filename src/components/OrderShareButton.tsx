"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import type { MeasurementRecord, MeasurementTypeId } from "@/lib/measurements";
import { buildOrderWorkShareText, shareOrderWorkViaWhatsApp } from "@/lib/share-order-work";
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

  async function onShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (sharing) return;
    setSharing(true);
    try {
      const text = buildOrderWorkShareText(order, locale, {
        subjectName,
        shopMeasureType,
        measurement,
      });
      await shareOrderWorkViaWhatsApp(text);
    } finally {
      setSharing(false);
    }
  }

  return (
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
  );
}
