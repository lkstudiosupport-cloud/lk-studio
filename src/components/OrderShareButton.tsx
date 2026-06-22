"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import type { MeasurementRecord, MeasurementTypeId } from "@/lib/measurements";
import { shareOrderWorkViaWhatsApp } from "@/lib/share-order-work";
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
  const [error, setError] = useState("");

  function onShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setError("");
    try {
      shareOrderWorkViaWhatsApp({
        order,
        locale,
        subjectName,
        shopMeasureType,
        measurement,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t(locale, "shareOrderWorkFailed"));
    }
  }

  return (
    <div className="relative flex shrink-0 flex-col items-end">
      <button
        type="button"
        onClick={onShare}
        aria-label={t(locale, "shareOrderWork")}
        title={t(locale, "shareOrderWorkHint")}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
      >
        <Share2 className="h-5 w-5" />
      </button>
      {error && (
        <p className="absolute right-0 top-full z-20 mt-1 max-w-[14rem] rounded-lg bg-red-600 px-2 py-1 text-xs text-white shadow-lg">
          {error}
        </p>
      )}
    </div>
  );
}
