"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { Maximize2, X } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { isMobileWeb } from "@/lib/platform";

function isMobileViewport() {
  return isMobileWeb() && window.matchMedia("(max-width: 639px)").matches;
}

export function BillReceiptShell({
  locale,
  children,
  defaultFullscreen,
  autoFullscreenOnMobile = true,
}: {
  locale: Locale;
  children: React.ReactNode;
  /** Force fullscreen on mobile (e.g. right after bill save / WhatsApp share). */
  defaultFullscreen?: boolean;
  /** Open fullscreen receipt on mobile bill detail load (default on). */
  autoFullscreenOnMobile?: boolean;
}) {
  const [fullscreen, setFullscreen] = useState(false);

  useLayoutEffect(() => {
    if (!isMobileViewport()) return;
    if (autoFullscreenOnMobile || defaultFullscreen) setFullscreen(true);
  }, [autoFullscreenOnMobile, defaultFullscreen]);

  useEffect(() => {
    if (!fullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [fullscreen]);

  return (
    <div className={fullscreen ? "bill-receipt-fullscreen" : "bill-receipt-shell"}>
      <div className={fullscreen ? "bill-receipt-fullscreen-bar" : "bill-receipt-shell-toolbar"}>
        {fullscreen ? (
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            className="bill-receipt-fullscreen-close"
            aria-label={t(locale, "backToBills")}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            className="bill-receipt-expand-btn"
            aria-label={t(locale, "viewFullBill")}
          >
            <Maximize2 className="h-4 w-4" aria-hidden />
            <span>{t(locale, "viewFullBill")}</span>
          </button>
        )}
      </div>
      <div className={fullscreen ? "bill-receipt-fullscreen-scroll" : "bill-receipt-shell-body"}>
        {children}
      </div>
    </div>
  );
}
