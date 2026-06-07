"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { preloadBillCaptureLib, shareBillImageOnWhatsApp } from "@/lib/share-bill-image";

function autoSendStorageKey(billNumber: string) {
  return `lk-wa-bill-${billNumber}`;
}

export function BillWhatsAppAutoSend({
  phone,
  billNumber,
  shopName,
  enabled,
  preparingLabel = "Preparing bill image…",
  errorLabel = "Could not share bill image — try again",
  fallbackHint,
}: {
  phone: string | null | undefined;
  billNumber: string;
  shopName?: string;
  enabled: boolean;
  preparingLabel?: string;
  errorLabel?: string;
  fallbackHint?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) return;
    preloadBillCaptureLib();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const storageKey = autoSendStorageKey(billNumber);
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(storageKey)) return;

    let cancelled = false;

    (async () => {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(storageKey, "1");
      }
      setPreparing(true);
      setError("");

      try {
        await shareBillImageOnWhatsApp({
          phone: phone ?? undefined,
          fileName: `${billNumber}.jpg`,
          shopName,
          fallbackHint,
        });
      } catch {
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.removeItem(storageKey);
        }
        if (!cancelled) setError(errorLabel);
      } finally {
        if (!cancelled) {
          setPreparing(false);
          router.replace(pathname, { scroll: false });
        }
      }
    })();

    return () => {
      cancelled = true;
      setPreparing(false);
    };
  }, [enabled, phone, billNumber, shopName, pathname, router, preparingLabel, errorLabel, fallbackHint]);

  if (!preparing && !error) return null;

  return (
    <div
      role="status"
      className={`bill-detail-status mx-auto mb-3 max-w-full rounded-xl px-4 py-2.5 text-center text-sm font-semibold shadow-md ${
        error ? "bg-red-600 text-white" : "bg-brand-green text-white"
      }`}
    >
      {error || preparingLabel}
    </div>
  );
}
