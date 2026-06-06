"use client";

import { useState, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { toggleSavedShop } from "@/app/customer/actions";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";

export function SaveShopButton({
  shopId,
  isSaved,
  locale,
  compact,
}: {
  shopId: string;
  isSaved: boolean;
  locale: Locale;
  compact?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(isSaved);

  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? t(locale, "removeFromMyShops") : t(locale, "saveShop")}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        startTransition(async () => {
          const next = await toggleSavedShop(shopId);
          setSaved(next);
        });
      }}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full font-semibold transition ${
        compact ? "p-2" : "px-2.5 py-1 text-xs"
      } ${
        saved
          ? "bg-brand-gold/30 text-brand-green"
          : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:text-brand-green"
      }`}
    >
      <Bookmark className={`h-4 w-4 ${saved ? "fill-brand-gold text-brand-gold" : ""}`} />
      {!compact && (saved ? t(locale, "savedShop") : t(locale, "saveShop"))}
    </button>
  );
}
