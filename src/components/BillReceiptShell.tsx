"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { Maximize2, X } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";

function isMobileViewport() {
  return window.matchMedia("(max-width: 639px)").matches;
}

export function BillReceiptShell({
  locale,
  children,
  defaultFullscreen,
  autoFullscreenOnMobile = true,
  onFullscreenChange,
  embedActionsInFullscreen,
  fullscreenActions,
}: {
  locale: Locale;
  children: React.ReactNode;
  /** Force fullscreen on mobile (e.g. right after bill save / share). */
  defaultFullscreen?: boolean;
  /** Open fullscreen receipt on mobile bill detail load (default on). */
  autoFullscreenOnMobile?: boolean;
  onFullscreenChange?: (fullscreen: boolean) => void;
  /** Show share/back/print bar inside fullscreen (post-create hero view). */
  embedActionsInFullscreen?: boolean;
  fullscreenActions?: React.ReactNode;
}) {
  const [fullscreen, setFullscreen] = useState(false);

  useLayoutEffect(() => {
    if (!isMobileViewport()) return;
    if (autoFullscreenOnMobile || defaultFullscreen) setFullscreen(true);
  }, [autoFullscreenOnMobile, defaultFullscreen]);

  useEffect(() => {
    onFullscreenChange?.(fullscreen);
  }, [fullscreen, onFullscreenChange]);

  useEffect(() => {
    if (!fullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [fullscreen]);

  const showEmbeddedActions = fullscreen && embedActionsInFullscreen && fullscreenActions;

  return (
    <div className={fullscreen ? "bill-receipt-shell bill-receipt-fullscreen" : "bill-receipt-shell"}>
      <div
        className={
          fullscreen
            ? showEmbeddedActions
              ? "bill-receipt-fullscreen-bar bill-receipt-fullscreen-bar--with-actions"
              : "bill-receipt-fullscreen-bar"
            : "bill-receipt-shell-toolbar"
        }
      >
        {fullscreen ? (
          showEmbeddedActions ? (
            <>
              <div className="bill-receipt-fullscreen-actions">{fullscreenActions}</div>
              <button
                type="button"
                onClick={() => setFullscreen(false)}
                className="bill-receipt-fullscreen-close shrink-0"
                aria-label={t(locale, "closeReceipt")}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              className="bill-receipt-fullscreen-close"
              aria-label={t(locale, "backToBills")}
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          )
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
