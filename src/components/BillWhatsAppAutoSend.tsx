"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { preloadBillCaptureLib, shareBillImageOnWhatsApp } from "@/lib/share-bill-image";
import { withTimeout } from "@/lib/platform";

const AUTO_SEND_TIMEOUT_MS = 25000;

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
  const runningRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    preloadBillCaptureLib();
  }, [enabled]);

  useEffect(() => {
    if (!enabled || runningRef.current) return;

    const storageKey = autoSendStorageKey(billNumber);
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(storageKey)) return;

    runningRef.current = true;
    setPreparing(true);
    setError("");

    (async () => {
      try {
        await withTimeout(
          shareBillImageOnWhatsApp({
            phone: phone ?? undefined,
            fileName: `${billNumber}.jpg`,
            shopName,
            fallbackHint,
          }),
          AUTO_SEND_TIMEOUT_MS,
          "Share timed out"
        );
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.setItem(storageKey, "1");
        }
      } catch (err) {
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.removeItem(storageKey);
        }
        setError(err instanceof Error ? err.message : errorLabel);
      } finally {
        runningRef.current = false;
        setPreparing(false);
        router.replace(pathname, { scroll: false });
      }
    })();
  }, [enabled, phone, billNumber, shopName, pathname, router, errorLabel, fallbackHint]);

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
