"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { VoiceInput } from "./VoiceInput";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import {
  BILL_PRESET_GROUPS,
  billPresetItemsForGroup,
  type BillPresetItemId,
} from "@/lib/bill-preset-items";

type DropdownPos = { top: number; left: number; width: number };

export function BillPieceNameField({
  locale,
  value,
  onChange,
  onPresetSelect,
  presetId,
  placeholder,
  ariaLabel,
}: {
  locale: Locale;
  value: string;
  onChange: (name: string) => void;
  onPresetSelect: (presetId: BillPresetItemId, label: string) => void;
  presetId?: string;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<DropdownPos | null>(null);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  const measure = () => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left, width: r.width });
  };

  useEffect(() => {
    if (!open) return;
    measure();
    const onScrollOrResize = () => measure();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      const menu = document.getElementById(menuId);
      if (menu?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const openList = () => {
    measure();
    setOpen(true);
  };

  const pick = (id: BillPresetItemId, label: string) => {
    onPresetSelect(id, label);
    setOpen(false);
  };

  const menu =
    open && pos
      ? createPortal(
          <div
            id={menuId}
            style={{ top: pos.top, left: pos.left, width: pos.width }}
            className="fixed z-[200] max-h-56 overflow-y-auto overscroll-contain rounded-xl border border-brand-green/20 bg-white py-1 shadow-lg"
            onMouseDown={(e) => e.preventDefault()}
          >
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              {t(locale, "billPresetPickHint")}
            </p>
            {BILL_PRESET_GROUPS.map((group) => {
              const items = billPresetItemsForGroup(group.id);
              if (items.length === 0) return null;

              return (
                <section key={group.id}>
                  <p className="sticky top-0 bg-brand-cream/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-green-soft backdrop-blur-sm">
                    {t(locale, group.labelKey)}
                  </p>
                  <ul>
                    {items.map((item) => {
                      const label = t(locale, item.labelKey);
                      const active = value === label;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => pick(item.id, label)}
                            className={`w-full px-3 py-2.5 text-left text-sm ${
                              active
                                ? "bg-brand-green/10 font-semibold text-brand-green"
                                : "text-zinc-800 hover:bg-brand-cream active:bg-brand-cream"
                            }`}
                          >
                            {label}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={rootRef} className="relative min-w-0">
      <div ref={anchorRef} className="flex min-w-0 items-stretch gap-0.5">
        <div className="min-w-0 flex-1">
          <VoiceInput
            locale={locale}
            value={value}
            onChange={onChange}
            adaptOnLocaleChange={!presetId}
            onFocus={openList}
            onClick={openList}
            placeholder={placeholder}
            aria-label={ariaLabel}
            className="w-full"
            micVariant="micInside"
            micErrorLabel={t(locale, "micPermissionError")}
            startLabel={t(locale, "startListening")}
            stopLabel={t(locale, "stopListening")}
          />
        </div>
        <button
          type="button"
          aria-label={t(locale, "billPresetPickTitle")}
          aria-expanded={open}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => (open ? setOpen(false) : openList())}
          className={`shrink-0 rounded-lg border px-1.5 ${
            open
              ? "border-brand-green bg-brand-green text-brand-gold"
              : "border-brand-green/20 bg-brand-cream text-brand-green hover:bg-brand-green/10"
          }`}
        >
          <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {menu}
    </div>
  );
}
