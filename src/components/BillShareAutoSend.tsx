"use client";

import { useEffect, useRef, useState } from "react";
import { preloadBillCaptureLib, shareBillImage, billShareCacheKey } from "@/lib/share-bill-image";

function autoShareStorageKey(billNumber: string, itemsJson?: string, amount?: number) {
  if (itemsJson != null && amount != null) {
    return `lk-share-bill-${billShareCacheKey(billNumber, itemsJson, amount)}`;
  }
  return `lk-share-bill-${billNumber}`;
}

function hasAutoShareAttempted(billNumber: string, itemsJson?: string, amount?: number) {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(autoShareStorageKey(billNumber, itemsJson, amount)) != null;
}

function markAutoShareAttempted(billNumber: string, itemsJson?: string, amount?: number) {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(autoShareStorageKey(billNumber, itemsJson, amount), "1");
  }
}

function clearAutoShareAttempted(billNumber: string, itemsJson?: string, amount?: number) {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(autoShareStorageKey(billNumber, itemsJson, amount));
  }
}

export function BillShareAutoSend({
  billNumber,
  shopName,
  enabled,
  silent,
  preparingLabel = "Preparing bill image…",
  errorLabel = "Could not share bill image — try again",
  fallbackHint,
  itemsJson,
  amount,
}: {
  billNumber: string;
  shopName?: string;
  enabled: boolean;
  /** Run share in background without blocking receipt view. */
  silent?: boolean;
  preparingLabel?: string;
  errorLabel?: string;
  fallbackHint?: string;
  itemsJson?: string;
  amount?: number;
}) {
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState("");
  const startedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    preloadBillCaptureLib();
  }, [enabled]);

  useEffect(() => {
    if (!enabled || startedRef.current || hasAutoShareAttempted(billNumber, itemsJson, amount)) return;

    startedRef.current = true;
    markAutoShareAttempted(billNumber, itemsJson, amount);
    setPreparing(true);
    setError("");

    let cancelled = false;

    (async () => {
      try {
        await shareBillImage({
          fileName: `${billNumber}.jpg`,
          shopName,
          fallbackHint,
          cacheKey:
            itemsJson != null && amount != null
              ? billShareCacheKey(billNumber, itemsJson, amount)
              : undefined,
        });
      } catch (err) {
        clearAutoShareAttempted(billNumber, itemsJson, amount);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : errorLabel);
        }
      } finally {
        if (!cancelled) setPreparing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, billNumber, shopName, fallbackHint, errorLabel, itemsJson, amount]);

  if (!preparing && !error) return null;
  if (silent && preparing && !error) return null;

  return (
    <div
      role="status"
      className={`bill-detail-status mx-auto mb-3 max-w-full rounded-xl px-4 py-2.5 text-center text-sm font-semibold shadow-md ${
        error ? "bg-red-600 text-white" : "bg-brand-green text-white"
      } ${silent ? "bill-detail-status--subtle" : ""}`}
    >
      {error || preparingLabel}
    </div>
  );
}
