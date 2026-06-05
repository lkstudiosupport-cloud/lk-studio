"use client";

import { useEffect, useRef } from "react";
import { shareBillImageOnWhatsApp } from "@/lib/share-bill-image";

export function BillWhatsAppAutoSend({
  phone,
  billNumber,
  shopName,
  enabled,
}: {
  phone: string | null | undefined;
  billNumber: string;
  shopName?: string;
  enabled: boolean;
}) {
  const sent = useRef(false);

  useEffect(() => {
    if (!enabled || sent.current) return;
    sent.current = true;
    const timer = window.setTimeout(() => {
      void shareBillImageOnWhatsApp({
        phone: phone ?? undefined,
        fileName: `${billNumber}.png`,
        shopName,
      }).catch(() => {
        sent.current = false;
      });
    }, 900);
    return () => window.clearTimeout(timer);
  }, [enabled, phone, billNumber, shopName]);

  return null;
}
