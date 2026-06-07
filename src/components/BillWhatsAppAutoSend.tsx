"use client";

import { useEffect, useRef, useState } from "react";
import { preloadBillCaptureLib, shareBillImageOnWhatsApp } from "@/lib/share-bill-image";
import { waitForBillReceiptReady } from "@/lib/bill-receipt-capture";

export function BillWhatsAppAutoSend({
  phone,
  billNumber,
  shopName,
  enabled,
  preparingLabel = "Preparing bill image…",
}: {
  phone: string | null | undefined;
  billNumber: string;
  shopName?: string;
  enabled: boolean;
  preparingLabel?: string;
}) {
  const sent = useRef(false);
  const [preparing, setPreparing] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    preloadBillCaptureLib();
  }, [enabled]);

  useEffect(() => {
    if (!enabled || sent.current) return;
    sent.current = true;
    let cancelled = false;

    (async () => {
      setPreparing(true);
      try {
        await waitForBillReceiptReady();
        if (cancelled) return;
        await shareBillImageOnWhatsApp({
          phone: phone ?? undefined,
          fileName: `${billNumber}.jpg`,
          shopName,
        });
      } catch {
        sent.current = false;
      } finally {
        if (!cancelled) setPreparing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, phone, billNumber, shopName]);

  if (!preparing) return null;

  return (
    <div
      role="status"
      className="bill-detail-status mx-auto mb-3 max-w-full rounded-xl bg-brand-green px-4 py-2.5 text-center text-sm font-semibold text-white shadow-md"
    >
      {preparingLabel}
    </div>
  );
}
