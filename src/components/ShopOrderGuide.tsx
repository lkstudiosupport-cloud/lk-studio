"use client";

import { useCallback, useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import {
  markShopOrderGuideSeen,
  type ShopOrderGuideStep,
} from "@/lib/shop-order-guide";
import { ShopOrderGuideIllustration } from "@/components/ShopOrderGuideIllustration";
import { HelpCircle, X } from "lucide-react";

export function ShopOrderGuide({
  locale,
  steps,
  open,
  onClose,
}: {
  locale: Locale;
  steps: ShopOrderGuideStep[];
  open: boolean;
  onClose: () => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [spot, setSpot] = useState<DOMRect | null>(null);

  const step = steps[stepIndex];
  const isLast = stepIndex >= steps.length - 1;

  useEffect(() => {
    if (open) setStepIndex(0);
  }, [open, steps]);

  const updateSpot = useCallback(() => {
    if (!open || !step) {
      setSpot(null);
      return;
    }
    const el = document.querySelector(`[data-guide-target="${step.target}"]`);
    if (!el) {
      setSpot(null);
      return;
    }
    setSpot(el.getBoundingClientRect());
  }, [open, step]);

  useEffect(() => {
    if (!open || !step) return;
    const el = document.querySelector(`[data-guide-target="${step.target}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    const timer = window.setTimeout(updateSpot, 350);
    window.addEventListener("resize", updateSpot);
    window.addEventListener("scroll", updateSpot, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", updateSpot);
      window.removeEventListener("scroll", updateSpot, true);
    };
  }, [open, step, stepIndex, updateSpot]);

  function finish() {
    markShopOrderGuideSeen();
    onClose();
  }

  function next() {
    if (isLast) {
      finish();
      return;
    }
    setStepIndex((i) => i + 1);
  }

  function back() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  if (!open || !step || steps.length === 0) return null;

  return (
    <div className="shop-order-guide-root" role="dialog" aria-modal="true" aria-labelledby="shop-order-guide-title">
      <div className="shop-order-guide-backdrop" onClick={finish} aria-hidden="true" />

      {spot && (
        <div
          className="shop-order-guide-spotlight pointer-events-none"
          style={{
            top: spot.top - 6,
            left: spot.left - 6,
            width: spot.width + 12,
            height: spot.height + 12,
          }}
        />
      )}

      <div className="shop-order-guide-panel">
        <div className="shop-order-guide-card">
          <button
            type="button"
            onClick={finish}
            className="absolute right-3 top-3 rounded-full p-1 text-zinc-400 hover:text-zinc-600"
            aria-label={t(locale, "shopOrderGuide.skip")}
          >
            <X className="h-5 w-5" />
          </button>

          <p className="text-center text-xs font-bold uppercase tracking-wide text-brand-gold-dark">
            {t(locale, "shopOrderGuide.stepOf", { current: stepIndex + 1, total: steps.length })}
          </p>

          <ShopOrderGuideIllustration icon={step.icon} />

          <h2 id="shop-order-guide-title" className="mt-2 text-center text-lg font-bold text-brand-green">
            {t(locale, step.titleKey)}
          </h2>
          <p className="mt-2 text-center text-sm leading-relaxed text-zinc-600">{t(locale, step.bodyKey)}</p>

          <div className="mt-4 flex justify-center gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === stepIndex ? "w-6 bg-brand-green" : "w-1.5 bg-brand-green/25"
                }`}
              />
            ))}
          </div>

          <div className="mt-5 flex gap-2">
            {stepIndex > 0 ? (
              <button type="button" onClick={back} className="btn-secondary flex-1 py-2.5 text-sm">
                {t(locale, "shopOrderGuide.back")}
              </button>
            ) : (
              <button type="button" onClick={finish} className="btn-secondary flex-1 py-2.5 text-sm">
                {t(locale, "shopOrderGuide.skip")}
              </button>
            )}
            <button type="button" onClick={next} className="btn-primary flex-1 py-2.5 text-sm">
              {isLast ? t(locale, "shopOrderGuide.done") : t(locale, "shopOrderGuide.next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ShopOrderGuideHelpButton({
  locale,
  onClick,
}: {
  locale: Locale;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full bg-brand-cream px-3 py-1.5 text-xs font-semibold text-brand-green ring-1 ring-brand-green/20"
    >
      <HelpCircle className="h-3.5 w-3.5" />
      {t(locale, "shopOrderGuide.showGuide")}
    </button>
  );
}
